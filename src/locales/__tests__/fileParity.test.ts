import { describe, it, expect } from 'vitest';
import fs from 'fs';
import * as path from 'node:path';

describe('File Parity Validation', () => {
  const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'zh', 'hi'];
  const GAME_MODES = ['local', 'online'];
  const LOCALES_DIR = path.join(process.cwd(), 'src', 'locales');

  // Helper function to get all JSON files in a directory
  const getJsonFiles = (dirPath: string): string[] => {
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    return fs
      .readdirSync(dirPath)
      .filter((file) => file.endsWith('.json'))
      .sort();
  };

  // Helper function to get all directories in locales folder
  const getLanguageDirectories = (): string[] => {
    return fs
      .readdirSync(LOCALES_DIR)
      .filter((item) => {
        const itemPath = path.join(LOCALES_DIR, item);
        return fs.statSync(itemPath).isDirectory();
      })
      .filter((dir) => SUPPORTED_LANGUAGES.includes(dir))
      .sort();
  };

  describe('Language Directory Structure', () => {
    it('should have all expected language directories', () => {
      const actualLanguages = getLanguageDirectories();
      expect(actualLanguages).toEqual(SUPPORTED_LANGUAGES.sort());
    });

    it('should have both local and online directories for each language', () => {
      const languages = getLanguageDirectories();

      languages.forEach((lang) => {
        GAME_MODES.forEach((mode) => {
          const modePath = path.join(LOCALES_DIR, lang, mode);
          expect(fs.existsSync(modePath), `Missing ${lang}/${mode} directory`).toBe(true);
        });
      });
    });
  });

  describe('Complete File Parity - Local Mode', () => {
    it('should have identical JSON files across all languages in local folders', () => {
      const languages = getLanguageDirectories();
      const filesByLanguage: Record<string, string[]> = {};

      // Get files for each language
      languages.forEach((lang) => {
        const localPath = path.join(LOCALES_DIR, lang, 'local');
        filesByLanguage[lang] = getJsonFiles(localPath);
      });

      // Use English as the reference (it should be the most complete)
      const referenceFiles = filesByLanguage['en'];
      expect(referenceFiles.length, 'English local files should exist').toBeGreaterThan(0);

      // Verify each language has exactly the same files as English
      languages.forEach((lang) => {
        expect(
          filesByLanguage[lang],
          `${lang}/local should have identical files to en/local`
        ).toEqual(referenceFiles);
      });

      // Verify we have the expected number of files
      expect(referenceFiles.length, 'Should have expected number of local files').toBeGreaterThan(
        0
      );
    });

    it('should verify specific expected local files exist in all languages', () => {
      // Based on the English directory, these are the expected local files
      const expectedLocalFiles = [
        'alcohol.json',
        'ballBusting.json',
        'bating.json',
        'bodyWorship.json',
        'bondage.json',
        'breathPlay.json',
        'buttPlay.json',
        'confessions.json',
        'electric.json',
        'footPlay.json',
        'gasMask.json',
        'humiliation.json',
        'kissing.json',
        'pissPlay.json',
        'poppers.json',
        'spanking.json',
        'stripping.json',
        'throatTraining.json',
        'tickling.json',
        'titTorture.json',
        'vaping.json',
      ].sort();

      const languages = getLanguageDirectories();

      languages.forEach((lang) => {
        const localPath = path.join(LOCALES_DIR, lang, 'local');
        const actualFiles = getJsonFiles(localPath);

        expect(
          actualFiles,
          `${lang}/local is missing files. Expected: ${expectedLocalFiles.join(', ')}`
        ).toEqual(expectedLocalFiles);
      });
    });
  });

  describe('Complete File Parity - Online Mode', () => {
    it('should have identical JSON files across all languages in online folders', () => {
      const languages = getLanguageDirectories();
      const filesByLanguage: Record<string, string[]> = {};

      // Get files for each language
      languages.forEach((lang) => {
        const onlinePath = path.join(LOCALES_DIR, lang, 'online');
        filesByLanguage[lang] = getJsonFiles(onlinePath);
      });

      // Use English as the reference (it should be the most complete)
      const referenceFiles = filesByLanguage['en'];
      expect(referenceFiles.length, 'English online files should exist').toBeGreaterThan(0);

      // Verify each language has exactly the same files as English
      languages.forEach((lang) => {
        expect(
          filesByLanguage[lang],
          `${lang}/online should have identical files to en/online`
        ).toEqual(referenceFiles);
      });

      // Verify we have the expected number of files
      expect(referenceFiles.length, 'Should have expected number of online files').toBeGreaterThan(
        0
      );
    });

    it('should verify specific expected online files exist in all languages', () => {
      // Based on the English directory, these are the expected online files
      const expectedOnlineFiles = [
        'alcohol.json',
        'ballBusting.json',
        'bating.json',
        'bodyWorship.json',
        'buttPlay.json',
        'gasMask.json',
        'pissPlay.json',
        'poppers.json',
        'throatTraining.json',
        'titTorture.json',
        'vaping.json',
      ].sort();

      const languages = getLanguageDirectories();

      languages.forEach((lang) => {
        const onlinePath = path.join(LOCALES_DIR, lang, 'online');
        const actualFiles = getJsonFiles(onlinePath);

        expect(
          actualFiles,
          `${lang}/online is missing files. Expected: ${expectedOnlineFiles.join(', ')}`
        ).toEqual(expectedOnlineFiles);
      });
    });
  });

  describe('Cross-Mode File Consistency', () => {
    it('should have consistent file availability across local and online modes', () => {
      const languages = getLanguageDirectories();

      languages.forEach((lang) => {
        const localPath = path.join(LOCALES_DIR, lang, 'local');
        const onlinePath = path.join(LOCALES_DIR, lang, 'online');

        const localFiles = getJsonFiles(localPath);
        const onlineFiles = getJsonFiles(onlinePath);

        // Every online file should have a corresponding local file
        onlineFiles.forEach((onlineFile) => {
          expect(
            localFiles.includes(onlineFile),
            `${lang}: ${onlineFile} exists in online but not in local`
          ).toBe(true);
        });

        // Verify file counts are reasonable
        expect(localFiles.length, `${lang} should have local files`).toBeGreaterThan(0);
        expect(onlineFiles.length, `${lang} should have online files`).toBeGreaterThan(0);
      });
    });
  });

  describe('File Content Structure Validation', () => {
    it('should validate that all files have proper JSON structure', () => {
      const languages = getLanguageDirectories();

      languages.forEach((lang) => {
        GAME_MODES.forEach((mode) => {
          const modePath = path.join(LOCALES_DIR, lang, mode);
          const files = getJsonFiles(modePath);

          files.forEach((file) => {
            const filePath = path.join(modePath, file);
            let content = fs.readFileSync(filePath, 'utf-8');

            // Remove BOM if present
            if (content.charCodeAt(0) === 0xfeff) {
              content = content.slice(1);
            }

            expect(() => {
              const parsed = JSON.parse(content);
              expect(parsed).toHaveProperty('label');
              expect(parsed).toHaveProperty('type');
              expect(parsed).toHaveProperty('actions');
              expect(typeof parsed.actions).toBe('object');
            }, `${lang}/${mode}/${file} should have valid JSON structure`).not.toThrow();
          });
        });
      });
    });
  });

  describe('Comprehensive Parity Summary', () => {
    it('should provide a complete parity summary', () => {
      const languages = getLanguageDirectories();
      const summary: Record<string, Record<string, number>> = {};
      let totalFiles = 0;

      languages.forEach((lang) => {
        summary[lang] = {};
        GAME_MODES.forEach((mode) => {
          const modePath = path.join(LOCALES_DIR, lang, mode);
          const fileCount = getJsonFiles(modePath).length;
          summary[lang][mode] = fileCount;
          totalFiles += fileCount;
        });
      });

      // Verify all languages have the same number of files in each mode
      const englishLocal = summary['en']['local'];
      const englishOnline = summary['en']['online'];

      languages.forEach((lang) => {
        expect(
          summary[lang]['local'],
          `${lang} local file count should match English (${englishLocal})`
        ).toBe(englishLocal);

        expect(
          summary[lang]['online'],
          `${lang} online file count should match English (${englishOnline})`
        ).toBe(englishOnline);
      });

      // Verify we have the expected total files across all languages
      const expectedTotal = languages.length * (englishLocal + englishOnline);
      expect(
        totalFiles,
        `Total files should be ${expectedTotal} (${languages.length} languages × ${englishLocal + englishOnline} files each)`
      ).toBe(expectedTotal);

      // Verify each language has consistent file counts
      Object.entries(summary).forEach(([lang, modes]) => {
        const total = Object.values(modes).reduce((sum, count) => sum + count, 0);
        const expectedLangTotal = englishLocal + englishOnline;
        expect(total, `${lang} should have ${expectedLangTotal} total files`).toBe(
          expectedLangTotal
        );
      });
    });
  });
});
