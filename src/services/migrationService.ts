import { addCustomGroup, getCustomGroupByName, removeDuplicateGroups } from '@/stores/customGroups';

import { CustomGroupBase } from '@/types/customGroups';
import { CustomTileBase } from '@/types/customTiles';
import { importCustomTiles } from '@/stores/customTiles';

/**
 * Migration service to convert JSON action files to custom groups and custom tiles in Dexie.
 * Uses Vite's import.meta.glob() for automatic file discovery at build time.
 */

// Configuration
const MIGRATION_KEY = 'blitzed-out-action-groups-migration';
const MIGRATION_VERSION = '2.1.1';

interface MigrationStatus {
  version: string;
  completed: boolean;
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
        // Add the custom group
        await addCustomGroup(customGroup);
        groupsImported++;
        console.debug(`Successfully imported group: ${groupName} for ${locale}/${gameMode}`);

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
              await importCustomTiles(newTiles);
              tilesImported += newTiles.length;
            }
          } catch (tileError) {
            // If tile checking fails, import anyway to ensure migration succeeds
            console.warn(
              `Tile deduplication failed for ${groupName}, importing all tiles:`,
              tileError
            );
            await importCustomTiles(customTiles);
            tilesImported += customTiles.length;
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
 * Run migration if needed (safe to call multiple times)
 */
export const runMigrationIfNeeded = async (): Promise<boolean> => {
  try {
    if (isMigrationCompleted()) {
      return true;
    }

    return await migrateActionGroups();
  } catch (error) {
    console.error('Error in runMigrationIfNeeded:', error);
    return false;
  }
};
