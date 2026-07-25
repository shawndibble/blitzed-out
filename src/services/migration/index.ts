/**
 * Live seeding path for default content: migrate the current language on
 * demand, and let recovery force a fresh reseed.
 *
 * This is the surviving surface of what used to be a broader migration
 * orchestrator (see git history for migrateActionGroups / runMigrationIfNeeded
 * / migrateRemainingLanguages and friends): those functions had no callers
 * left once the current-locale seeding path below replaced them, so they
 * and their supporting statusManager/versionManager exports were deleted
 * rather than kept as dead weight.
 *
 * - types: Type definitions and interfaces
 * - constants: Configuration and constant values
 * - errorHandling: Centralized error handling patterns
 * - statusManager: localStorage-based migration tracking
 * - fileDiscovery: Dynamic file and locale discovery
 * - importOperations: File importing and data conversion
 * - validationUtils: Integrity checks and validation
 */

import { MIGRATION_TIMEOUT, GAME_MODES } from './constants';
import {
  isLanguageMigrationInProgress,
  setLanguageMigrationInProgress,
  markLanguageMigrated,
  isCurrentLanguageMigrationCompleted,
  resetMigrationStatus,
} from './statusManager';
import { getCurrentLanguage } from './fileDiscovery';
import { importGroupsForLocaleAndGameMode } from './importOperations';
import { logError } from './errorHandling';

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
      const gameModes = GAME_MODES;

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
          const { removeDuplicateGroups } = await import('@/stores/contentLibrary');
          await removeDuplicateGroups(currentLocale, gameMode);
        } catch (error) {
          logError('warn', `cleanup:${currentLocale}/${gameMode}`, error);
        }
      }

      // Re-apply disabled-default state to any freshly-seeded tile rows. Newly
      // imported defaults arrive enabled; the disabled-defaults table is the
      // source of truth, so this keeps disables surviving a re-seed/recovery.
      try {
        const { reconcileDisabledRows } = await import('@/stores/disabledDefaults');
        await reconcileDisabledRows();
      } catch (error) {
        logError('warn', 'reconcileDisabledRows', error);
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
 * Developer/recovery utility: force a fresh migration by clearing all
 * migration status and the seeded content tables. Used by
 * syncRecoveryService to rebuild after detected data-loss corruption.
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
