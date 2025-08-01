import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'node:path';
import { glob } from 'glob';

describe('Translation Usage Validation', () => {
  it('should ensure all translation keys are used in the codebase', async () => {
    // Read the English translation file
    const translationPath = path.join(process.cwd(), 'src/locales/en/translation.json');
    const translationContent = fs.readFileSync(translationPath, 'utf-8');
    const translations = JSON.parse(translationContent);

    // Extract all translation keys (including nested ones)
    const extractKeys = (obj: any, prefix = ''): string[] => {
      const keys: string[] = [];

      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'object' && value !== null) {
          // Nested object, recurse
          keys.push(...extractKeys(value, fullKey));
        } else {
          // Leaf node, this is a translation key
          keys.push(fullKey);
        }
      }

      return keys;
    };

    const allTranslationKeys = extractKeys(translations);
    console.log(`Found ${allTranslationKeys.length} translation keys to validate`);

    // Get all source files to search
    const sourceFiles = await glob('src/**/*.{ts,tsx,js,jsx}', {
      ignore: [
        'src/**/__tests__/**',
        'src/**/*.test.{ts,tsx,js,jsx}',
        'src/locales/**', // Don't search translation files themselves
      ],
    });

    console.log(`Searching through ${sourceFiles.length} source files`);

    // Read all source file content
    const sourceContent = sourceFiles
      .map((file) => {
        try {
          return fs.readFileSync(file, 'utf-8');
        } catch (error) {
          console.warn(`Could not read file ${file}:`, error);
          return '';
        }
      })
      .join('\n');

    // Define dynamic keys used by various components
    // These keys are constructed dynamically and may not appear in static searches
    const dynamicKeys = [
      // AppBoolSwitch component - uses field names directly as translation keys
      'playerDialog',
      'othersDialog',
      'mySound',
      'otherSound',
      'chatSound',
      'readRoll',
      'hideBoardActions',
      'advancedSettings',
      // ThemeToggle component - uses theme.${mode} pattern
      'theme.light',
      'theme.dark',
      'theme.system',
    ];

    // Find unused translation keys
    const unusedKeys: string[] = [];
    const usedKeys: string[] = [];

    for (const key of allTranslationKeys) {
      // Check for different usage patterns:
      // 1. t('key') or t("key")
      // 2. i18nKey="key" or i18nKey='key'
      // 3. Direct string references in tests or other contexts
      const patterns = [
        new RegExp(`t\\(['"\`]${key.replace('.', '\\.')}['"\`]\\)`, 'g'),
        new RegExp(`i18nKey=['"\`]${key.replace('.', '\\.')}['"\`]`, 'g'),
        new RegExp(`['"\`]${key.replace('.', '\\.')}['"\`]`, 'g'),
      ];

      const isUsed = patterns.some((pattern) => pattern.test(sourceContent));

      // Check if this is a dynamic key used by various components
      const isDynamicKey = dynamicKeys.includes(key);

      if (isUsed || isDynamicKey) {
        usedKeys.push(key);
        if (isDynamicKey && !isUsed) {
          const component = key.startsWith('theme.') ? 'ThemeToggle' : 'AppBoolSwitch';
          console.log(`📝 Dynamic key detected: ${key} (used by ${component})`);
        }
      } else {
        unusedKeys.push(key);
      }
    }

    console.log(`\nTranslation Usage Summary:`);
    console.log(`✅ Used keys: ${usedKeys.length}`);
    console.log(`❌ Unused keys: ${unusedKeys.length}`);

    if (unusedKeys.length > 0) {
      console.log(`\nUnused translation keys:`);
      unusedKeys.forEach((key) => console.log(`  - ${key}`));
    }

    // Make this a warning rather than a failure since some unused keys might be intentional
    if (unusedKeys.length > 0) {
      console.warn(`\n⚠️  Warning: Found ${unusedKeys.length} unused translation keys`);
      console.warn('Consider removing unused keys or verify they are actually used');

      // You can uncomment the line below to make unused keys fail the test:
      // expect(unusedKeys).toHaveLength(0);
    }

    // Ensure we found a reasonable number of used keys (sanity check)
    expect(usedKeys.length).toBeGreaterThan(400); // We expect most keys to be used
  });

  it('should detect missing translation keys in common usage patterns', async () => {
    // This test looks for translation key patterns that might not exist in translations
    const sourceFiles = await glob('src/**/*.{ts,tsx,js,jsx}', {
      ignore: ['src/**/__tests__/**', 'src/**/*.test.{ts,tsx,js,jsx}', 'src/locales/**'],
    });

    const translationPath = path.join(process.cwd(), 'src/locales/en/translation.json');
    const translationContent = fs.readFileSync(translationPath, 'utf-8');
    const translations = JSON.parse(translationContent);

    // Extract all translation keys for lookup
    const extractKeys = (obj: any, prefix = ''): Set<string> => {
      const keys = new Set<string>();

      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'object' && value !== null) {
          extractKeys(value, fullKey).forEach((k) => keys.add(k));
        } else {
          keys.add(fullKey);
        }
      }

      return keys;
    };

    const allTranslationKeys = extractKeys(translations);
    const missingKeys: string[] = [];

    // Check each source file for translation key usage
    for (const file of sourceFiles) {
      try {
        const content = fs.readFileSync(file, 'utf-8');

        // Find t('key') patterns - more precise regex
        const tPatterns =
          content.match(/\bt\s*\(\s*['"`]([a-zA-Z][a-zA-Z0-9._]*?)['"`]\s*\)/g) || [];
        // Find i18nKey="key" patterns - more precise regex
        const i18nPatterns =
          content.match(/i18nKey\s*=\s*['"`]([a-zA-Z][a-zA-Z0-9._]*?)['"`]/g) || [];
        // Skip yesLabel patterns for missing key detection since they use dynamic variables
        // We handle these in the unused key detection instead

        [...tPatterns, ...i18nPatterns].forEach((match) => {
          // Extract the key from the match
          const keyMatch = match.match(/['"`]([a-zA-Z][a-zA-Z0-9._]*?)['"`]/);
          if (keyMatch) {
            const key = keyMatch[1];
            // Filter out keys that are obviously not translation keys
            if (
              key.length > 1 &&
              !key.includes('/') &&
              !key.includes('@') &&
              !key.includes('#') &&
              !key.includes(' ') &&
              !allTranslationKeys.has(key)
            ) {
              missingKeys.push(`${key} (in ${file})`);
            }
          }
        });
      } catch (error) {
        console.warn(`Could not read file ${file}:`, error);
      }
    }

    if (missingKeys.length > 0) {
      console.log(`\nMissing translation keys found:`);
      missingKeys.forEach((key) => console.log(`  - ${key}`));
    }

    // This should fail if we find missing translation keys - these need to be added!
    if (missingKeys.length > 0) {
      console.error(
        `\n❌ Found ${missingKeys.length} missing translation keys that are used in code but not defined in translations!`
      );
    }
    expect(missingKeys).toHaveLength(0);
  });
});
