import { addCustomGroup, getCustomGroupByName, removeDuplicateGroups } from '@/stores/customGroups';
import { CustomGroupBase } from '@/types/customGroups';
import { importCustomTiles } from '@/stores/customTiles';
import { CustomTileBase } from '@/types/customTiles';

/**
 * Migration service to convert JSON action files to custom groups and custom tiles in Dexie
 */

// Configuration
const MIGRATION_KEY = 'blitzed-out-action-groups-migration';
const MIGRATION_VERSION = '2.0.0';

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
  } catch {
    // File doesn't exist for this locale/gameMode combination
    return null;
  }
};

/**
 * Dynamically discover available locales from the filesystem
 */
const getAvailableLocales = async (): Promise<string[]> => {
  const locales = ['en', 'es', 'fr']; // Known locales
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
 */
const getActionGroupNames = async (locale: string, gameMode: string): Promise<string[]> => {
  // Potential group names to test - this is a comprehensive list from filesystem analysis
  const potentialGroups = [
    'alcohol',
    'ballBusting',
    'bating',
    'bondage',
    'breathPlay',
    'buttPlay',
    'electric',
    'footPlay',
    'gasMask',
    'humiliation',
    'kissing',
    'pissPlay',
    'poppers',
    'spanking',
    'throatTraining',
    'tickling',
    'titTorture',
    'vaping',
  ];

  const existingGroups: string[] = [];

  for (const groupName of potentialGroups) {
    try {
      // Try to import the specific group for this locale/gameMode combination
      await import(`@/locales/${locale}/${gameMode}/${groupName}.json`);
      existingGroups.push(groupName);
    } catch {
      // Group doesn't exist for this locale/gameMode, skip it
    }
  }

  return existingGroups;
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

  console.log(`Importing groups for ${locale}/${gameMode}: ${groupNames.join(', ')}`);

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
          await importCustomTiles(customTiles);
          tilesImported += customTiles.length;
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
    console.log('Starting action groups migration...');

    // Dynamically discover available locales
    const locales = await getAvailableLocales();
    console.log('Available locales:', locales);

    let totalGroupsImported = 0;
    let totalTilesImported = 0;

    for (const locale of locales) {
      // Dynamically discover available game modes for this locale
      const gameModes = await getAvailableGameModes(locale);
      console.log(`Available game modes for ${locale}:`, gameModes);

      for (const gameMode of gameModes) {
        try {
          const result = await importGroupsForLocaleAndGameMode(locale, gameMode);
          totalGroupsImported += result.groupsImported;
          totalTilesImported += result.tilesImported;
          console.log(
            `Imported ${result.groupsImported} groups and ${result.tilesImported} tiles for ${locale}/${gameMode}`
          );
        } catch (error) {
          console.error(`Error importing groups for ${locale}/${gameMode}:`, error);
        }
      }
    }

    console.log(
      `Migration completed: ${totalGroupsImported} groups, ${totalTilesImported} tiles imported`
    );

    // Clean up any duplicates that might exist from previous migrations
    console.log('Cleaning up duplicate groups...');
    let totalDuplicatesRemoved = 0;
    for (const locale of locales) {
      const gameModes = await getAvailableGameModes(locale);
      for (const gameMode of gameModes) {
        const duplicatesRemoved = await removeDuplicateGroups(locale, gameMode);
        totalDuplicatesRemoved += duplicatesRemoved;
      }
    }

    if (totalDuplicatesRemoved > 0) {
      console.log(`Removed ${totalDuplicatesRemoved} duplicate groups`);
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

    console.log('Starting duplicate cleanup across all locales and game modes...');

    for (const locale of locales) {
      const gameModes = await getAvailableGameModes(locale);
      for (const gameMode of gameModes) {
        const duplicatesRemoved = await removeDuplicateGroups(locale, gameMode);
        if (duplicatesRemoved > 0) {
          console.log(`Removed ${duplicatesRemoved} duplicates from ${locale}/${gameMode}`);
        }
        totalDuplicatesRemoved += duplicatesRemoved;
      }
    }

    console.log(`Cleanup completed: removed ${totalDuplicatesRemoved} duplicate groups total`);
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
