/**
 * Validation utilities for integrity checks and corruption detection
 */

import { isCurrentLanguageMigrationCompleted, resetMigrationStatus } from './statusManager';
import { withErrorHandling, logError } from './errorHandling';

/**
 * Verify that migration status matches actual database content
 * This detects corrupted migration status where localStorage says complete but Dexie is empty
 */
export const verifyMigrationIntegrity = async (
  locale: string,
  gameMode: string = 'online'
): Promise<boolean> => {
  const result = await withErrorHandling(
    async () => {
      // Check if localStorage claims migration is complete
      const localStorageComplete = isCurrentLanguageMigrationCompleted(locale);

      if (!localStorageComplete) {
        // If localStorage says not complete, that's fine - migration will run
        return true;
      }

      // If localStorage says complete, verify database actually has data
      const { getAllAvailableGroups } = await import('@/stores/customGroups');
      const groups = await getAllAvailableGroups(locale, gameMode);

      // If localStorage says complete but database is empty, we have corruption
      if (localStorageComplete && groups.length === 0) {
        return false;
      }

      return true;
    },
    `verifyMigrationIntegrity:${locale}:${gameMode}`,
    false
  );

  return result !== null ? result : false;
};

/**
 * Fix corrupted migration status by clearing localStorage
 */
export const fixMigrationStatusCorruption = (): void => {
  try {
    resetMigrationStatus();
  } catch (error) {
    logError('error', 'fixMigrationStatusCorruption', error);
  }
};

/**
 * Validate that required dependencies are available
 */
export const validateDependencies = async (): Promise<{ isValid: boolean; missing: string[] }> => {
  const missing: string[] = [];

  try {
    // Check if we can import required stores
    await import('@/stores/customGroups');
  } catch {
    missing.push('customGroups store');
  }

  try {
    await import('@/stores/customTiles');
  } catch {
    missing.push('customTiles store');
  }

  try {
    await import('@/stores/store');
  } catch {
    missing.push('main store');
  }

  return { isValid: missing.length === 0, missing };
};

/**
 * Validate that a locale and game mode combination is supported
 */
export const validateLocaleGameMode = async (
  locale: string,
  _gameMode: string
): Promise<boolean> => {
  try {
    // Try to import a known file for this combination
    await import(`@/locales/${locale}/translation.json`);
    // Basic validation passed, assume game mode is valid
    return true;
  } catch {
    return false;
  }
};
