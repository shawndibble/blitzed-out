import { describe, it, expect } from 'vitest';
import fs from 'fs';
import * as path from 'node:path';

describe('Action Count Parity Validation', () => {
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

  // Helper function to parse JSON file with BOM handling
  const parseJsonFile = (filePath: string) => {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Remove BOM if present
    if (content.charCodeAt(0) === 0xfeff) {
      content = content.slice(1);
    }

    return JSON.parse(content);
  };

  // Helper function to count actions in a file
  const countActionsInFile = (filePath: string) => {
    try {
      const data = parseJsonFile(filePath);
      if (!data.actions || typeof data.actions !== 'object') {
        return { intensityLevels: 0, totalActions: 0, actionBreakdown: {}, actionsByPosition: [] };
      }

      const actionBreakdown: Record<string, number> = {};
      const actionsByPosition: number[] = [];
      let totalActions = 0;

      Object.entries(data.actions).forEach(([intensity, actions]) => {
        if (Array.isArray(actions)) {
          actionBreakdown[intensity] = actions.length;
          actionsByPosition.push(actions.length);
          totalActions += actions.length;
        }
      });

      return {
        intensityLevels: Object.keys(data.actions).length,
        totalActions,
        actionBreakdown,
        actionsByPosition,
      };
    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error);
      // Throw the error to fail the test instead of returning zeros
      throw new Error(`Failed to parse ${filePath}: ${error}`);
    }
  };

  describe('Action Count Consistency Across Languages', () => {
    it('should have identical action counts across all languages for each file', () => {
      const languages = SUPPORTED_LANGUAGES;
      const inconsistencies: string[] = [];
      const summary: Record<string, Record<string, any>> = {};

      languages.forEach((lang) => {
        summary[lang] = {};
        GAME_MODES.forEach((mode) => {
          const modePath = path.join(LOCALES_DIR, lang, mode);
          const files = getJsonFiles(modePath);

          files.forEach((file) => {
            const filePath = path.join(modePath, file);
            const fileKey = `${mode}/${file}`;

            if (!summary[lang][fileKey]) {
              summary[lang][fileKey] = countActionsInFile(filePath);
            }
          });
        });
      });

      // Use English as the reference for comparison
      const englishData = summary['en'];

      // Compare each language against English
      languages
        .filter((lang) => lang !== 'en')
        .forEach((lang) => {
          Object.keys(englishData).forEach((fileKey) => {
            const englishStats = englishData[fileKey];
            const langStats = summary[lang][fileKey];

            if (!langStats) {
              inconsistencies.push(`❌ ${lang}/${fileKey}: FILE MISSING`);
              return;
            }

            // Check intensity level count
            if (englishStats.intensityLevels !== langStats.intensityLevels) {
              inconsistencies.push(
                `❌ ${lang}/${fileKey}: STRUCTURAL MISMATCH - Intensity levels English: ${englishStats.intensityLevels}, ${lang}: ${langStats.intensityLevels}`
              );
            }

            // Check total action count
            if (englishStats.totalActions !== langStats.totalActions) {
              inconsistencies.push(
                `❌ ${lang}/${fileKey}: Total actions mismatch - English: ${englishStats.totalActions}, ${lang}: ${langStats.totalActions}`
              );
            }

            // Only compare individual intensities if structure matches
            if (
              englishStats.intensityLevels === langStats.intensityLevels &&
              englishStats.actionsByPosition &&
              langStats.actionsByPosition
            ) {
              // Compare each intensity position
              for (let index = 0; index < englishStats.actionsByPosition.length; index++) {
                const englishCount = englishStats.actionsByPosition[index] || 0;
                const langCount = langStats.actionsByPosition[index] || 0;

                if (englishCount !== langCount) {
                  const englishIntensityName =
                    Object.keys(englishStats.actionBreakdown)[index] || `position_${index}`;
                  const langIntensityName =
                    Object.keys(langStats.actionBreakdown)[index] || `position_${index}`;
                  inconsistencies.push(
                    `❌ ${lang}/${fileKey}[${index}]: "${englishIntensityName}"(${englishCount}) vs "${langIntensityName}"(${langCount})`
                  );
                }
              }
            } else if (englishStats.intensityLevels !== langStats.intensityLevels) {
              // Report the actual structure for debugging
              const englishStructure = englishStats.actionsByPosition?.join(',') || 'none';
              const langStructure = langStats.actionsByPosition?.join(',') || 'none';
              inconsistencies.push(
                `❌ ${lang}/${fileKey}: STRUCTURE MISMATCH - English: [${englishStructure}], ${lang}: [${langStructure}]`
              );
            }
          });
        });

      // Fail the test if there are inconsistencies with detailed error message
      if (inconsistencies.length > 0) {
        const errorMessage = [
          `Found ${inconsistencies.length} action count inconsistencies:`,
          ...inconsistencies.slice(0, 10),
          ...(inconsistencies.length > 10
            ? [`... and ${inconsistencies.length - 10} more issues`]
            : []),
        ].join('\n');

        console.error('❌ ACTION COUNT INCONSISTENCIES FOUND:', errorMessage);
        throw new Error(errorMessage);
      }
    });
  });

  describe('Sample File Validation', () => {
    it('should validate key files have proper structure', () => {
      const keyFiles = ['buttPlay.json', 'bating.json', 'bondage.json'];
      const languages = SUPPORTED_LANGUAGES;

      keyFiles.forEach((filename) => {
        languages.forEach((lang) => {
          const localPath = path.join(LOCALES_DIR, lang, 'local', filename);

          if (fs.existsSync(localPath)) {
            const stats = countActionsInFile(localPath);
            expect(stats.intensityLevels).toBeGreaterThan(0);
            expect(stats.totalActions).toBeGreaterThan(0);
            expect(Object.keys(stats.actionBreakdown)).toHaveLength(stats.intensityLevels);
          }
        });
      });
    });
  });
});
