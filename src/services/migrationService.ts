import { addCustomGroup, getCustomGroupByName, removeDuplicateGroups } from '@/stores/customGroups';

import { CustomGroupBase } from '@/types/customGroups';
import { CustomTileBase } from '@/types/customTiles';
import { importCustomTiles } from '@/stores/customTiles';
import i18n from '@/i18n';

/**
 * Migration service to convert JSON action files to custom groups and custom tiles in Dexie.
 * Uses Vite's import.meta.glob() for automatic file discovery at build time.
 */

// Supported languages for migration
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'zh', 'hi'] as const;

// Configuration
const MIGRATION_KEY = 'blitzed-out-action-groups-migration';
const MIGRATION_VERSION = '2.1.1';
const BACKGROUND_MIGRATION_KEY = 'blitzed-out-background-migration';

// localStorage-based concurrency control keys for better reliability in hot module reloading environments
const MIGRATION_IN_PROGRESS_KEY = 'blitzed-out-migration-in-progress';
const CURRENT_LANGUAGE_MIGRATION_KEY = 'blitzed-out-current-language-migration';
const BACKGROUND_MIGRATION_IN_PROGRESS_KEY = 'blitzed-out-background-migration-in-progress';

interface MigrationStatus {
  version: string;
  completed: boolean;
  completedAt?: Date;
  currentLanguageOnly?: boolean;
}

interface BackgroundMigrationStatus {
  version: string;
  completedLanguages: string[];
  inProgress: boolean;
  startedAt?: Date;
  completedAt?: Date;
}

// Helper functions for localStorage-based concurrency control
const isMigrationInProgress = (): boolean => {
  try {
    const status = localStorage.getItem(MIGRATION_IN_PROGRESS_KEY);
    if (!status) return false;
    const data = JSON.parse(status);
    // Auto-cleanup stale locks (older than 5 minutes)
    if (Date.now() - new Date(data.startedAt).getTime() > 5 * 60 * 1000) {
      localStorage.removeItem(MIGRATION_IN_PROGRESS_KEY);
      return false;
    }
    return data.inProgress;
  } catch {
    return false;
  }
};

const setMigrationInProgress = (inProgress: boolean): void => {
  try {
    if (inProgress) {
      localStorage.setItem(
        MIGRATION_IN_PROGRESS_KEY,
        JSON.stringify({
          inProgress: true,
          startedAt: new Date().toISOString(),
        })
      );
    } else {
      localStorage.removeItem(MIGRATION_IN_PROGRESS_KEY);
    }
  } catch (error) {
    console.warn('Failed to update migration in progress status:', error);
  }
};

const isLanguageMigrationInProgress = (locale: string): boolean => {
  try {
    const status = localStorage.getItem(CURRENT_LANGUAGE_MIGRATION_KEY);
    if (!status) return false;
    const data = JSON.parse(status);
    // Auto-cleanup stale locks (older than 5 minutes)
    if (Date.now() - new Date(data.startedAt).getTime() > 5 * 60 * 1000) {
      localStorage.removeItem(CURRENT_LANGUAGE_MIGRATION_KEY);
      return false;
    }
    return data.locales && data.locales.includes(locale);
  } catch {
    return false;
  }
};

const setLanguageMigrationInProgress = (locale: string, inProgress: boolean): void => {
  try {
    const status = localStorage.getItem(CURRENT_LANGUAGE_MIGRATION_KEY);
    let data = status ? JSON.parse(status) : { locales: [], startedAt: new Date().toISOString() };

    if (inProgress) {
      if (!data.locales.includes(locale)) {
        data.locales.push(locale);
        data.startedAt = new Date().toISOString();
      }
    } else {
      data.locales = data.locales.filter((l: string) => l !== locale);
      if (data.locales.length === 0) {
        localStorage.removeItem(CURRENT_LANGUAGE_MIGRATION_KEY);
        return;
      }
    }

    localStorage.setItem(CURRENT_LANGUAGE_MIGRATION_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to update language migration in progress status:', error);
  }
};

const isBackgroundMigrationInProgress = (): boolean => {
  try {
    const status = localStorage.getItem(BACKGROUND_MIGRATION_IN_PROGRESS_KEY);
    if (!status) return false;
    const data = JSON.parse(status);
    // Auto-cleanup stale locks (older than 10 minutes)
    if (Date.now() - new Date(data.startedAt).getTime() > 10 * 60 * 1000) {
      localStorage.removeItem(BACKGROUND_MIGRATION_IN_PROGRESS_KEY);
      return false;
    }
    return data.inProgress;
  } catch {
    return false;
  }
};

const setBackgroundMigrationInProgress = (inProgress: boolean): void => {
  try {
    if (inProgress) {
      localStorage.setItem(
        BACKGROUND_MIGRATION_IN_PROGRESS_KEY,
        JSON.stringify({
          inProgress: true,
          startedAt: new Date().toISOString(),
        })
      );
    } else {
      localStorage.removeItem(BACKGROUND_MIGRATION_IN_PROGRESS_KEY);
    }
  } catch (error) {
    console.warn('Failed to update background migration in progress status:', error);
  }
};

/**
 * Check if migration has been completed
 */
export const isMigrationCompleted = (): boolean => {
  try {
    const status = localStorage.getItem(MIGRATION_KEY);
    if (!status) return false;

    const migrationStatus: MigrationStatus = JSON.parse(status);
    return migrationStatus.completed && migrationStatus.version === MIGRATION_VERSION;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
};

/**
 * Check if current language migration has been completed
 */
export const isCurrentLanguageMigrationCompleted = (locale: string): boolean => {
  try {
    // First check background migration status for specific language
    const bgStatus = localStorage.getItem(BACKGROUND_MIGRATION_KEY);
    let backgroundStatus: BackgroundMigrationStatus | null = null;

    if (bgStatus) {
      backgroundStatus = JSON.parse(bgStatus);
      const isCompleted = backgroundStatus!.completedLanguages.includes(locale);
      if (isCompleted) {
        return true;
      }
    }

    // Fallback: check if full migration is complete AND all languages are done
    const status = localStorage.getItem(MIGRATION_KEY);
    if (status) {
      const migrationStatus: MigrationStatus = JSON.parse(status);

      if (migrationStatus.completed && migrationStatus.version === MIGRATION_VERSION) {
        // Only return true if this is a full migration (not just current language)
        // Check if background migration has completed all languages
        if (backgroundStatus) {
          const allLanguagesCompleted = SUPPORTED_LANGUAGES.every((lang) =>
            backgroundStatus!.completedLanguages.includes(lang)
          );
          return allLanguagesCompleted;
        }
        // If no background status, assume full migration means all languages are done
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking current language migration status:', error);
    return false;
  }
};

/**
 * Get current user language from i18next
 */
const getCurrentLanguage = async (): Promise<string> => {
  try {
    // First try: get current language from i18next using proper API
    const resolved = i18n.resolvedLanguage;
    if (resolved && resolved !== 'undefined') {
      return resolved;
    }

    // Second try: get language from i18next instance
    const currentLang = i18n.language;
    if (currentLang && currentLang !== 'undefined') {
      return currentLang;
    }

    // Third try: localStorage fallback
    const storedLanguage = localStorage.getItem('i18nextLng');
    if (storedLanguage && storedLanguage !== 'undefined') {
      return storedLanguage;
    }

    // Fourth try: browser language with proper validation
    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserLang = navigator.language.split('-')[0];
      if (SUPPORTED_LANGUAGES.includes(browserLang as (typeof SUPPORTED_LANGUAGES)[number])) {
        return browserLang;
      }
    }

    // Final fallback: English
    return 'en';
  } catch (error) {
    console.error('Error detecting current language:', error);
    return 'en'; // Safe fallback
  }
};

/**
 * Mark migration as completed
 */
const markMigrationComplete = (): void => {
  const status: MigrationStatus = {
    version: MIGRATION_VERSION,
    completed: true,
    completedAt: new Date(),
  };
  localStorage.setItem(MIGRATION_KEY, JSON.stringify(status));
};

/**
 * Mark a specific language as migrated in background status
 */
const markLanguageMigrated = (locale: string): void => {
  try {
    const bgStatusStr = localStorage.getItem(BACKGROUND_MIGRATION_KEY);
    let bgStatus: BackgroundMigrationStatus;

    if (bgStatusStr) {
      bgStatus = JSON.parse(bgStatusStr);
    } else {
      bgStatus = {
        version: MIGRATION_VERSION,
        completedLanguages: [],
        inProgress: false,
      };
    }

    // Use Set to ensure uniqueness and atomic update
    const completedSet = new Set(bgStatus.completedLanguages);
    completedSet.add(locale);
    bgStatus.completedLanguages = Array.from(completedSet);

    localStorage.setItem(BACKGROUND_MIGRATION_KEY, JSON.stringify(bgStatus));
  } catch (error) {
    console.error('Error marking language as migrated:', error);
  }
};

/**
 * Mark background migration as in progress
 */
const markBackgroundMigrationInProgress = (inProgress: boolean): void => {
  try {
    const bgStatusStr = localStorage.getItem(BACKGROUND_MIGRATION_KEY);
    let bgStatus: BackgroundMigrationStatus;

    if (bgStatusStr) {
      bgStatus = JSON.parse(bgStatusStr);
    } else {
      bgStatus = {
        version: MIGRATION_VERSION,
        completedLanguages: [],
        inProgress: false,
      };
    }

    bgStatus.inProgress = inProgress;
    if (inProgress) {
      bgStatus.startedAt = new Date();
    } else {
      bgStatus.completedAt = new Date();
    }

    localStorage.setItem(BACKGROUND_MIGRATION_KEY, JSON.stringify(bgStatus));
  } catch (error) {
    console.error('Error updating background migration status:', error);
  }
};

/**
 * Import a single action file and convert it to a custom group with custom tiles
 */
const importActionFile = async (
  groupName: string,
  locale: string,
  gameMode: string
): Promise<{ customGroup: CustomGroupBase; customTiles: CustomTileBase[] } | null> => {
  try {
    // Import the action file
    const actionFile = await import(`@/locales/${locale}/${gameMode}/${groupName}.json`);

    // Extract data from the JSON file
    const label = actionFile.label || groupName;
    const type = actionFile.type || 'action';
    const actions = actionFile.actions || {};

    // Convert actions object to intensities array
    const intensities = Object.keys(actions)
      .filter((key) => key !== 'None') // Skip 'None' as it's always included
      .map((intensityName, index) => ({
        id: `${groupName}-${index + 1}`,
        label: intensityName,
        value: index + 1,
        isDefault: true,
      }));

    // Create the custom group
    const customGroup: CustomGroupBase = {
      name: groupName,
      label,
      intensities,
      type,
      isDefault: true,
      locale,
      gameMode,
    };

    // Create custom tiles from the actions
    const customTiles: CustomTileBase[] = [];

    for (const [intensityName, actionList] of Object.entries(actions)) {
      if (intensityName === 'None' || !Array.isArray(actionList)) continue;

      // Find the intensity value for this intensity name
      const intensity = intensities.find((i) => i.label === intensityName);
      if (!intensity) continue;

      // Create a tile for each action in this intensity
      for (const action of actionList) {
        if (typeof action === 'string' && action.trim()) {
          customTiles.push({
            group: groupName,
            intensity: intensity.value,
            action: action.trim(),
            tags: ['default'], // Mark as default tiles from JSON files
            isEnabled: 1,
            isCustom: 0, // These are default tiles, not custom
            gameMode,
            locale,
          });
        }
      }
    }

    return { customGroup, customTiles };
  } catch {
    // Failed to import action file - skip silently
    return null;
  }
};

/**
 * Dynamically discover available locales from the filesystem
 */
const getAvailableLocales = async (): Promise<string[]> => {
  const locales = [...SUPPORTED_LANGUAGES]; // All supported locales
  const existingLocales: string[] = [];

  for (const locale of locales) {
    try {
      // Test if locale exists by trying to import translation file
      await import(`@/locales/${locale}/translation.json`);
      existingLocales.push(locale);
    } catch {
      // Locale doesn't exist, skip it
    }
  }

  return existingLocales;
};

/**
 * Dynamically discover available game modes for a locale
 */
const getAvailableGameModes = async (locale: string): Promise<string[]> => {
  const gameModes = ['local', 'online']; // Known game modes
  const existingGameModes: string[] = [];

  for (const gameMode of gameModes) {
    try {
      // Test if gameMode exists by trying to import any known file
      await import(`@/locales/${locale}/${gameMode}/alcohol.json`);
      existingGameModes.push(gameMode);
    } catch {
      // Game mode doesn't exist for this locale, skip it
    }
  }

  return existingGameModes;
};

/**
 * Dynamically discover action group names for a specific locale and game mode
 * Uses Vite's import.meta.glob to automatically discover all JSON files at build time
 */
const getActionGroupNames = async (locale: string, gameMode: string): Promise<string[]> => {
  // Use Vite's glob import to get all action group files for all locales and game modes
  // This automatically discovers files at build time, eliminating the need for hardcoded lists
  // IMPROVEMENT: Replaced hardcoded array with dynamic discovery using import.meta.glob
  const allActionFiles = import.meta.glob('@/locales/*/*/*.json');

  const existingGroups: string[] = [];
  const targetPath = `/src/locales/${locale}/${gameMode}/`;

  // Filter for files matching the current locale and game mode
  for (const filePath of Object.keys(allActionFiles)) {
    if (filePath.includes(targetPath)) {
      // Extract the group name from the file path
      const fileName = filePath.split('/').pop();
      if (fileName?.endsWith('.json')) {
        const groupName = fileName.replace('.json', '');

        try {
          // Verify the file can be imported (additional safety check)
          await allActionFiles[filePath]();
          existingGroups.push(groupName);
        } catch (error) {
          // File exists but can't be imported, skip it
          console.warn(
            `Found ${groupName} file for ${locale}/${gameMode} but failed to import it:`,
            error
          );
        }
      }
    }
  }

  return existingGroups.sort(); // Sort for consistent ordering
};

/**
 * Import all action groups for a specific locale and game mode
 */
const importGroupsForLocaleAndGameMode = async (
  locale: string,
  gameMode: string
): Promise<{ groupsImported: number; tilesImported: number }> => {
  const groupNames = await getActionGroupNames(locale, gameMode);
  let groupsImported = 0;
  let tilesImported = 0;

  for (const groupName of groupNames) {
    // Check if group already exists to prevent duplicates
    const existingGroup = await getCustomGroupByName(groupName, locale, gameMode);
    if (existingGroup) {
      // Group already exists, skip
      continue;
    }

    const result = await importActionFile(groupName, locale, gameMode);

    if (result) {
      const { customGroup, customTiles } = result;

      try {
        // Add the custom group with error handling for duplicates
        try {
          await addCustomGroup(customGroup);
          groupsImported++;
          // Successfully imported group
        } catch (error) {
          // Handle case where group was added by concurrent migration
          if (error instanceof Error && error.message.includes('already exists')) {
            // Group was already added by concurrent process
          } else {
            throw error; // Re-throw other errors
          }
        }

        // Add the custom tiles if there are any
        if (customTiles.length > 0) {
          // Filter out any tiles that might already exist to prevent duplicates
          try {
            const { getTiles } = await import('@/stores/customTiles');
            const existingTiles = await getTiles({
              locale,
              gameMode,
              group: groupName,
            });

            const newTiles = customTiles.filter((tile) => {
              // Handle case where existingTiles might be undefined or not an array
              if (!existingTiles || !Array.isArray(existingTiles)) {
                return true; // If no existing tiles, all tiles are new
              }

              return !existingTiles.some(
                (existing) =>
                  existing.group === tile.group &&
                  existing.intensity === tile.intensity &&
                  existing.action === tile.action &&
                  existing.gameMode === tile.gameMode &&
                  existing.locale === tile.locale
              );
            });

            if (newTiles.length > 0) {
              try {
                await importCustomTiles(newTiles);
                tilesImported += newTiles.length;
              } catch (error) {
                // Handle case where tiles were added by concurrent migration
                console.warn(`Some tiles may have been added by concurrent process:`, error);
                // Continue processing, don't fail the entire migration
              }
            }
          } catch (tileError) {
            // If tile checking fails, import anyway to ensure migration succeeds
            console.warn(
              `Tile deduplication failed for ${groupName}, importing all tiles:`,
              tileError
            );
            try {
              await importCustomTiles(customTiles);
              tilesImported += customTiles.length;
            } catch (importError) {
              console.warn(`Tile import failed for ${groupName}, continuing:`, importError);
              // Continue with migration even if some tiles fail
            }
          }
        }
      } catch (error) {
        console.error(`Failed to import group ${groupName} for ${locale}/${gameMode}:`, error);
      }
    }
  }

  return { groupsImported, tilesImported };
};

/**
 * Main migration function with dynamic discovery
 */
export const migrateActionGroups = async (): Promise<boolean> => {
  try {
    // Starting action groups migration

    // Dynamically discover available locales
    const locales = await getAvailableLocales();
    // Available locales discovered

    for (const locale of locales) {
      // Dynamically discover available game modes for this locale
      const gameModes = await getAvailableGameModes(locale);
      // Processing game modes for locale

      for (const gameMode of gameModes) {
        try {
          // Processing locale/gameMode
          await importGroupsForLocaleAndGameMode(locale, gameMode);
          // Completed locale/gameMode
        } catch (error) {
          console.error(`Error importing groups for ${locale}/${gameMode}:`, error);
        }
      }
    }

    // Migration completed successfully

    // Clean up any duplicates that might exist from previous migrations
    for (const locale of locales) {
      const gameModes = await getAvailableGameModes(locale);
      for (const gameMode of gameModes) {
        await removeDuplicateGroups(locale, gameMode);
      }
    }

    // Migration completed successfully
    markMigrationComplete();
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
};

/**
 * Clean up duplicate groups across all locales and game modes
 * Can be called independently of migration
 */
export const cleanupDuplicateGroups = async (): Promise<number> => {
  try {
    const locales = await getAvailableLocales();
    let totalDuplicatesRemoved = 0;

    // Starting duplicate cleanup

    for (const locale of locales) {
      const gameModes = await getAvailableGameModes(locale);
      for (const gameMode of gameModes) {
        const duplicatesRemoved = await removeDuplicateGroups(locale, gameMode);
        if (duplicatesRemoved > 0) {
          // Removed duplicates from locale/gameMode
        }
        totalDuplicatesRemoved += duplicatesRemoved;
      }
    }

    // Cleanup completed
    return totalDuplicatesRemoved;
  } catch (error) {
    console.error('Error in cleanupDuplicateGroups:', error);
    return 0;
  }
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
      const startTime = Date.now();
      const timeoutMs = 30 * 1000; // 30 seconds

      while (isLanguageMigrationInProgress(currentLocale)) {
        if (Date.now() - startTime > timeoutMs) {
          console.warn(
            `Migration timeout: ${currentLocale} migration took longer than ${timeoutMs}ms, proceeding anyway`
          );
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      // Re-check if migration is now completed
      return isCurrentLanguageMigrationCompleted(currentLocale);
    }

    setLanguageMigrationInProgress(currentLocale, true);
    // Starting current language migration

    try {
      const gameModes = await getAvailableGameModes(currentLocale);
      // Processing game modes for current locale

      for (const gameMode of gameModes) {
        try {
          // Processing current locale/gameMode
          await importGroupsForLocaleAndGameMode(currentLocale, gameMode);
          // Completed current locale/gameMode
        } catch (error) {
          console.error(`Error importing groups for ${currentLocale}/${gameMode}:`, error);
        }
      }

      // Clean up duplicates for current language
      for (const gameMode of gameModes) {
        try {
          await removeDuplicateGroups(currentLocale, gameMode);
        } catch (error) {
          console.warn(`Cleanup failed for ${currentLocale}/${gameMode}:`, error);
          // Continue even if cleanup fails
        }
      }

      // Mark this language as migrated
      markLanguageMigrated(currentLocale);

      // Don't mark main migration as complete yet - only mark complete when ALL languages are done
      // The main migration completion is handled in background migration

      // Current language migration completed

      return true;
    } finally {
      setLanguageMigrationInProgress(currentLocale, false);
    }
  } catch (error) {
    console.error('Current language migration failed:', error);
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

    // Background migration starting for other languages

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
          // Background migration processing locale/gameMode
          await importGroupsForLocaleAndGameMode(locale, gameMode);

          // Add small delay to prevent blocking the main thread
          await new Promise((resolve) => setTimeout(resolve, 10));
        }

        // Clean up duplicates
        for (const gameMode of gameModes) {
          await removeDuplicateGroups(locale, gameMode);
        }

        markLanguageMigrated(locale);
      } catch (error) {
        console.warn(`Background migration failed for ${locale}:`, error);
        // Continue with other languages even if one fails
      }
    }

    markBackgroundMigrationInProgress(false);

    // Check if all languages are now migrated
    const bgStatus = JSON.parse(localStorage.getItem(BACKGROUND_MIGRATION_KEY) || '{}');
    const completedLanguages = new Set(bgStatus.completedLanguages || []);
    const allLanguagesCompleted = SUPPORTED_LANGUAGES.every((lang) => completedLanguages.has(lang));

    if (allLanguagesCompleted) {
      markMigrationComplete(); // Mark full migration as complete
    }

    // Background migration: All remaining languages completed
  } catch (error) {
    console.error('Background migration failed:', error);
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
      window.requestIdleCallback(
        () => migrateRemainingLanguages(excludeLocale),
        { timeout: 5000 } // 5 second timeout
      );
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => migrateRemainingLanguages(excludeLocale), 1000);
    }
  } catch (error) {
    console.error('Error queuing background migration:', error);
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
      const startTime = Date.now();
      const timeoutMs = 30 * 1000; // 30 seconds

      while (isLanguageMigrationInProgress(locale)) {
        if (Date.now() - startTime > timeoutMs) {
          console.warn(
            `Migration timeout: ${locale} migration took longer than ${timeoutMs}ms, proceeding anyway`
          );
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return isCurrentLanguageMigrationCompleted(locale);
    }

    // Ensuring locale is migrated
    return await migrateCurrentLanguage(locale);
  } catch (error) {
    console.error(`Error ensuring ${locale} migration:`, error);

    // Graceful fallback: allow the app to continue even if migration fails
    console.warn(`Migration failed for ${locale}, but app will continue with available data`);
    return false;
  }
};

/**
 * Run migration if needed (optimized for current language first)
 */
export const runMigrationIfNeeded = async (): Promise<boolean> => {
  try {
    const currentLocale = await getCurrentLanguage();

    // Check if the current language is already migrated
    if (isCurrentLanguageMigrationCompleted(currentLocale)) {
      return true;
    }

    // Prevent concurrent migrations
    if (isMigrationInProgress()) {
      // Wait for the current migration to complete with timeout
      const startTime = Date.now();
      const timeoutMs = 30 * 1000; // 30 seconds

      while (isMigrationInProgress()) {
        if (Date.now() - startTime > timeoutMs) {
          console.warn(
            `Migration timeout: main migration took longer than ${timeoutMs}ms, proceeding anyway`
          );
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
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
        // Don't mark main migration as complete yet - only mark the current language as complete
        // The main migration will be marked complete when all languages are done in background migration

        // Queue background migration for other languages
        queueBackgroundMigration(currentLocale);
      }

      return success;
    } finally {
      setMigrationInProgress(false);
    }
  } catch (error) {
    console.error('Error in runMigrationIfNeeded:', error);
    setMigrationInProgress(false);
    // Graceful fallback: allow app to continue even if migration fails
    console.warn('Migration failed, but app will continue with existing data');
    return false;
  }
};

/**
 * Get migration status for debugging
 */
export const getMigrationStatus = (): {
  main: MigrationStatus | null;
  background: BackgroundMigrationStatus | null;
} => {
  try {
    const mainStatus = localStorage.getItem(MIGRATION_KEY);
    const bgStatus = localStorage.getItem(BACKGROUND_MIGRATION_KEY);

    return {
      main: mainStatus ? JSON.parse(mainStatus) : null,
      background: bgStatus ? JSON.parse(bgStatus) : null,
    };
  } catch (error) {
    console.error('Error getting migration status:', error);
    return { main: null, background: null };
  }
};

/**
 * Reset migration status (for debugging/development)
 */
export const resetMigrationStatus = (): void => {
  try {
    localStorage.removeItem(MIGRATION_KEY);
    localStorage.removeItem(BACKGROUND_MIGRATION_KEY);
    // Migration status reset
  } catch (error) {
    console.error('Error resetting migration status:', error);
  }
};

/**
 * Clean up any potential duplicates that may have been created during concurrent migrations
 */
export const cleanupDuplicatesIfNeeded = async (): Promise<void> => {
  try {
    const status = getMigrationStatus();
    if (status.main?.completed || status.background?.completedLanguages?.length) {
      const duplicatesRemoved = await cleanupDuplicateGroups();
      if (duplicatesRemoved > 0) {
        // Cleaned up duplicate entries
      }
    }
  } catch (error) {
    console.warn('Cleanup operation failed:', error);
  }
};
