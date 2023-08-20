import i18next from 'i18next';
import { sendMessage } from 'services/firebase';

function hasSomethingPicked(object) {
  return Object.values(object).some((selection) => [1, 2, 3, 4].includes(selection));
}

function isAppending(option, variationOption) {
  return option > 0 && variationOption?.startsWith('append');
}

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

function getRoomSettingsMessage(settings) {
  const { t } = i18next;
  let message = `### ${t('roomSettings')}\r\n`;
  Object.entries(settings)
    .forEach(([key, val]) => {
      if (val !== '') {
        message += `* ${t(key)}: ${val}\r\n`;
      }
    });
  return message;
}

function getSettingsMessage(settings, customTiles, actionsList) {
  const { t } = i18next;
  let message = `### ${i18next.t('gameSettings')}\r\n`;
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
    const personalSettings = ['boardUpdated', 'playerDialog', 'sound', 'displayName', 'othersDialog', 'room'];
    if (!personalSettings.includes(settingKey)) newSettings[settingKey] = settingValue;
  });
  return newSettings;
}

function exportRoomSettings(formData) {
  const newSettings = {};
  Object.entries(formData).forEach(([settingKey, settingValue]) => {
    if (settingKey.startsWith('room') && !['roomUpdated', 'roomBackground'].some((key) => key === settingKey)) {
      newSettings[settingKey] = settingValue;
    }
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

export function sendRoomSettingsMessage(formData, updatedUser) {
  const roomSettings = exportRoomSettings(formData);
  return sendMessage({
    room: formData.room,
    user: updatedUser,
    text: getRoomSettingsMessage(roomSettings),
    type: 'room',
    settings: JSON.stringify(roomSettings),
  });
}

export function sendGameSettingsMessage(formData, updatedUser, customTiles, actionsList, newBoard) {
  return sendMessage({
    room: formData.room || 'public',
    user: updatedUser,
    text: getSettingsMessage(formData, customTiles, actionsList),
    type: 'settings',
    gameBoard: JSON.stringify(newBoard),
    settings: JSON.stringify(exportSettings(formData)),
  });
}

// returns a translation key for an alert if fails.
export function validateFormData(gameOptions) {
  if (!hasSomethingPicked(gameOptions)) {
    return 'pickSomething';
  }

  const { poppers, alcohol, ...actionItems } = { ...gameOptions };

  if (
    (
      isAppending(poppers, gameOptions.poppersVariation)
        || isAppending(alcohol, gameOptions.alcoholVariation)
    )
      && !hasSomethingPicked(actionItems)) {
    return 'appendWithAction';
  }

  return null;
}
