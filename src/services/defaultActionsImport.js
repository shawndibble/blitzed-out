import { importActions } from './importLocales';
import { getCustomTiles, importCustomTiles } from '@/stores/customTiles';
import { t } from 'i18next';
import db from '@/stores/store';

const { customTiles } = db;

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
    // Skip if there are no actions or if it's just a label
    if (!groupData.actions || Object.keys(groupData.actions).length === 0) {
      return;
    }

    // Process each intensity level
    Object.entries(groupData.actions).forEach(([intensityKey, actionsList], intensityIndex) => {
      // Skip empty action lists
      if (!actionsList || actionsList.length === 0) {
        return;
      }

      actionsList.forEach((action) => {
        customTiles.push({
          group: groupKey,
          intensity: intensityIndex, // Use the index instead of the key string
          action,
          isEnabled: 1,
          tags: [t('default', 'Default')],
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
  // If existingTiles is not an array or empty, no default actions exist
  if (!Array.isArray(existingTiles) || existingTiles.length === 0) {
    return false;
  }
  
  // Count how many default actions exist for this locale and game mode
  const defaultActionsCount = existingTiles.filter(tile => 
    tile.locale === locale && 
    tile.gameMode === gameMode && 
    tile.isCustom === 0
  ).length;
  
  // If we have at least one default action, consider it as existing
  return defaultActionsCount > 0;
}

/**
 * Gets game settings from local storage
 * @returns {Object} Game settings with locale and gameMode
 */
function getGameSettings() {
  try {
    const storedSettings = localStorage.getItem('gameSettings');
    if (!storedSettings) {
      return { locale: 'en', gameMode: 'online' };
    }
    const settings = JSON.parse(storedSettings);
    return {
      locale: settings.locale || 'en',
      gameMode: settings.gameMode || 'online'
    };
  } catch (error) {
    console.error('Error parsing game settings:', error);
    return { locale: 'en', gameMode: 'online' };
  }
}

/**
 * Imports default actions if they don't already exist in the database
 * @param {string} locale - The locale code (e.g., 'en')
 * @param {string} gameMode - The game mode (e.g., 'online')
 */
export async function importDefaultActions(locale, gameMode) {
  // If locale and gameMode are not provided, get them from localStorage
  const settings = getGameSettings();
  const targetLocale = locale || settings.locale;
  const targetGameMode = gameMode || settings.gameMode;

  try {
    // Get existing custom tiles
    const existingTiles = await getCustomTiles({ 
      locale: targetLocale, 
      gameMode: targetGameMode,
      paginated: false 
    });
    
    // Ensure existingTiles is an array
    const tilesArray = Array.isArray(existingTiles) ? existingTiles : [];
    
    // Check if default actions for this locale and game mode already exist
    if (defaultActionsExist(tilesArray, targetLocale, targetGameMode)) {
      console.log(`Default actions for ${targetLocale}/${targetGameMode} already exist.`);
      return;
    }
    
    // Import actions from locales
    const actions = await importActions(targetLocale, targetGameMode);
    
    // Transform actions to custom tiles format
    const customTilesData = transformActionsToCustomTiles(actions, targetLocale, targetGameMode);
    
    // Import custom tiles
    if (customTilesData.length > 0) {
      await importCustomTiles(customTilesData);
      console.log(`Imported ${customTilesData.length} default actions for ${targetLocale}/${targetGameMode}`);
    } else {
      console.log(`No default actions found for ${targetLocale}/${targetGameMode}`);
    }
  } catch (error) {
    console.error(`Error importing default actions for ${targetLocale}/${targetGameMode}:`, error);
  }
}

/**
 * Removes duplicate default actions for a specific locale and game mode
 * @param {string} locale - The locale code
 * @param {string} gameMode - The game mode
 */
async function removeDuplicateDefaultActions(locale, gameMode) {
  try {
    // Get all tiles for this locale and game mode
    const allTiles = await getCustomTiles({
      locale,
      gameMode,
      paginated: false
    });
    
    if (!Array.isArray(allTiles) || allTiles.length === 0) {
      console.log(`No tiles found for ${locale}/${gameMode} to check for duplicates`);
      return;
    }
    
    // Filter to only default actions (isCustom === 0)
    const defaultActionsOnly = allTiles.filter(tile => tile.isCustom === 0);
    
    // If we have 0 or 1 default actions, no duplicates to remove
    if (defaultActionsOnly.length <= 1) {
      return;
    }
    
    console.log(`Found ${defaultActionsOnly.length} default actions for ${locale}/${gameMode}, checking for duplicates...`);
    
    // Create a map to track unique actions
    const uniqueActions = new Map();
    const duplicateIds = [];
    
    // Find duplicates
    defaultActionsOnly.forEach(tile => {
      const key = `${tile.group}-${tile.intensity}-${tile.action}`;
      if (uniqueActions.has(key)) {
        // This is a duplicate, mark for deletion
        duplicateIds.push(tile.id);
      } else {
        uniqueActions.set(key, tile.id);
      }
    });
    
    // Delete duplicates if any found
    if (duplicateIds.length > 0) {
      console.log(`Removing ${duplicateIds.length} duplicate default actions for ${locale}/${gameMode}`);
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
export async function importAllDefaultActions() {
  const settings = getGameSettings();
  
  // First, remove any duplicate default actions
  await removeDuplicateDefaultActions(settings.locale, settings.gameMode);
  
  // Then import the current locale and game mode
  await importDefaultActions(settings.locale, settings.gameMode);
}

/**
 * Sets up a listener for game settings changes and imports actions when needed
 */
export function setupDefaultActionsImport() {
  let previousSettings = getGameSettings();
  
  // Initial import - wrap in setTimeout to ensure it runs after the database is fully initialized
  setTimeout(() => {
    try {
      importAllDefaultActions().catch(error => {
        console.error('Error during initial default actions import:', error);
      });
    } catch (error) {
      console.error('Error during initial default actions import:', error);
    }
  }, 1000);
  
  // Set up storage event listener to detect changes
  window.addEventListener('storage', (event) => {
    if (event.key === 'gameSettings') {
      try {
        const newSettings = JSON.parse(event.newValue);
        const oldSettings = previousSettings;
        
        // If locale or gameMode changed, import actions for the new settings
        if (newSettings.locale !== oldSettings.locale || newSettings.gameMode !== oldSettings.gameMode) {
          importDefaultActions(newSettings.locale, newSettings.gameMode);
          previousSettings = newSettings;
        }
      } catch (error) {
        console.error('Error handling game settings change:', error);
      }
    }
  });
}
