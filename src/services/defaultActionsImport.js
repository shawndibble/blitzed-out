import { importActions } from './importLocales';
import { getCustomTiles, importCustomTiles } from '@/stores/customTiles';

/**
 * Transforms locale actions into the format expected by the customTiles store
 * @param {Object} actions - The actions object from importActions
 * @param {string} locale - The locale code (e.g., 'en')
 * @param {string} gameMode - The game mode (e.g., 'online')
 * @returns {Array} - Array of custom tile objects ready for import
 */
function transformActionsToCustomTiles(actions, locale = 'en', gameMode = 'online') {
  const customTiles = [];

  Object.entries(actions).forEach(([groupKey, groupData]) => {
    const group = groupData.label || groupKey;
    
    // Skip if there are no actions or if it's just a label
    if (!groupData.actions || Object.keys(groupData.actions).length === 0) {
      return;
    }

    // Process each intensity level
    Object.entries(groupData.actions).forEach(([intensityKey, actionsList]) => {
      // Skip empty action lists
      if (!actionsList || actionsList.length === 0) {
        return;
      }

      actionsList.forEach((action) => {
        customTiles.push({
          group,
          intensity: intensityKey,
          action,
          isEnabled: 1,
          tags: [],
          gameMode,
          isCustom: 0, // Mark as default action
          locale
        });
      });
    });
  });

  return customTiles;
}

/**
 * Checks if default actions are already imported for a specific locale and game mode
 * @param {Array} existingTiles - The existing custom tiles
 * @param {string} locale - The locale code
 * @param {string} gameMode - The game mode
 * @returns {boolean} - True if default actions exist, false otherwise
 */
function defaultActionsExist(existingTiles, locale, gameMode) {
  return existingTiles.some(tile => 
    tile.locale === locale && 
    tile.gameMode === gameMode && 
    tile.isCustom === 0
  );
}

/**
 * Imports default actions if they don't already exist in the database
 * @param {string} locale - The locale code (e.g., 'en')
 * @param {string} gameMode - The game mode (e.g., 'online')
 */
export async function importDefaultActions(locale = 'en', gameMode = 'online') {
  try {
    // Get existing custom tiles
    const existingTiles = await getCustomTiles();
    
    // Check if default actions for this locale and game mode already exist
    if (defaultActionsExist(existingTiles, locale, gameMode)) {
      console.log(`Default actions for ${locale}/${gameMode} already exist.`);
      return;
    }
    
    // Import actions from locales
    const actions = await importActions(locale, gameMode);
    
    // Transform actions to custom tiles format
    const customTilesData = transformActionsToCustomTiles(actions, locale, gameMode);
    
    // Import custom tiles
    if (customTilesData.length > 0) {
      await importCustomTiles(customTilesData);
      console.log(`Imported ${customTilesData.length} default actions for ${locale}/${gameMode}`);
    } else {
      console.log(`No default actions found for ${locale}/${gameMode}`);
    }
  } catch (error) {
    console.error('Error importing default actions:', error);
  }
}
