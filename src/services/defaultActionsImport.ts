import { importActions } from './importLocales';
import { getPaginatedTiles, importCustomTiles } from '@/stores/customTiles';
import { t } from 'i18next';
import db from '@/stores/store';
import { CustomTile } from '@/types/customTiles';

interface ActionGroup {
  actions?: Record<string, string[]>;
  [key: string]: any;
}

interface Actions {
  [key: string]: ActionGroup;
}

const { customTiles } = db;

// Add a lock mechanism to prevent concurrent imports
const importLocks: Record<string, boolean> = {
  online: false,
  local: false,
};

/**
 * Transforms locale actions into the format expected by the customTiles store
 * @param actions - The actions object from importActions
 * @param locale - The locale code (e.g., 'en')
 * @param gameMode - The game mode (e.g., 'online')
 * @returns Array of custom tile objects ready for import
 */
function transformActionsToCustomTiles(
  actions: Actions,
  locale = 'en',
  gameMode = 'online'
): CustomTile[] {
  const customTiles: CustomTile[] = [];

  Object.entries(actions).forEach(([groupKey, groupData]) => {
    // Skip if there are no actions or if it's just a label
    if (!groupData.actions || Object.keys(groupData.actions).length === 0) {
      return;
    }

    // Process each intensity level
    Object.entries(groupData.actions).forEach(([_, actionsList], intensityIndex) => {
      // Skip empty action lists
      if (!actionsList || actionsList.length === 0) {
        return;
      }

      actionsList.forEach((action: string) => {
        // Create a tile for the specific game mode
        customTiles.push({
          group: groupKey,
          intensity: intensityIndex, // Use the index instead of the key string
          action,
          isEnabled: 1,
          tags: [t('default', 'Default')],
          gameMode, // Use the provided game mode
          isCustom: 0, // Mark as default action
          locale,
        });
      });
    });
  });

  return customTiles;
}

/**
 * Checks if default actions are already imported for a specific locale and game mode
 * @param existingTiles - The existing custom tiles
 * @param locale - The locale code
 * @param gameMode - The game mode
 * @returns True if default actions exist, false otherwise
 */
function defaultActionsExist(
  existingTiles: CustomTile[] | any[],
  locale: string,
  gameMode: string
): boolean {
  // If existingTiles is not an array or empty, no default actions exist
  if (!Array.isArray(existingTiles) || existingTiles.length === 0) {
    return false;
  }

  // Count how many default actions exist for this locale and game mode
  const defaultActionsCount = existingTiles.filter(
    (tile) => tile.locale === locale && tile.gameMode === gameMode && tile.isCustom === 0
  ).length;

  // We should have at least a minimum number of default actions
  // This helps detect incomplete imports
  const MINIMUM_DEFAULT_ACTIONS = 4;
  return defaultActionsCount >= MINIMUM_DEFAULT_ACTIONS;
}

/**
 * Imports default actions if they don't already exist in the database
 * @param locale - The locale code (e.g., 'en')
 */
export async function importDefaultActions(locale?: string): Promise<void> {
  // If locale is not provided, get it from localStorage
  const targetLocale = locale || 'en';

  // We'll import for both game modes
  const gameModes = ['online', 'local'];

  try {
    for (const mode of gameModes) {
      // Skip if there's already an import in progress for this mode
      if (importLocks[mode]) {
        continue;
      }

      // Set the lock
      importLocks[mode] = true;

      try {
        // Get existing custom tiles for this locale and game mode
        const existingTiles = await getPaginatedTiles({
          locale: targetLocale,
          gameMode: mode,
          paginated: false,
        });

        // Ensure existingTiles is an array
        const tilesArray = Array.isArray(existingTiles) ? existingTiles : [];

        // Check if default actions for this locale and game mode already exist
        if (defaultActionsExist(tilesArray, targetLocale, mode)) {
          continue; // Skip this mode if actions already exist
        }

        // Import actions from locales - use the specific mode for import
        const actions = await importActions(targetLocale, mode);

        // Transform actions to custom tiles format - now respecting the original game mode
        const customTilesData = transformActionsToCustomTiles(actions, targetLocale, mode);

        // Before importing, check for duplicates
        const uniqueTiles = await filterOutExistingTiles(customTilesData, targetLocale, mode);

        // Import custom tiles
        if (uniqueTiles.length > 0) {
          await importCustomTiles(uniqueTiles);
        }
      } finally {
        // Always release the lock when done
        importLocks[mode] = false;
      }
    }
  } catch (error) {
    console.error(`Error importing default actions for ${targetLocale}:`, error);
    // Make sure to release locks in case of error
    importLocks.online = false;
    importLocks.local = false;
  }
}

/**
 * Filters out tiles that already exist in the database
 * @param tilesToImport - Array of tiles to import
 * @param locale - The locale code
 * @param gameMode - The game mode
 * @returns Array of tiles that don't already exist
 */
async function filterOutExistingTiles(
  tilesToImport: CustomTile[],
  locale: string,
  gameMode: string
): Promise<CustomTile[]> {
  // Get existing tiles
  const existingTiles = await customTiles
    .where('locale')
    .equals(locale)
    .and((tile: CustomTile) => tile.gameMode === gameMode && tile.isCustom === 0)
    .toArray();

  // Create a set of existing tile signatures for quick lookup
  const existingSignatures = new Set<string>();
  existingTiles.forEach((tile: CustomTile) => {
    const signature = `${tile.group}-${tile.intensity}-${tile.action}`;
    existingSignatures.add(signature);
  });

  // Filter out tiles that already exist
  return tilesToImport.filter((tile) => {
    const signature = `${tile.group}-${tile.intensity}-${tile.action}`;
    return !existingSignatures.has(signature);
  });
}

/**
 * Removes duplicate default actions for a specific locale and game mode
 * @param locale - The locale code
 * @param gameMode - The game mode
 */
async function removeDuplicateDefaultActions(locale: string, gameMode: string): Promise<void> {
  try {
    // Get all tiles for this locale and game mode
    const allTiles = await getPaginatedTiles({
      locale,
      gameMode,
      paginated: false,
    });

    if (!Array.isArray(allTiles) || allTiles.length === 0) {
      return;
    }

    // Filter to only default actions (isCustom === 0)
    const defaultActionsOnly = allTiles.filter((tile) => tile.isCustom === 0);

    // If we have 0 or 1 default actions, no duplicates to remove
    if (defaultActionsOnly.length <= 1) {
      return;
    }

    // Create a map to track unique actions
    const uniqueActions = new Map<string, number>();
    const duplicateIds: number[] = [];

    // Find duplicates
    defaultActionsOnly.forEach((tile) => {
      const key = `${tile.group}-${tile.intensity}-${tile.action}`;
      if (uniqueActions.has(key)) {
        // This is a duplicate, mark for deletion
        if (tile.id !== undefined) {
          duplicateIds.push(tile.id);
        }
      } else {
        uniqueActions.set(key, tile.id);
      }
    });

    // Delete duplicates if any found
    if (duplicateIds.length > 0) {
      for (const id of duplicateIds) {
        await customTiles.delete(id);
      }
    }
  } catch (error) {
    console.error(`Error removing duplicate default actions for ${locale}/${gameMode}:`, error);
  }
}

/**
 * Checks for and imports missing default actions for all supported locales and game modes
 */
export async function importAllDefaultActions(locale: string): Promise<void> {
  // First, remove any duplicate default actions for both game modes
  await removeDuplicateDefaultActions(locale, 'online');
  await removeDuplicateDefaultActions(locale, 'local');

  // Then import the current locale (this will handle both game modes)
  await importDefaultActions(locale);
}

// Use a debounce mechanism to prevent multiple rapid calls
let importTimeout: number | null = null;

/**
 * Sets up a listener for game settings changes and imports actions when needed
 */
export function setupDefaultActionsImport(locale: string): void {
  // Clear any existing timeout
  if (importTimeout) {
    clearTimeout(importTimeout);
  }

  // Set a new timeout to debounce multiple calls
  importTimeout = window.setTimeout(() => {
    try {
      importAllDefaultActions(locale).catch((error) => {
        console.error('Error during initial default actions import:', error);
      });
    } catch (error) {
      console.error('Error during initial default actions import:', error);
    }
    importTimeout = null;
  }, 1000);
}
