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
  const bgStatus = safeLocalStorage.getJSON<BackgroundMigrationStatus>(
    BACKGROUND_MIGRATION_KEY
  ) || {
    version: MIGRATION_VERSION,
    completedLanguages: [],
    inProgress: false,
  };

  // Use Set to ensure uniqueness and atomic update
  const completedSet = new Set(bgStatus.completedLanguages);
  completedSet.add(locale);
  bgStatus.completedLanguages = Array.from(completedSet);

  safeLocalStorage.setJSON(BACKGROUND_MIGRATION_KEY, bgStatus);
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
 */
export const isCurrentLanguageMigrationCompleted = (locale: string): boolean => {
  // Check background migration status for specific language
  const bgStatus = safeLocalStorage.getJSON<BackgroundMigrationStatus>(BACKGROUND_MIGRATION_KEY);

  if (bgStatus && bgStatus.completedLanguages.includes(locale)) {
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
