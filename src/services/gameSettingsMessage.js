import i18next from 'i18next';
import { getOrCreateBoard, sendMessage } from './firebase';
import { isOnlineMode } from '@/helpers/strings';

function getCustomTileCount(settings, customTiles, actionsList) {
  const settingsDataFolder = Object.entries(actionsList)
    .filter(([key]) => settings[key])
    .reduce((acc, [key, value]) => {
      acc[key] = Object.keys(value.actions).slice(1, settings[key] + 1);
      return acc;
    }, {});

  const usedCustomTiles = customTiles?.filter((entry) => {
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

  // output only settings that have a corresponding actionsList entry.
  Object.entries(actionsList).forEach(([key, val]) => {
    if (!settings[key]) return;

    const { role, variation, level } = settings[key];
    const actualRole = role || settings.role || 'sub';

    if (level > 0) {
      message += `* ${val?.label}: ${Object.keys(val?.actions)?.[level]}`;

      if (variation) {
        message += ` (${t(variation)})`;
      }

      if (!isOnlineMode(settings.gameMode) && !variation) {
        // if we have a role from the translation files, use them first.
        const roleText = val[actualRole] ?? t(actualRole);
        message += ` (${roleText})`;
      }
      message += '\r\n';
    }
  });

  const { finishRange, difficulty } = settings;

  message += '--- \r\n';

  message += `* ${t('difficulty')}: ${t(difficulty ?? 'normal')} \r\n`;

  if (finishRange) {
    message += `* ${t('finishSlider')} ${finishRange[0]}%  | ${finishRange[1] - finishRange[0]}% | ${100 - finishRange[1]}%`;
  }

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
      'displayName',
      'background',
      'boardUpdated',
      'chatSound',
      'mySound',
      'otherSound',
      'othersDialog',
      'playerDialog',
      'readRoll',
      'hideBoardActions',
      'advancedSettings',
    ];
    // don't export personal settings nor room specific settings.
    if (!personalSettings.includes(settingKey) && !settingKey.startsWith('room')) {
      newSettings[settingKey] = settingValue;
    }
  });
  return newSettings;
}

export default async function sendGameSettingsMessage({
  title,
  formData,
  user,
  actionsList,
  tiles,
  customTiles = [],
  reason = '',
}) {
  const settings = JSON.stringify(exportSettings(formData));

  const gameBoard = await getOrCreateBoard({
    title,
    gameBoard: JSON.stringify(tiles),
    settings,
  });

  if (!gameBoard?.id) {
    return;
  }

  return sendMessage({
    room: formData?.room || 'PUBLIC',
    user,
    text: getSettingsMessage(formData, customTiles, actionsList, reason),
    type: 'settings',
    gameBoardId: gameBoard.id,
    boardSize: tiles.length,
    gameMode: formData.gameMode,
  });
}
