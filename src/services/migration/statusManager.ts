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
import {
  MigrationStatus,
  BackgroundMigrationStatus,
  MigrationLockStatus,
  LanguageMigrationStatus,
  MigrationStatusSnapshot,
} from './types';
import { safeLocalStorage, logError } from './errorHandling';

/**
 * Check if main migration is in progress
 */
export const isMigrationInProgress = (): boolean => {
  const status = safeLocalStorage.getJSON<MigrationLockStatus>(MIGRATION_IN_PROGRESS_KEY);
  if (!status) return false;

  // Auto-cleanup stale locks
  if (Date.now() - new Date(status.startedAt).getTime() > STALE_LOCK_TIMEOUT) {
    safeLocalStorage.removeItem(MIGRATION_IN_PROGRESS_KEY);
    return false;
  }

  return status.inProgress;
};

/**
 * Set main migration progress status
 */
export const setMigrationInProgress = (inProgress: boolean): void => {
  if (inProgress) {
    const status: MigrationLockStatus = {
      inProgress: true,
      startedAt: new Date().toISOString(),
    };
    safeLocalStorage.setJSON(MIGRATION_IN_PROGRESS_KEY, status);
  } else {
    safeLocalStorage.removeItem(MIGRATION_IN_PROGRESS_KEY);
  }
};

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
 * Check if background migration is in progress
 */
export const isBackgroundMigrationInProgress = (): boolean => {
  const status = safeLocalStorage.getJSON<MigrationLockStatus>(
    BACKGROUND_MIGRATION_IN_PROGRESS_KEY
  );
  if (!status) return false;

  // Auto-cleanup stale locks (longer timeout for background operations)
  if (Date.now() - new Date(status.startedAt).getTime() > STALE_LOCK_TIMEOUT * 2) {
    safeLocalStorage.removeItem(BACKGROUND_MIGRATION_IN_PROGRESS_KEY);
    return false;
  }

  return status.inProgress;
};

/**
 * Set background migration progress status
 */
export const setBackgroundMigrationInProgress = (inProgress: boolean): void => {
  if (inProgress) {
    const status: MigrationLockStatus = {
      inProgress: true,
      startedAt: new Date().toISOString(),
    };
    safeLocalStorage.setJSON(BACKGROUND_MIGRATION_IN_PROGRESS_KEY, status);
  } else {
    safeLocalStorage.removeItem(BACKGROUND_MIGRATION_IN_PROGRESS_KEY);
  }
};

/**
 * Mark migration as completed
 */
export const markMigrationComplete = (): void => {
  const status: MigrationStatus = {
    version: MIGRATION_VERSION,
    completed: true,
    completedAt: new Date(),
  };
  safeLocalStorage.setJSON(MIGRATION_KEY, status);
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
 * Mark background migration as in progress
 */
export const markBackgroundMigrationInProgress = (inProgress: boolean): void => {
  const bgStatus = safeLocalStorage.getJSON<BackgroundMigrationStatus>(
    BACKGROUND_MIGRATION_KEY
  ) || {
    version: MIGRATION_VERSION,
    completedLanguages: [],
    inProgress: false,
  };

  bgStatus.inProgress = inProgress;
  if (inProgress) {
    bgStatus.startedAt = new Date();
  } else {
    bgStatus.completedAt = new Date();
  }

  safeLocalStorage.setJSON(BACKGROUND_MIGRATION_KEY, bgStatus);
};

/**
 * Check if migration has been completed
 */
export const isMigrationCompleted = (): boolean => {
  const status = safeLocalStorage.getJSON<MigrationStatus>(MIGRATION_KEY);
  if (!status) return false;

  return status.completed && status.version === MIGRATION_VERSION;
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

  // Fallback: check if full migration is complete AND all languages are done
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
 * Get migration status for debugging
 */
export const getMigrationStatus = (): MigrationStatusSnapshot => {
  return {
    main: safeLocalStorage.getJSON<MigrationStatus>(MIGRATION_KEY),
    background: safeLocalStorage.getJSON<BackgroundMigrationStatus>(BACKGROUND_MIGRATION_KEY),
  };
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
