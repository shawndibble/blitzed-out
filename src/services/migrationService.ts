import { addCustomGroup, getCustomGroupByName, removeDuplicateGroups } from '@/stores/customGroups';

import { CustomGroupBase } from '@/types/customGroups';
import { CustomTileBase } from '@/types/customTiles';
import { importCustomTiles } from '@/stores/customTiles';
import i18n from '@/i18n';

/**
 * Migration service to convert JSON action files to custom groups and custom tiles in Dexie.
 * Uses Vite's import.meta.glob() for automatic file discovery at build time.
 */

// Configuration
const MIGRATION_KEY = 'blitzed-out-action-groups-migration';
const MIGRATION_VERSION = '2.1.1';
const BACKGROUND_MIGRATION_KEY = 'blitzed-out-background-migration';

// In-memory flags to prevent concurrent migrations
let migrationInProgress = false;
let currentLanguageMigrationInProgress = new Set<string>();
let backgroundMigrationInProgress = false;

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
    if (bgStatus) {
      const backgroundStatus: BackgroundMigrationStatus = JSON.parse(bgStatus);
      const isCompleted = backgroundStatus.completedLanguages.includes(locale);
      if (isCompleted) {
        return true;
      }
    }

    // Fallback: check if full migration is complete (this means ALL languages are done)
    const status = localStorage.getItem(MIGRATION_KEY);
    if (status) {
      const migrationStatus: MigrationStatus = JSON.parse(status);

      if (migrationStatus.completed && migrationStatus.version === MIGRATION_VERSION) {
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
      const supportedLanguages = ['en', 'es', 'fr', 'zh', 'hi'];
      if (supportedLanguages.includes(browserLang)) {
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
  } catch (error) {
    // Log import failures for better debugging
    console.debug(`Failed to import action file ${groupName} for ${locale}/${gameMode}:`, error);
    return null;
  }
};

/**
 * Dynamically discover available locales from the filesystem
 */
const getAvailableLocales = async (): Promise<string[]> => {
  const locales = ['en', 'es', 'fr', 'zh', 'hi']; // All supported locales
  const existingLocales: string[] = [];

  for (const locale of locales) {
    try {
      // Test if locale exists by trying to import translation file
      await import(`@/locales/${locale}/translation.json`);
      existingLocales.push(locale);
    } catch (error) {
      // Locale doesn't exist, skip it
      console.debug(`Locale ${locale} not found:`, error);
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
    } catch (error) {
      // Game mode doesn't exist for this locale, skip it
      console.debug(`Game mode ${gameMode} not found for locale ${locale}:`, error);
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
      console.debug(`Group ${groupName} already exists for ${locale}/${gameMode}, skipping`);
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
          console.debug(`Successfully imported group: ${groupName} for ${locale}/${gameMode}`);
        } catch (error) {
          // Handle case where group was added by concurrent migration
          if (error instanceof Error && error.message.includes('already exists')) {
            console.debug(`Group ${groupName} was already added by concurrent process`);
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
    console.info('🚀 Migration: Starting action groups migration...');

    // Dynamically discover available locales
    const locales = await getAvailableLocales();
    console.log('🌍 Migration: Available locales discovered', { locales });

    let totalGroupsImported = 0;
    let totalTilesImported = 0;

    for (const locale of locales) {
      // Dynamically discover available game modes for this locale
      const gameModes = await getAvailableGameModes(locale);
      console.log(`🎮 Migration: Game modes for ${locale}`, { gameModes });

      for (const gameMode of gameModes) {
        try {
          console.log(`💼 Migration: Processing ${locale}/${gameMode}`);
          const result = await importGroupsForLocaleAndGameMode(locale, gameMode);
          console.log(`✅ Migration: Completed ${locale}/${gameMode}`, result);
          totalGroupsImported += result.groupsImported;
          totalTilesImported += result.tilesImported;
        } catch (error) {
          console.error(`❌ Migration: Error importing groups for ${locale}/${gameMode}:`, error);
        }
      }
    }

    console.info(
      `✨ Migration: COMPLETED - ${totalGroupsImported} groups, ${totalTilesImported} tiles imported`
    );

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

    console.info('Starting duplicate cleanup across all locales and game modes...');

    for (const locale of locales) {
      const gameModes = await getAvailableGameModes(locale);
      for (const gameMode of gameModes) {
        const duplicatesRemoved = await removeDuplicateGroups(locale, gameMode);
        if (duplicatesRemoved > 0) {
          console.info(`Removed ${duplicatesRemoved} duplicates from ${locale}/${gameMode}`);
        }
        totalDuplicatesRemoved += duplicatesRemoved;
      }
    }

    console.info(`Cleanup completed: removed ${totalDuplicatesRemoved} duplicate groups total`);
    return totalDuplicatesRemoved;
  } catch (error) {
    console.error('Error in cleanupDuplicateGroups:', error);
    return 0;
  }
};

/**
 * Migration function for current language only (fast path)
 */
export const migrateCurrentLanguage = async (
  locale?: string,
  _onProgress?: (current: number, total: number, groupName: string) => void
): Promise<boolean> => {
  const currentLocale = locale || (await getCurrentLanguage());

  try {
    // Check if this language is already migrated
    if (isCurrentLanguageMigrationCompleted(currentLocale)) {
      return true;
    }

    // Prevent concurrent migrations for the same language
    if (currentLanguageMigrationInProgress.has(currentLocale)) {
      // Wait for the current migration to complete
      while (currentLanguageMigrationInProgress.has(currentLocale)) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      // Re-check if migration is now completed
      return isCurrentLanguageMigrationCompleted(currentLocale);
    }

    currentLanguageMigrationInProgress.add(currentLocale);
    console.info(`🚀 Migration: Starting current language migration for ${currentLocale}...`);

    try {
      const gameModes = await getAvailableGameModes(currentLocale);
      console.log(`🎮 Migration: Game modes for ${currentLocale}`, { gameModes });

      let totalGroupsImported = 0;
      let totalTilesImported = 0;

      for (const gameMode of gameModes) {
        try {
          console.log(`💼 Migration: Processing ${currentLocale}/${gameMode}`);
          const result = await importGroupsForLocaleAndGameMode(currentLocale, gameMode);
          console.log(`✅ Migration: Completed ${currentLocale}/${gameMode}`, result);
          totalGroupsImported += result.groupsImported;
          totalTilesImported += result.tilesImported;
        } catch (error) {
          console.error(
            `❌ Migration: Error importing groups for ${currentLocale}/${gameMode}:`,
            error
          );
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

      console.info(
        `✨ Migration: Current language COMPLETED - ${totalGroupsImported} groups, ${totalTilesImported} tiles imported for ${currentLocale}`
      );

      return true;
    } finally {
      currentLanguageMigrationInProgress.delete(currentLocale);
    }
  } catch (error) {
    console.error('Current language migration failed:', error);
    currentLanguageMigrationInProgress.delete(currentLocale);
    return false;
  }
};

/**
 * Background migration for remaining languages
 */
export const migrateRemainingLanguages = async (excludeLocale?: string): Promise<void> => {
  try {
    // Prevent concurrent background migrations
    if (backgroundMigrationInProgress) {
      return;
    }

    backgroundMigrationInProgress = true;
    const currentLocale = excludeLocale || (await getCurrentLanguage());
    markBackgroundMigrationInProgress(true);

    console.info(`🔄 Background Migration: Starting for languages other than ${currentLocale}...`);

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
          console.debug(`🔄 Background Migration: Processing ${locale}/${gameMode}`);
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
        console.warn(`⚠️ Background Migration: Failed for ${locale}:`, error);
        // Continue with other languages even if one fails
      }
    }

    markBackgroundMigrationInProgress(false);

    // Check if all languages are now migrated
    const bgStatus = JSON.parse(localStorage.getItem(BACKGROUND_MIGRATION_KEY) || '{}');
    if (bgStatus.completedLanguages?.length === allLocales.length) {
      markMigrationComplete(); // Mark full migration as complete
    }

    console.info('✨ Background Migration: All remaining languages completed');
  } catch (error) {
    console.error('Background migration failed:', error);
    markBackgroundMigrationInProgress(false);
  } finally {
    backgroundMigrationInProgress = false;
  }
};

/**
 * Queue background migration for remaining languages
 */
export const queueBackgroundMigration = (excludeLocale?: string): void => {
  try {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(
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
export const ensureLanguageMigrated = async (
  locale: string,
  _onProgress?: (current: number, total: number, groupName: string) => void
): Promise<boolean> => {
  try {
    // Quick check first
    const isCompleted = isCurrentLanguageMigrationCompleted(locale);

    if (isCompleted) {
      return true;
    }

    // If migration is in progress for this language, wait for it
    if (currentLanguageMigrationInProgress.has(locale)) {
      while (currentLanguageMigrationInProgress.has(locale)) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return isCurrentLanguageMigrationCompleted(locale);
    }

    console.info(`🚀 Ensuring ${locale} is migrated...`);
    return await migrateCurrentLanguage(locale, _onProgress);
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
export const runMigrationIfNeeded = async (
  _onProgress?: (current: number, total: number, groupName: string) => void
): Promise<boolean> => {
  try {
    // Check if full migration is already completed
    if (isMigrationCompleted()) {
      return true;
    }

    // Prevent concurrent migrations
    if (migrationInProgress) {
      // Wait for the current migration to complete
      while (migrationInProgress) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      // Re-check if migration is now completed
      return (
        isMigrationCompleted() || isCurrentLanguageMigrationCompleted(await getCurrentLanguage())
      );
    }

    migrationInProgress = true;

    try {
      const currentLocale = await getCurrentLanguage();

      // Fast path: migrate current language only
      const success = await migrateCurrentLanguage(currentLocale, _onProgress);

      if (success) {
        // Queue background migration for other languages
        queueBackgroundMigration(currentLocale);
      }

      return success;
    } finally {
      migrationInProgress = false;
    }
  } catch (error) {
    console.error('Error in runMigrationIfNeeded:', error);
    migrationInProgress = false;
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
    console.info('Migration status reset');
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
        console.info(`Cleaned up ${duplicatesRemoved} duplicate entries`);
      }
    }
  } catch (error) {
    console.warn('Cleanup operation failed:', error);
  }
};
