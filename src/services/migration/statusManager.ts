/**
 * Status management module for localStorage-based migration tracking
 */

import {
  MIGRATION_KEY,
  BACKGROUND_MIGRATION_KEY,
  MIGRATION_IN_PROGRESS_KEY,
  CURRENT_LANGUAGE_MIGRATION_KEY,
  BACKGROUND_MIGRATION_IN_PROGRESS_KEY,
  MIGRATION_VERSION,
  STALE_LOCK_TIMEOUT,
  SUPPORTED_LANGUAGES,
} from './constants';
import { MigrationStatus, BackgroundMigrationStatus, LanguageMigrationStatus } from './types';
import { safeLocalStorage, logError } from './errorHandling';

/**
 * Check if language migration is in progress
 */
export const isLanguageMigrationInProgress = (locale: string): boolean => {
  const status = safeLocalStorage.getJSON<LanguageMigrationStatus>(CURRENT_LANGUAGE_MIGRATION_KEY);
  if (!status) return false;

  // Auto-cleanup stale locks
  if (Date.now() - new Date(status.startedAt).getTime() > STALE_LOCK_TIMEOUT) {
    safeLocalStorage.removeItem(CURRENT_LANGUAGE_MIGRATION_KEY);
    return false;
  }

  return status.locales && status.locales.includes(locale);
};

/**
 * Set language migration progress status
 */
export const setLanguageMigrationInProgress = (locale: string, inProgress: boolean): void => {
  const status = safeLocalStorage.getJSON<LanguageMigrationStatus>(
    CURRENT_LANGUAGE_MIGRATION_KEY
  ) || {
    locales: [],
    startedAt: new Date().toISOString(),
  };

  if (inProgress) {
    if (!status.locales.includes(locale)) {
      status.locales.push(locale);
      status.startedAt = new Date().toISOString();
    }
  } else {
    status.locales = status.locales.filter((l) => l !== locale);
    if (status.locales.length === 0) {
      safeLocalStorage.removeItem(CURRENT_LANGUAGE_MIGRATION_KEY);
      return;
    }
  }

  safeLocalStorage.setJSON(CURRENT_LANGUAGE_MIGRATION_KEY, status);
};

/**
 * Mark a specific language as migrated in background status
 */
export const markLanguageMigrated = (locale: string): void => {
  const stored = safeLocalStorage.getJSON<BackgroundMigrationStatus>(BACKGROUND_MIGRATION_KEY);

  // Completions recorded against an older MIGRATION_VERSION are void: the
  // bundles they seeded from are gone, so every locale owes a re-seed. Carry
  // the list forward only while the version matches.
  const completedSet = new Set(
    stored?.version === MIGRATION_VERSION ? stored.completedLanguages : []
  );
  completedSet.add(locale);

  safeLocalStorage.setJSON(BACKGROUND_MIGRATION_KEY, {
    ...stored,
    version: MIGRATION_VERSION,
    completedLanguages: Array.from(completedSet),
    inProgress: stored?.inProgress ?? false,
  });
};

/**
 * Whether any locale has ever been seeded on this device. Used as the
 * app-start analytics cohort signal ("has seeded content before", a
 * deliberate stand-in for "has used the app before"). Diverges from that in
 * two directions: a user who cleared/never populated Dexie while keeping
 * localStorage reads as "seeded" when they aren't; a returning user whose
 * corrupted status was reset by fixMigrationStatusCorruption reads as
 * "never seeded" until the next migration completes. Neither is worth a
 * second predicate.
 */
export const hasSeededAnyLocale = (): boolean => {
  const bgStatus = safeLocalStorage.getJSON<BackgroundMigrationStatus>(BACKGROUND_MIGRATION_KEY);
  return !!bgStatus && bgStatus.completedLanguages.length > 0;
};

/**
 * Check if current language migration has been completed
 *
 * Version-sensitive: a `MIGRATION_VERSION` bump invalidates every recorded
 * completion, so bundle content that changed (reworded actions, renamed
 * intensity labels, pruned defaults) reaches devices that already seeded.
 * Re-seeding is idempotent — `getNewTiles` skips tiles already present and
 * `mergeSeedIntensities` keeps user-appended levels — so the cost of a bump is
 * one extra pass over the current locale's groups, not a content reset.
 */
export const isCurrentLanguageMigrationCompleted = (locale: string): boolean => {
  // Check background migration status for specific language
  const bgStatus = safeLocalStorage.getJSON<BackgroundMigrationStatus>(BACKGROUND_MIGRATION_KEY);

  if (
    bgStatus &&
    bgStatus.version === MIGRATION_VERSION &&
    bgStatus.completedLanguages.includes(locale)
  ) {
    return true;
  }

  // Fallback: check if full migration is complete AND all languages are done.
  // MIGRATION_KEY is never written by any live path (its sole writer was the
  // deleted markMigrationComplete/dead orchestration); this branch is inert
  // on any install created after that path stopped running, but real
  // installs may still carry a legacy value, so the read stays.
  const status = safeLocalStorage.getJSON<MigrationStatus>(MIGRATION_KEY);
  if (status && status.completed && status.version === MIGRATION_VERSION) {
    // Only return true if this is a full migration (not just current language)
    if (bgStatus) {
      return SUPPORTED_LANGUAGES.every((lang) => bgStatus.completedLanguages.includes(lang));
    }
    // If no background status, assume full migration means all languages are done
    return true;
  }

  return false;
};

/**
 * Reset migration status (for debugging/development)
 */
export const resetMigrationStatus = (): void => {
  try {
    safeLocalStorage.removeItem(MIGRATION_KEY);
    safeLocalStorage.removeItem(BACKGROUND_MIGRATION_KEY);
    safeLocalStorage.removeItem(MIGRATION_IN_PROGRESS_KEY);
    safeLocalStorage.removeItem(CURRENT_LANGUAGE_MIGRATION_KEY);
    safeLocalStorage.removeItem(BACKGROUND_MIGRATION_IN_PROGRESS_KEY);
  } catch (error) {
    logError('error', 'resetMigrationStatus', error);
  }
};
