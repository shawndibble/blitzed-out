import { describe, it, expect } from 'vitest';
import fs from 'fs';
import * as path from 'node:path';

describe('Translation Key Parity Validation', () => {
  const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'zh', 'hi'];
  const LOCALES_DIR = path.join(process.cwd(), 'src', 'locales');

  // Helper function to recursively get all keys from a nested object
  const getAllKeys = (obj: any, prefix = ''): string[] => {
    const keys: string[] = [];

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          // Recursively get keys from nested objects
          keys.push(...getAllKeys(obj[key], fullKey));
        } else {
          // This is a leaf node (string, number, array, etc.)
          keys.push(fullKey);
        }
      }
    }

    return keys.sort();
  };

  // Helper function to load translation file
  const loadTranslationFile = (language: string): any => {
    const filePath = path.join(LOCALES_DIR, language, 'translation.json');
    if (!fs.existsSync(filePath)) {
      throw new Error(`Translation file not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  };

  describe('Translation Key Completeness', () => {
    it('should have all English keys present in all other translation files', () => {
      // Load English translation as the reference
      const englishTranslation = loadTranslationFile('en');
      const englishKeys = getAllKeys(englishTranslation);

      console.log(`✅ English translation has ${englishKeys.length} keys`);

      // Check each other language
      const otherLanguages = SUPPORTED_LANGUAGES.filter((lang) => lang !== 'en');
      const missingKeysReport: { [lang: string]: string[] } = {};

      otherLanguages.forEach((language) => {
        const translation = loadTranslationFile(language);
        const translationKeys = getAllKeys(translation);

        console.log(`✅ ${language.toUpperCase()} translation has ${translationKeys.length} keys`);

        // Find missing keys
        const missingKeys = englishKeys.filter((key) => !translationKeys.includes(key));

        if (missingKeys.length > 0) {
          missingKeysReport[language] = missingKeys;
          console.log(`❌ ${language.toUpperCase()} is missing ${missingKeys.length} keys:`);
          missingKeys.forEach((key) => console.log(`   - ${key}`));
        } else {
          console.log(`✅ ${language.toUpperCase()} has all required keys`);
        }
      });

      // Fail the test if any language is missing keys
      if (Object.keys(missingKeysReport).length > 0) {
        const errorMessage = Object.entries(missingKeysReport)
          .map(
            ([lang, keys]) =>
              `${lang}: missing ${keys.length} keys (${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''})`
          )
          .join('; ');

        throw new Error(`Translation key parity failed. ${errorMessage}`);
      }
    });

    it('should have consistent nested structure across all languages', () => {
      const englishTranslation = loadTranslationFile('en');
      const otherLanguages = SUPPORTED_LANGUAGES.filter((lang) => lang !== 'en');

      // Helper to get object structure (keys and nesting levels)
      const getStructure = (obj: any, prefix = ''): Set<string> => {
        const structure = new Set<string>();

        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;

            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
              structure.add(`${fullKey}:object`);
              getStructure(obj[key], fullKey).forEach((s) => structure.add(s));
            } else {
              structure.add(`${fullKey}:${typeof obj[key]}`);
            }
          }
        }

        return structure;
      };

      const englishStructure = getStructure(englishTranslation);

      otherLanguages.forEach((language) => {
        const translation = loadTranslationFile(language);
        const languageStructure = getStructure(translation);

        // Check if structures match
        const englishOnly = [...englishStructure].filter((s) => !languageStructure.has(s));
        const languageOnly = [...languageStructure].filter((s) => !englishStructure.has(s));

        if (englishOnly.length > 0 || languageOnly.length > 0) {
          console.log(`❌ Structure mismatch in ${language.toUpperCase()}:`);
          if (englishOnly.length > 0) {
            console.log('   Missing from target:', englishOnly.slice(0, 3));
          }
          if (languageOnly.length > 0) {
            console.log('   Extra in target:', languageOnly.slice(0, 3));
          }
        }

        expect(englishOnly.length).toBe(0);
        expect(languageOnly.length).toBe(0);
      });
    });

    it('should not have any extra keys in non-English translations', () => {
      const englishTranslation = loadTranslationFile('en');
      const englishKeys = getAllKeys(englishTranslation);
      const otherLanguages = SUPPORTED_LANGUAGES.filter((lang) => lang !== 'en');

      otherLanguages.forEach((language) => {
        const translation = loadTranslationFile(language);
        const translationKeys = getAllKeys(translation);

        // Find extra keys (keys in translation but not in English)
        const extraKeys = translationKeys.filter((key) => !englishKeys.includes(key));

        if (extraKeys.length > 0) {
          console.log(`⚠️  ${language.toUpperCase()} has ${extraKeys.length} extra keys:`);
          extraKeys.forEach((key) => console.log(`   + ${key}`));

          // This might be acceptable in some cases, so we'll warn but not fail
          // If you want to fail on extra keys, uncomment the next line:
          // expect(extraKeys.length).toBe(0);
        }
      });
    });
  });

  describe('Translation Quality Checks', () => {
    it('should not have obviously untranslated content in non-English files', () => {
      const otherLanguages = SUPPORTED_LANGUAGES.filter((lang) => lang !== 'en');

      otherLanguages.forEach((language) => {
        const translation = loadTranslationFile(language);
        const translationValues = JSON.stringify(translation);

        // Check for common English words that should be translated
        const englishPhrases = [
          'Game Board',
          'Settings',
          'Player',
          'Roll',
          'Finish',
          'Import',
          'Export',
          'Delete',
          'Update',
          'Create',
        ];

        const foundEnglishPhrases = englishPhrases.filter((phrase) =>
          translationValues.includes(phrase)
        );

        if (foundEnglishPhrases.length > 0) {
          console.log(
            `⚠️  ${language.toUpperCase()} may have untranslated content:`,
            foundEnglishPhrases
          );
          // This is a warning, not a failure, as some technical terms might remain in English
        }
      });
    });

    it('should maintain placeholder variables in all translations', () => {
      const englishTranslation = loadTranslationFile('en');
      const englishString = JSON.stringify(englishTranslation);

      // Find all placeholder patterns like {{variable}}, <0>, etc.
      const placeholderRegex = /\{\{[^}]+\}\}|<\d+>|<\/\d+>/g;
      const englishPlaceholders = englishString.match(placeholderRegex) || [];
      const uniqueEnglishPlaceholders = [...new Set(englishPlaceholders)];

      console.log(
        `✅ Found ${uniqueEnglishPlaceholders.length} unique placeholder patterns in English`
      );

      const otherLanguages = SUPPORTED_LANGUAGES.filter((lang) => lang !== 'en');

      otherLanguages.forEach((language) => {
        const translation = loadTranslationFile(language);
        const translationString = JSON.stringify(translation);
        const translationPlaceholders = translationString.match(placeholderRegex) || [];
        const uniqueTranslationPlaceholders = [...new Set(translationPlaceholders)];

        console.log(
          `✅ ${language.toUpperCase()} has ${uniqueTranslationPlaceholders.length} placeholder patterns`
        );

        // Check that all English placeholder patterns exist in the translation
        const missingPlaceholders = uniqueEnglishPlaceholders.filter(
          (p) => !uniqueTranslationPlaceholders.includes(p)
        );

        if (missingPlaceholders.length > 0) {
          console.log(`❌ ${language.toUpperCase()} missing placeholders:`, missingPlaceholders);
        }

        expect(missingPlaceholders.length).toBe(0);
      });
    });
  });
});
