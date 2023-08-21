import i18next from 'i18next';
import { sendMessage } from './firebase';

function getCustomTileCount(settings, customTiles, actionsList) {
  const usedCustomTiles = [];
  const settingsDataFolder = {};
  // restrict our actionsList to just those the user selected.
  Object.entries(actionsList).forEach(([key, value]) => {
    const intensity = settings[key];
    if (intensity) {
      settingsDataFolder[key] = Object.keys(value.actions).slice(1, intensity + 1);
    }
  });

  // copy over any custom tiles that fall within our limited actionsList.
  Object.entries(settingsDataFolder).forEach(([settingGroup, intensityArray]) => {
    customTiles.forEach((entry) => {
      if (entry.group === settingGroup && intensityArray.length >= Number(entry.intensity)) {
        usedCustomTiles.push(entry);
      }
    });
  });

  // cycle through misc tiles separate from the double nesting above.
  customTiles.forEach((entry) => entry.group === 'misc' && usedCustomTiles.push(entry));

  // return the count of custom tiles that were actually used in the game board.
  return usedCustomTiles.length;
}

function getSettingsMessage(settings, customTiles, actionsList, reason) {
  const { t } = i18next;
  let message = `### ${i18next.t('gameSettings')}\r\n`;
  if (reason) {
    message += `##### ${reason}\r\n`;
  }
  const { poppersVariation, alcoholVariation } = settings;
  // output only settings that have a corresponding actionsList entry.
  Object.entries(actionsList).map(([key, val]) => {
    if (settings[key] > 0) {
      const intensity = settings[key];
      message += `* ${val?.label}: ${Object.keys(val?.actions)?.[intensity]}`;
      if (key === 'poppers') {
        message += ` (${t(poppersVariation)})`;
      }
      if (key === 'alcohol') {
        message += ` (${t(alcoholVariation)})`;
      }
      message += '\r\n';
    }
    return undefined;
  });

  const { finishRange } = settings;

  message += `* ${t('finishSlider')} ${finishRange[0]}%  | ${finishRange[1] - finishRange[0]}% | ${100 - finishRange[1]}%`;

  const customTileCount = getCustomTileCount(settings, customTiles, actionsList);
  if (customTileCount) {
    message += `* ${t('customTiles')}: ${customTileCount} \r\n`;
  }

  return message;
}

function exportSettings(formData) {
  const newSettings = {};
  Object.entries(formData).forEach(([settingKey, settingValue]) => {
    // list of settings to not export and thus not import.
    const personalSettings = [
      'boardUpdated', 'chatSound', 'displayName', 'mySound', 'othersDialog', 'playerDialog',
    ];
    // don't export personal settings nor room specific settings.
    if (!personalSettings.includes(settingKey) && !settingKey.startsWith('room')) {
      newSettings[settingKey] = settingValue;
    }
  });
  return newSettings;
}

export default function sendGameSettingsMessage({
  formData, user, actionsList, board, customTiles = {}, reason = '',
}) {
  return sendMessage({
    room: formData.room || 'public',
    user,
    text: getSettingsMessage(formData, customTiles, actionsList, reason),
    type: 'settings',
    gameBoard: JSON.stringify(board),
    settings: JSON.stringify(exportSettings(formData)),
  });
}
