import { camelToPascal, pascalToCamel } from 'helpers/strings';
import customizeBoard from 'services/buildGame';
import importData from 'helpers/json';

function hasSomethingPicked(object) {
  return Object.values(object).some((selection) => [1, 2, 3, 4].includes(selection));
}

function isAppending(option, variationOption) {
  return option > 0 && variationOption?.startsWith('append');
}

function getCustomTileCount(settings, customTiles, dataFolder) {
  const usedCustomTiles = [];
  const settingsDataFolder = {};
  // restrict our datafolder to just those the user selected.
  Object.entries(dataFolder).forEach(([key, value]) => {
    if (settings[key]) settingsDataFolder[key] = Object.keys(value).slice(1, settings[key] + 1);
  });

  // copy over any custom tiles that fall within our limited datafolder.
  Object.entries(settingsDataFolder).forEach(([settingGroup, intensityArray]) => {
    customTiles.forEach((entry) => {
      if (
        (pascalToCamel(entry.group) === settingGroup && intensityArray.includes(entry.intensity))
        || entry.group === 'Miscellaneous'
      ) {
        usedCustomTiles.push(entry);
      }
    });
  });

  // return the count of custom tiles that were actually used in the game board.
  return usedCustomTiles.length;
}

export function getSettingsMessage(settings, customTiles, dataFolder) {
  let message = '### Game Settings\r\n';
  const { poppersVariation, alcoholVariation } = settings;
  Object.entries(dataFolder).map(([key, val]) => {
    if (settings[key] > 0) {
      const intensity = settings[key];
      message += `* ${val?.label}: ${Object.keys(val?.actions)?.[intensity]}`;
      if (key === 'poppers') {
        message += ` (${camelToPascal(poppersVariation)})`;
      }
      if (key === 'alcohol') {
        message += ` (${camelToPascal(alcoholVariation)})`;
      }
      message += '\r\n';
    }
    return undefined;
  });

  const customTileCount = getCustomTileCount(settings, customTiles, dataFolder);
  if (customTileCount) {
    message += `* Custom Tiles: ${customTileCount} \r\n`;
  }

  return message;
}

export function exportSettings(formData) {
  const newSettings = {};
  Object.entries(formData).forEach(([settingKey, settingValue]) => {
    const personalSettings = ['boardUpdated', 'playerDialog', 'sound', 'displayName', 'othersDialog', 'room'];
    if (!personalSettings.includes(settingKey)) newSettings[settingKey] = settingValue;
  });
  return newSettings;
}

export async function handleUser(user, displayName, updateUser, login) {
  let updatedUser = { ...user };
  if (displayName !== undefined && displayName.length > 0) {
    updatedUser = user ? await updateUser(displayName) : await login(displayName);
  }
  return updatedUser;
}

export function validateFormData(gameOptions, setAlert) {
  if (!hasSomethingPicked(gameOptions)) {
    return setAlert('you need to pick at lease something');
  }

  const { poppers, alcohol, ...actionItems } = { ...gameOptions };

  if (
    (
      isAppending(poppers, gameOptions.poppersVariation)
        || isAppending(alcohol, gameOptions.alcoholVariation)
    )
      && !hasSomethingPicked(actionItems)) {
    return setAlert('If you are going to append, you need an action.');
  }

  return null;
}

export async function handleBoardUpdate({
  formData, dataFolder, updateBoard, customTiles, updateSettings,
}) {
  let updatedDataFolder = { ...dataFolder };
  let settingsBoardUpdated = formData.boardUpdated;
  let { gameMode } = formData;
  if ((!formData.room || formData.room === 'public') && formData.gameMode === 'local') {
    gameMode = 'online';
    // this is async, so we need the boardUpdated & updatedDataFolder as separate entities.
    updatedDataFolder = importData(formData.locale, gameMode);
    settingsBoardUpdated = true;
  }

  const newBoard = customizeBoard(formData, updatedDataFolder, customTiles);
  // if our board updated, then push those changes out.
  if (settingsBoardUpdated) await updateBoard(newBoard);

  updateSettings({ ...formData, boardUpdated: false, gameMode });

  return { settingsBoardUpdated, newBoard };
}
