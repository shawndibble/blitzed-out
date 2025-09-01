/**
 * Import operations module for handling action file imports and data conversion
 */

import { addCustomGroup, getCustomGroupByName, removeDuplicateGroups } from '@/stores/customGroups';
import { importCustomTiles, getTiles } from '@/stores/customTiles';
import { CustomGroupBase } from '@/types/customGroups';
import { CustomTileBase } from '@/types/customTiles';
import { ImportResult } from './types';
import { logError, withErrorHandling, isDuplicateError } from './errorHandling';
import { getActionGroupNames } from './fileDiscovery';
import { createDeterministicGroupId } from './groupIdMigration';
import { GAME_MODES, SUPPORTED_LANGUAGES } from './constants';

/**
 * Import a single action file and convert it to a custom group with custom tiles
 */
export const importActionFile = async (
  groupName: string,
  locale: string,
  gameMode: string
): Promise<{ customGroup: CustomGroupBase; customTiles: CustomTileBase[] } | null> => {
  return withErrorHandling(async () => {
    // Import from bundled translation files for better performance
    const bundleFile = await import(`@/locales/${locale}/${gameMode}-bundle.json`);
    const bundle = bundleFile.default;
    const actionFile = bundle[groupName];

    if (!actionFile) {
      throw new Error(`Group "${groupName}" not found in ${locale}/${gameMode} bundle`);
    }

    // Extract data from the JSON file
    const label = actionFile.label || groupName;
    const type = actionFile.type || 'action';
    const actions = actionFile.actions || {};

    // Convert actions object to intensities array
    const intensities = Object.keys(actions).map((intensityName, index) => ({
      id: `${groupName}-${index + 1}`,
      label: intensityName,
      value: index + 1,
      isDefault: true,
    }));

    // Create deterministic ID for default groups to ensure consistency across devices
    const deterministicId = createDeterministicGroupId(groupName, locale, gameMode);

    // Create the custom group with deterministic ID
    const customGroup: CustomGroupBase & { id?: string } = {
      id: deterministicId, // Set deterministic ID for sync consistency
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
      if (!Array.isArray(actionList)) continue;

      // Find the intensity value for this intensity name
      const intensity = intensities.find((i) => i.label === intensityName);
      if (!intensity) continue;

      // Create a tile for each action in this intensity
      for (const action of actionList) {
        if (typeof action === 'string' && action.trim()) {
          customTiles.push({
            group_id: deterministicId, // Assign the deterministic group ID
            intensity: intensity.value,
            action: action.trim(),
            tags: ['default'], // Mark as default tiles from JSON files
            isEnabled: 1,
            isCustom: 0, // These are default tiles, not custom
          });
        }
      }
    }

    return { customGroup, customTiles };
  }, `importActionFile:${groupName}:${locale}/${gameMode}`);
};

/**
 * Add a custom group with error handling for duplicates
 */
const addCustomGroupSafely = async (customGroup: CustomGroupBase): Promise<boolean> => {
  try {
    await addCustomGroup(customGroup);
    return true;
  } catch (error) {
    if (isDuplicateError(error)) {
      // Group was already added by concurrent process, this is ok
      return false;
    }
    throw error; // Re-throw other errors
  }
};

/**
 * Validates that all tiles have proper group_id assignment
 */
const validateTilesHaveGroupId = (tiles: CustomTileBase[]): void => {
  for (const tile of tiles) {
    if (!tile.group_id || !tile.group_id.trim()) {
      throw new Error(`Tile missing group_id during import: ${tile.action}`);
    }
  }
};

/**
 * Filter out existing tiles to prevent duplicates using group_id-based matching
 */
const getNewTiles = async (
  customTiles: CustomTileBase[],
  locale: string,
  gameMode: string,
  groupName: string
): Promise<CustomTileBase[]> => {
  try {
    // Validate all tiles have proper group_id
    validateTilesHaveGroupId(customTiles);

    const existingTiles = await getTiles({ locale, gameMode, group: groupName });

    if (!existingTiles || !Array.isArray(existingTiles)) {
      return customTiles; // If no existing tiles, all tiles are new
    }

    return customTiles.filter((tile) => {
      return !existingTiles.some(
        (existing) =>
          existing.group_id === tile.group_id &&
          existing.intensity === tile.intensity &&
          existing.action === tile.action
      );
    });
  } catch (error) {
    logError('warn', `getNewTiles:${groupName}:${locale}/${gameMode}`, error);
    return customTiles; // On error, import all tiles
  }
};

/**
 * Import custom tiles with duplicate handling
 */
const importCustomTilesSafely = async (tiles: CustomTileBase[]): Promise<number> => {
  if (tiles.length === 0) return 0;

  try {
    await importCustomTiles(tiles);
    return tiles.length;
  } catch (error) {
    logError('warn', 'importCustomTilesSafely', error);
    // Continue processing, don't fail the entire migration
    return 0;
  }
};

/**
 * Import all action groups for a specific locale and game mode
 * Uses Dexie transactions to prevent cursor invalidation during concurrent operations
 */
export const importGroupsForLocaleAndGameMode = async (
  locale: string,
  gameMode: string
): Promise<ImportResult> => {
  const groupNames = await getActionGroupNames(locale, gameMode);
  let groupsImported = 0;
  let tilesImported = 0;

  // Import Dexie database for transaction usage
  const db = await import('@/stores/store').then((module) => module.default);

  // Process each group individually to avoid transaction timeouts
  for (const groupName of groupNames) {
    try {
      // Check if group already exists to prevent duplicates
      const existingGroup = await getCustomGroupByName(groupName, locale, gameMode);
      if (existingGroup) {
        continue; // Group already exists, skip
      }

      const result = await importActionFile(groupName, locale, gameMode);
      if (!result) continue;

      const { customGroup, customTiles } = result;

      // Process each group in its own transaction to prevent timeouts
      await db.transaction('rw', [db.customGroups, db.customTiles], async () => {
        // Add the custom group with error handling for duplicates
        const groupAdded = await addCustomGroupSafely(customGroup);
        if (groupAdded) {
          groupsImported++;
        }

        // Add the custom tiles if there are any
        if (customTiles.length > 0) {
          const newTiles = await getNewTiles(customTiles, locale, gameMode, groupName);
          const tilesAdded = await importCustomTilesSafely(newTiles);
          tilesImported += tilesAdded;
        }
      });
    } catch (error) {
      logError(
        'error',
        `importGroupsForLocaleAndGameMode:${groupName}:${locale}/${gameMode}`,
        error
      );
    }
  }

  return { groupsImported, tilesImported };
};

/**
 * Clean up duplicate groups across all locales and game modes
 */
export const cleanupDuplicateGroups = async (): Promise<number> => {
  const result = await withErrorHandling(
    async () => {
      const locales = SUPPORTED_LANGUAGES;
      let totalDuplicatesRemoved = 0;

      for (const locale of locales) {
        const gameModes = GAME_MODES;
        for (const gameMode of gameModes) {
          const duplicatesRemoved = await removeDuplicateGroups(locale, gameMode);
          totalDuplicatesRemoved += duplicatesRemoved;
        }
      }

      return totalDuplicatesRemoved;
    },
    'cleanupDuplicateGroups',
    0
  );

  return result !== null ? result : 0;
};
