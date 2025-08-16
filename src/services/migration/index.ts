/**
 * Main migration service that orchestrates all migration modules
 *
 * This is the refactored migration service broken down into focused modules:
 * - types: Type definitions and interfaces
 * - constants: Configuration and constant values
 * - errorHandling: Centralized error handling patterns
 * - statusManager: localStorage-based migration tracking
 * - versionManager: Version checking and updates
 * - fileDiscovery: Dynamic file and locale discovery
 * - importOperations: File importing and data conversion
 * - validationUtils: Integrity checks and validation
 */

import {
  MIGRATION_TIMEOUT,
  BACKGROUND_MIGRATION_DELAY,
  QUEUE_BACKGROUND_MIGRATION_DELAY,
  IDLE_CALLBACK_TIMEOUT,
  SUPPORTED_LANGUAGES,
} from './constants';
import {
  isMigrationInProgress,
  setMigrationInProgress,
  isLanguageMigrationInProgress,
  setLanguageMigrationInProgress,
  isBackgroundMigrationInProgress,
  setBackgroundMigrationInProgress,
  markMigrationComplete,
  markLanguageMigrated,
  markBackgroundMigrationInProgress,
  isMigrationCompleted,
  isCurrentLanguageMigrationCompleted,
  getMigrationStatus,
  resetMigrationStatus,
} from './statusManager';
import { checkAndHandleVersionChange } from './versionManager';
import { getCurrentLanguage, getAvailableLocales, getAvailableGameModes } from './fileDiscovery';
import { importGroupsForLocaleAndGameMode, cleanupDuplicateGroups } from './importOperations';
import { withErrorHandling, logError, safeLocalStorage } from './errorHandling';

// Re-export types for external consumption
export type {
  MigrationStatus,
  BackgroundMigrationStatus,
  ImportResult,
  VersionCheckResult,
  MigrationStatusSnapshot,
} from './types';

// Re-export key functions that are used by external components
export {
  isMigrationCompleted,
  isCurrentLanguageMigrationCompleted,
  getMigrationStatus,
  resetMigrationStatus,
} from './statusManager';

export { checkAndHandleVersionChange } from './versionManager';
export { verifyMigrationIntegrity, fixMigrationStatusCorruption } from './validationUtils';

/**
 * Main migration function with dynamic discovery
 */
export const migrateActionGroups = async (): Promise<boolean> => {
  const result = await withErrorHandling(
    async () => {
      // Dynamically discover available locales
      const locales = await getAvailableLocales();

      for (const locale of locales) {
        // Dynamically discover available game modes for this locale
        const gameModes = await getAvailableGameModes(locale);

        for (const gameMode of gameModes) {
          try {
            await importGroupsForLocaleAndGameMode(locale, gameMode);
          } catch (error) {
            logError('error', `migrateActionGroups:${locale}/${gameMode}`, error);
          }
        }
      }

      // Clean up any duplicates that might exist from previous migrations
      await cleanupDuplicateGroups(getAvailableLocales, getAvailableGameModes);

      markMigrationComplete();
      return true;
    },
    'migrateActionGroups',
    false
  );

  return result !== null ? result : false;
};

/**
 * Clean up duplicate groups across all locales and game modes
 * Can be called independently of migration
 */
export const cleanupDuplicatesIfNeeded = async (): Promise<number> => {
  const result = await withErrorHandling(
    async () => {
      const status = getMigrationStatus();
      if (status.main?.completed || status.background?.completedLanguages?.length) {
        return await cleanupDuplicateGroups(getAvailableLocales, getAvailableGameModes);
      }
      return 0;
    },
    'cleanupDuplicatesIfNeeded',
    0
  );

  return result !== null ? result : 0;
};

/**
 * Migration function for current language only (fast path)
 */
export const migrateCurrentLanguage = async (locale?: string): Promise<boolean> => {
  const currentLocale = locale || (await getCurrentLanguage());

  try {
    // Check if this language is already migrated
    if (isCurrentLanguageMigrationCompleted(currentLocale)) {
      return true;
    }

    // Prevent concurrent migrations for the same language
    if (isLanguageMigrationInProgress(currentLocale)) {
      // Wait for the current migration to complete with timeout
      await waitForMigrationCompletion(
        () => isLanguageMigrationInProgress(currentLocale),
        `${currentLocale} migration`
      );
      // Re-check if migration is now completed
      return isCurrentLanguageMigrationCompleted(currentLocale);
    }

    setLanguageMigrationInProgress(currentLocale, true);

    try {
      const gameModes = await getAvailableGameModes(currentLocale);

      for (const gameMode of gameModes) {
        try {
          await importGroupsForLocaleAndGameMode(currentLocale, gameMode);
        } catch (error) {
          logError('error', `migrateCurrentLanguage:${currentLocale}/${gameMode}`, error);
        }
      }

      // Clean up duplicates for current language
      for (const gameMode of gameModes) {
        try {
          const { removeDuplicateGroups } = await import('@/stores/customGroups');
          await removeDuplicateGroups(currentLocale, gameMode);
        } catch (error) {
          logError('warn', `cleanup:${currentLocale}/${gameMode}`, error);
        }
      }

      // Mark this language as migrated
      markLanguageMigrated(currentLocale);
      return true;
    } finally {
      setLanguageMigrationInProgress(currentLocale, false);
    }
  } catch (error) {
    logError('error', 'migrateCurrentLanguage', error);
    setLanguageMigrationInProgress(currentLocale, false);
    return false;
  }
};

/**
 * Background migration for remaining languages
 */
export const migrateRemainingLanguages = async (excludeLocale?: string): Promise<void> => {
  try {
    // Prevent concurrent background migrations
    if (isBackgroundMigrationInProgress()) {
      return;
    }

    setBackgroundMigrationInProgress(true);
    const currentLocale = excludeLocale || (await getCurrentLanguage());
    markBackgroundMigrationInProgress(true);

    const allLocales = await getAvailableLocales();
    const remainingLocales = allLocales.filter((locale) => locale !== currentLocale);

    for (const locale of remainingLocales) {
      // Check if already migrated
      if (isCurrentLanguageMigrationCompleted(locale)) {
        continue;
      }

      try {
        const gameModes = await getAvailableGameModes(locale);

        for (const gameMode of gameModes) {
          await importGroupsForLocaleAndGameMode(locale, gameMode);
          // Add small delay to prevent blocking the main thread
          await new Promise((resolve) => setTimeout(resolve, BACKGROUND_MIGRATION_DELAY));
        }

        // Clean up duplicates
        for (const gameMode of gameModes) {
          const { removeDuplicateGroups } = await import('@/stores/customGroups');
          await removeDuplicateGroups(locale, gameMode);
        }

        markLanguageMigrated(locale);
      } catch (error) {
        logError('warn', `migrateRemainingLanguages:${locale}`, error);
        // Continue with other languages even if one fails
      }
    }

    markBackgroundMigrationInProgress(false);

    // Check if all languages are now migrated
    const { BACKGROUND_MIGRATION_KEY } = await import('./constants');
    const bgStatus = safeLocalStorage.getJSON(BACKGROUND_MIGRATION_KEY);
    const completedLanguages = new Set((bgStatus as any)?.completedLanguages || []);
    const allLanguagesCompleted = SUPPORTED_LANGUAGES.every((lang) => completedLanguages.has(lang));

    if (allLanguagesCompleted) {
      markMigrationComplete(); // Mark full migration as complete
    }
  } catch (error) {
    logError('error', 'migrateRemainingLanguages', error);
    markBackgroundMigrationInProgress(false);
    setBackgroundMigrationInProgress(false);
  } finally {
    setBackgroundMigrationInProgress(false);
  }
};

/**
 * Queue background migration for remaining languages
 */
export const queueBackgroundMigration = (excludeLocale?: string): void => {
  try {
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => migrateRemainingLanguages(excludeLocale), {
        timeout: IDLE_CALLBACK_TIMEOUT,
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => migrateRemainingLanguages(excludeLocale), QUEUE_BACKGROUND_MIGRATION_DELAY);
    }
  } catch (error) {
    logError('error', 'queueBackgroundMigration', error);
  }
};

/**
 * Force migration for a specific language (useful when switching languages)
 */
export const ensureLanguageMigrated = async (locale: string): Promise<boolean> => {
  try {
    // Quick check first
    const isCompleted = isCurrentLanguageMigrationCompleted(locale);
    if (isCompleted) {
      return true;
    }

    // If migration is in progress for this language, wait for it
    if (isLanguageMigrationInProgress(locale)) {
      await waitForMigrationCompletion(
        () => isLanguageMigrationInProgress(locale),
        `${locale} migration`
      );
      return isCurrentLanguageMigrationCompleted(locale);
    }

    return await migrateCurrentLanguage(locale);
  } catch (error) {
    logError('error', `ensureLanguageMigrated:${locale}`, error);
    // Graceful fallback: allow the app to continue even if migration fails
    logError('warn', 'Migration failed but app will continue', null, { locale });
    return false;
  }
};

/**
 * Run migration if needed (optimized for current language first)
 */
export const runMigrationIfNeeded = async (): Promise<boolean> => {
  try {
    // Check for version changes first
    const { versionChanged } = checkAndHandleVersionChange();
    if (versionChanged) {
      // Version changed, force fresh migration
    }

    const currentLocale = await getCurrentLanguage();

    // Check if the current language is already migrated
    if (isCurrentLanguageMigrationCompleted(currentLocale)) {
      return true;
    }

    // Prevent concurrent migrations
    if (isMigrationInProgress()) {
      await waitForMigrationCompletion(() => isMigrationInProgress(), 'main migration');
      // Re-check if migration is now completed
      return (
        isMigrationCompleted() || isCurrentLanguageMigrationCompleted(await getCurrentLanguage())
      );
    }

    setMigrationInProgress(true);

    try {
      // Fast path: migrate current language only
      const success = await migrateCurrentLanguage(currentLocale);

      if (success) {
        // Queue background migration for other languages
        queueBackgroundMigration(currentLocale);
      }

      return success;
    } finally {
      setMigrationInProgress(false);
    }
  } catch (error) {
    logError('error', 'runMigrationIfNeeded', error);
    setMigrationInProgress(false);
    // Graceful fallback: allow app to continue even if migration fails
    logError('warn', 'Migration failed but app will continue with existing data', null);
    return false;
  }
};

/**
 * Developer utility: Force a fresh migration by clearing all data
 */
export const forceFreshMigration = async (): Promise<void> => {
  try {
    // Clear all localStorage
    resetMigrationStatus();

    // Optionally clear Dexie database too for a completely fresh start
    const db = await import('@/stores/store');
    await db.default.customGroups.clear();
    await db.default.customTiles.clear();
  } catch (error) {
    logError('error', 'forceFreshMigration', error);
  }
};

/**
 * Wait for a migration to complete with timeout
 */
const waitForMigrationCompletion = async (
  checkInProgress: () => boolean,
  operationName: string
): Promise<void> => {
  const startTime = Date.now();

  while (checkInProgress()) {
    if (Date.now() - startTime > MIGRATION_TIMEOUT) {
      logError(
        'warn',
        `Migration timeout: ${operationName} took longer than ${MIGRATION_TIMEOUT}ms`,
        null
      );
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
};
