/**
 * Import operations module for handling action file imports and data conversion
 */

import {
  addCustomGroup,
  getCustomGroupByName,
  removeDuplicateGroups,
  updateCustomGroup,
} from '@/stores/customGroups';
import { importCustomTiles, getTilesUnguarded } from '@/stores/customTiles';
import { mergeSeedIntensities } from '@/services/intensityMerge';
import { CustomGroupBase } from '@/types/customGroups';
import { CustomTileBase } from '@/types/customTiles';
import { ImportResult } from './types';
import { logError, withErrorHandling, isDuplicateError } from './errorHandling';

type ImportedCustomGroup = CustomGroupBase & { id: string };

/**
 * Retry dynamic import with exponential backoff
 */
const retryImport = async <T>(importFn: () => Promise<T>, retries = 3): Promise<T> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await importFn();
    } catch (error) {
      if (attempt === retries) throw error;

      // Wait before retry with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw new Error('All import attempts failed');
};
import { getActionGroupNames } from './fileDiscovery';
import { createDeterministicGroupId } from './groupIdMigration';
import { GAME_MODES, SUPPORTED_LANGUAGES } from './constants';
import { isPenetrativeDefaultTile } from './penetrativeIntensities';

/**
 * Import a single action file and convert it to a custom group with custom tiles
 */
export const importActionFile = async (
  groupName: string,
  locale: string,
  gameMode: string
): Promise<{ customGroup: ImportedCustomGroup; customTiles: CustomTileBase[] } | null> => {
  return withErrorHandling(async () => {
    // Import from bundled translation files for better performance with retry
    const bundleFile = await retryImport(
      () => import(`@/locales/${locale}/${gameMode}-bundle.json`)
    );
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
    const customGroup: ImportedCustomGroup = {
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

      // Tiles in penetrative intensities are tagged so a female dom's {genital}
      // resolves to a strapon at render time (vs. keyword guessing per locale).
      const penetrative = isPenetrativeDefaultTile(groupName, intensity.value);
      const tags = penetrative ? ['default', 'penetrative'] : ['default'];

      // Create a tile for each action in this intensity
      for (const action of actionList) {
        if (typeof action === 'string' && action.trim()) {
          customTiles.push({
            group_id: deterministicId, // Assign the deterministic group ID
            intensity: intensity.value,
            action: action.trim(),
            tags: [...tags], // Mark as default tiles from JSON files
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
  groupId: string
): Promise<CustomTileBase[]> => {
  try {
    // Validate all tiles have proper group_id
    validateTilesHaveGroupId(customTiles);

    // Unguarded core: the readiness guard would deadlock here — this runs
    // inside the seeding whose completion the guard waits on.
    const existingTiles = await getTilesUnguarded({ group_id: groupId });

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
    logError('warn', `getNewTiles:${groupId}`, error);
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

  // Import Dexie database for transaction usage with retry
  const db = await retryImport(() => import('@/stores/store')).then((module) => module.default);

  // Process each group individually to avoid transaction timeouts
  for (const groupName of groupNames) {
    try {
      const existingGroup = await getCustomGroupByName(groupName, locale, gameMode);
      const result = await importActionFile(groupName, locale, gameMode);
      if (!result) continue;

      const { customGroup, customTiles } = result;
      const targetGroupId = existingGroup?.id || customGroup.id;
      const tilesForGroup = customTiles.map((tile) => ({
        ...tile,
        group_id: targetGroupId,
      }));

      // Process each group in its own transaction to prevent timeouts
      await db.transaction('rw', [db.customGroups, db.customTiles], async () => {
        if (existingGroup) {
          await updateCustomGroup(existingGroup.id, {
            label: customGroup.label,
            // Bundle ladder is canonical, but user-appended (non-default)
            // intensities must survive re-seeds.
            intensities: mergeSeedIntensities(customGroup.intensities, existingGroup.intensities),
            type: customGroup.type,
            isDefault: true,
            locale,
            gameMode,
          });
        } else {
          // Add the custom group with error handling for duplicates
          const groupAdded = await addCustomGroupSafely(customGroup);
          if (groupAdded) {
            groupsImported++;
          }
        }

        // Add the custom tiles if there are any
        if (tilesForGroup.length > 0 && targetGroupId) {
          const newTiles = await getNewTiles(tilesForGroup, targetGroupId);
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
