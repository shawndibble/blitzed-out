import i18next from 'i18next';
import { sendMessage } from './firebase';

function getCustomTileCount(settings, customTiles, actionsList) {
  const settingsDataFolder = Object.entries(actionsList)
    .filter(([key]) => settings[key])
    .reduce((acc, [key, value]) => {
      acc[key] = Object.keys(value.actions).slice(1, settings[key] + 1);
      return acc;
    }, {});

  const usedCustomTiles = customTiles.filter((entry) => {
    if (entry.group === 'misc') return true;
    const intensityArray = settingsDataFolder[entry.group];
    return intensityArray && intensityArray.length >= Number(entry.intensity);
  });

  return usedCustomTiles.length;
}

function getSettingsMessage(settings, customTiles, actionsList, reason) {
  const { t } = i18next;
  let message = `### ${i18next.t('gameSettings')}\r\n`;
  if (reason) {
    message += `##### ${reason}\r\n`;
  }
  message += '--- \r\n';
  const { poppersVariation, alcoholVariation } = settings;
  // output only settings that have a corresponding actionsList entry.
  Object.entries(actionsList).forEach(([key, val]) => {
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
  });

  const { finishRange, difficulty } = settings;

  message += '--- \r\n';

  message += `* ${t('difficulty')}: ${t(difficulty ?? 'normal')} \r\n`;

  message += `* ${t('finishSlider')} ${finishRange[0]}%  | ${finishRange[1] - finishRange[0]}% | ${100 - finishRange[1]}%`;

  const customTileCount = getCustomTileCount(
    settings,
    customTiles,
    actionsList
  );
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
      'background',
      'boardUpdated',
      'chatSound',
      'displayName',
      'mySound',
      'othersDialog',
      'playerDialog',
    ];
    // don't export personal settings nor room specific settings.
    if (
      !personalSettings.includes(settingKey) &&
      !settingKey.startsWith('room')
    ) {
      newSettings[settingKey] = settingValue;
    }
  });
  return newSettings;
}

export default function sendGameSettingsMessage({
  formData,
  user,
  actionsList,
  board,
  customTiles = {},
  reason = '',
}) {
  return sendMessage({
    room: formData?.room || 'PUBLIC',
    user,
    text: getSettingsMessage(formData, customTiles, actionsList, reason),
    type: 'settings',
    gameBoard: JSON.stringify(board),
    settings: JSON.stringify(exportSettings(formData)),
  });
}
