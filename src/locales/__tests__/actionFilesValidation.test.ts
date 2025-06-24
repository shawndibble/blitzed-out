import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'path';

const supportedLanguages = ['en', 'es', 'fr'];
const gameModeFolders = ['local', 'online'];

// Helper function to load JSON file
const loadJsonFile = (filePath: string) => {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
};

// Helper function to get all action files for a language and mode
const getActionFiles = (lang: string, mode: string): string[] => {
  try {
    const folderPath = resolve(__dirname, `../${lang}/${mode}`);
    return readdirSync(folderPath)
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.replace('.json', ''));
  } catch {
    return [];
  }
};

// Helper function to get action file content
const getActionFileContent = (lang: string, mode: string, actionType: string) => {
  const filePath = resolve(__dirname, `../${lang}/${mode}/${actionType}.json`);
  return loadJsonFile(filePath);
};

describe('Action Files Validation', () => {
  describe('File structure consistency', () => {
    it('all languages have the same action files for local mode', () => {
      const baseActionFiles = getActionFiles('en', 'local').sort();

      supportedLanguages.slice(1).forEach((lang) => {
        const langActionFiles = getActionFiles(lang, 'local').sort();
        expect(langActionFiles).toEqual(baseActionFiles);
      });
    });

    it('all languages have the same action files for online mode', () => {
      const baseActionFiles = getActionFiles('en', 'online').sort();

      supportedLanguages.slice(1).forEach((lang) => {
        const langActionFiles = getActionFiles(lang, 'online').sort();
        expect(langActionFiles).toEqual(baseActionFiles);
      });
    });

    it('action files exist in all required combinations', () => {
      const baseLocalFiles = getActionFiles('en', 'local');
      const baseOnlineFiles = getActionFiles('en', 'online');

      supportedLanguages.forEach((lang) => {
        gameModeFolders.forEach((mode) => {
          const expectedFiles = mode === 'local' ? baseLocalFiles : baseOnlineFiles;

          expectedFiles.forEach((actionType) => {
            const content = getActionFileContent(lang, mode, actionType);
            expect(content).not.toBeNull();
            expect(content).toBeDefined();
          });
        });
      });
    });
  });

  describe('Action file content structure', () => {
    it('all action files have consistent structure across languages', () => {
      const baseLocalFiles = getActionFiles('en', 'local');
      const baseOnlineFiles = getActionFiles('en', 'online');

      [...baseLocalFiles, ...baseOnlineFiles].forEach((actionType) => {
        gameModeFolders.forEach((mode) => {
          if (
            (mode === 'local' && !baseLocalFiles.includes(actionType)) ||
            (mode === 'online' && !baseOnlineFiles.includes(actionType))
          ) {
            return;
          }

          const baseContent = getActionFileContent('en', mode, actionType);
          if (!baseContent) return;

          supportedLanguages.slice(1).forEach((lang) => {
            const langContent = getActionFileContent(lang, mode, actionType);
            expect(langContent).not.toBeNull();

            // Check that both have the same top-level structure
            expect(Object.keys(langContent).sort()).toEqual(Object.keys(baseContent).sort());

            // Check action levels if they exist
            if (baseContent.actions && langContent.actions) {
              expect(Object.keys(langContent.actions).sort()).toEqual(
                Object.keys(baseContent.actions).sort()
              );
            }
          });
        });
      });
    });

    it('action levels have consistent action counts', () => {
      const allActionTypes = [...getActionFiles('en', 'local'), ...getActionFiles('en', 'online')];

      allActionTypes.forEach((actionType) => {
        gameModeFolders.forEach((mode) => {
          const baseContent = getActionFileContent('en', mode, actionType);
          if (!baseContent?.actions) return;

          supportedLanguages.slice(1).forEach((lang) => {
            const langContent = getActionFileContent(lang, mode, actionType);
            if (!langContent?.actions) return;

            Object.keys(baseContent.actions).forEach((actionLevel) => {
              const baseActions = baseContent.actions[actionLevel];
              const langActions = langContent.actions[actionLevel];

              if (Array.isArray(baseActions) && Array.isArray(langActions)) {
                expect(langActions).toHaveLength(baseActions.length);
              }
            });
          });
        });
      });
    });
  });

  describe('Action content validation', () => {
    it('no empty action strings', () => {
      const allActionTypes = [...getActionFiles('en', 'local'), ...getActionFiles('en', 'online')];

      supportedLanguages.forEach((lang) => {
        allActionTypes.forEach((actionType) => {
          gameModeFolders.forEach((mode) => {
            const content = getActionFileContent(lang, mode, actionType);
            if (!content?.actions) return;

            Object.values(content.actions).forEach((actions: any) => {
              if (Array.isArray(actions)) {
                actions.forEach((action) => {
                  if (typeof action === 'string') {
                    expect(action.trim()).not.toBe('');
                  } else if (typeof action === 'object' && action.action) {
                    expect(action.action.trim()).not.toBe('');
                  }
                });
              }
            });
          });
        });
      });
    });

    it('placeholder variables are consistent across languages', () => {
      const extractPlaceholders = (text: string): string[] => {
        const matches = text.match(/\$\{[^}]+\}/g) || [];
        return matches.sort();
      };

      const allActionTypes = [...getActionFiles('en', 'local'), ...getActionFiles('en', 'online')];

      allActionTypes.forEach((actionType) => {
        gameModeFolders.forEach((mode) => {
          const baseContent = getActionFileContent('en', mode, actionType);
          if (!baseContent?.actions) return;

          supportedLanguages.slice(1).forEach((lang) => {
            const langContent = getActionFileContent(lang, mode, actionType);
            if (!langContent?.actions) return;

            Object.keys(baseContent.actions).forEach((actionLevel) => {
              const baseActions = baseContent.actions[actionLevel];
              const langActions = langContent.actions[actionLevel];

              if (Array.isArray(baseActions) && Array.isArray(langActions)) {
                baseActions.forEach((baseAction: any, index: number) => {
                  const langAction = langActions[index];

                  const baseText = typeof baseAction === 'string' ? baseAction : baseAction?.action;
                  const langText = typeof langAction === 'string' ? langAction : langAction?.action;

                  if (baseText && langText) {
                    const basePlaceholders = extractPlaceholders(baseText);
                    const langPlaceholders = extractPlaceholders(langText);

                    expect(langPlaceholders).toEqual(basePlaceholders);
                  }
                });
              }
            });
          });
        });
      });
    });

    it('action metadata is consistent', () => {
      const allActionTypes = [...getActionFiles('en', 'local'), ...getActionFiles('en', 'online')];

      allActionTypes.forEach((actionType) => {
        gameModeFolders.forEach((mode) => {
          const baseContent = getActionFileContent('en', mode, actionType);
          if (!baseContent) return;

          supportedLanguages.slice(1).forEach((lang) => {
            const langContent = getActionFileContent(lang, mode, actionType);
            if (!langContent) return;

            // Check metadata fields
            ['category', 'type', 'gameMode'].forEach((field) => {
              if (baseContent[field] !== undefined) {
                expect(langContent[field]).toBe(baseContent[field]);
              }
            });

            // Check action metadata
            if (baseContent.actions && langContent.actions) {
              Object.keys(baseContent.actions).forEach((actionLevel) => {
                const baseActions = baseContent.actions[actionLevel];
                const langActions = langContent.actions[actionLevel];

                if (Array.isArray(baseActions) && Array.isArray(langActions)) {
                  baseActions.forEach((baseAction: any, index: number) => {
                    const langAction = langActions[index];

                    if (typeof baseAction === 'object' && typeof langAction === 'object') {
                      // Check non-translatable metadata
                      ['duration', 'difficulty', 'type', 'category'].forEach((metaField) => {
                        if (baseAction[metaField] !== undefined) {
                          expect(langAction[metaField]).toBe(baseAction[metaField]);
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        });
      });
    });
  });

  describe('File completeness', () => {
    it('local mode files vs online mode files coverage', () => {
      const localFiles = getActionFiles('en', 'local');
      const onlineFiles = getActionFiles('en', 'online');

      // Online files should be a subset of local files (some actions might not be suitable for online)
      onlineFiles.forEach((onlineFile) => {
        expect(localFiles).toContain(onlineFile);
      });
    });

    it('no unused action type files across languages', () => {
      // This test ensures that if a file exists in one language, it exists in all
      // and that there are no orphaned files

      const allFoundFiles = new Set<string>();

      supportedLanguages.forEach((lang) => {
        gameModeFolders.forEach((mode) => {
          const files = getActionFiles(lang, mode);
          files.forEach((file) => allFoundFiles.add(`${mode}/${file}`));
        });
      });

      // Verify each found file exists in all languages
      allFoundFiles.forEach((fileKey) => {
        const [mode, actionType] = fileKey.split('/');

        supportedLanguages.forEach((lang) => {
          const content = getActionFileContent(lang, mode, actionType);
          expect(content).not.toBeNull();
        });
      });
    });
  });

  describe('Translation quality checks', () => {
    it('no obviously untranslated content in non-English files', () => {
      const commonEnglishPhrases = [
        'click',
        'press',
        'hold',
        'release',
        'start',
        'stop',
        'begin',
        'end',
        'take',
        'put',
        'place',
        'remove',
        'add',
        'subtract',
        'multiply',
        'seconds',
        'minutes',
        'times',
        'for',
        'until',
        'while',
        'then',
      ];

      const allActionTypes = [...getActionFiles('en', 'local'), ...getActionFiles('en', 'online')];

      ['es', 'fr'].forEach((lang) => {
        allActionTypes.forEach((actionType) => {
          gameModeFolders.forEach((mode) => {
            const content = getActionFileContent(lang, mode, actionType);
            if (!content?.actions) return;

            Object.values(content.actions).forEach((actions: any) => {
              if (Array.isArray(actions)) {
                actions.forEach((action: any) => {
                  const text = typeof action === 'string' ? action : action?.action;
                  if (!text) return;

                  const words = text.toLowerCase().split(/\s+/);
                  const suspiciousWords = words.filter((word) =>
                    commonEnglishPhrases.includes(word.replace(/[.,!?;:()]/, ''))
                  );

                  // Allow some common words but flag obvious untranslated content
                  expect(suspiciousWords.length).toBeLessThan(3);
                });
              }
            });
          });
        });
      });
    });

    it('action files have reasonable content length', () => {
      const allActionTypes = [...getActionFiles('en', 'local'), ...getActionFiles('en', 'online')];

      supportedLanguages.forEach((lang) => {
        allActionTypes.forEach((actionType) => {
          gameModeFolders.forEach((mode) => {
            const filePath = resolve(__dirname, `../${lang}/${mode}/${actionType}.json`);
            try {
              const stats = statSync(filePath);
              // Action files shouldn't be excessively large (>100KB is suspicious)
              expect(stats.size).toBeLessThan(100000);
            } catch {
              // File doesn't exist, which is okay for some combinations
            }
          });
        });
      });
    });
  });

  describe('Data integrity', () => {
    it('valid JSON structure in all action files', () => {
      const allActionTypes = [...getActionFiles('en', 'local'), ...getActionFiles('en', 'online')];

      supportedLanguages.forEach((lang) => {
        allActionTypes.forEach((actionType) => {
          gameModeFolders.forEach((mode) => {
            const content = getActionFileContent(lang, mode, actionType);
            if (content) {
              // Should be valid JSON object
              expect(typeof content).toBe('object');
              expect(content).not.toBeNull();

              // Should have some required fields if it's a proper action file
              if (Object.keys(content).length > 0) {
                expect(content).toHaveProperty('actions');
              }
            }
          });
        });
      });
    });

    it('action levels follow expected patterns', () => {
      const allActionTypes = [...getActionFiles('en', 'local'), ...getActionFiles('en', 'online')];

      allActionTypes.forEach((actionType) => {
        gameModeFolders.forEach((mode) => {
          const baseContent = getActionFileContent('en', mode, actionType);
          if (!baseContent?.actions) return;

          const actionKeys = Object.keys(baseContent.actions);

          // Should have at least one action level
          expect(actionKeys.length).toBeGreaterThan(0);
        });
      });
    });
  });
});
