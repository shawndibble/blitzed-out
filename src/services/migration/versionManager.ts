/**
 * Version management module for handling version checks and updates
 */

import {
  MIGRATION_KEY,
  BACKGROUND_MIGRATION_KEY,
  MIGRATION_IN_PROGRESS_KEY,
  CURRENT_LANGUAGE_MIGRATION_KEY,
  BACKGROUND_MIGRATION_IN_PROGRESS_KEY,
  MIGRATION_VERSION,
} from './constants';
import { MigrationStatus, VersionCheckResult } from './types';
import { safeLocalStorage, logError } from './errorHandling';

/**
 * Check if migration version has changed and clear outdated data
 */
export const checkAndHandleVersionChange = (): VersionCheckResult => {
  try {
    const status = safeLocalStorage.getJSON<MigrationStatus>(MIGRATION_KEY);
    if (!status) {
      return { versionChanged: false };
    }

    const oldVersion = status.version;
    const versionChanged = oldVersion !== MIGRATION_VERSION;

    if (versionChanged) {
      // Clear all migration-related localStorage
      clearAllMigrationData();
      return { versionChanged: true, oldVersion };
    }

    return { versionChanged: false, oldVersion };
  } catch (error) {
    logError('error', 'checkAndHandleVersionChange', error);
    return { versionChanged: false };
  }
};

/**
 * Clear all migration-related data from localStorage
 */
export const clearAllMigrationData = (): void => {
  safeLocalStorage.removeItem(MIGRATION_KEY);
  safeLocalStorage.removeItem(BACKGROUND_MIGRATION_KEY);
  safeLocalStorage.removeItem(MIGRATION_IN_PROGRESS_KEY);
  safeLocalStorage.removeItem(CURRENT_LANGUAGE_MIGRATION_KEY);
  safeLocalStorage.removeItem(BACKGROUND_MIGRATION_IN_PROGRESS_KEY);
};

/**
 * Get current migration version
 */
export const getCurrentMigrationVersion = (): string => {
  return MIGRATION_VERSION;
};

/**
 * Check if a version change requires data migration
 */
export const requiresDataMigration = (oldVersion?: string): boolean => {
  if (!oldVersion) return true;

  // Add logic here for version-specific migration requirements
  // For now, any version change requires migration
  return oldVersion !== MIGRATION_VERSION;
};
