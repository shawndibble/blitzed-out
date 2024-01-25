import { getSiteName } from 'helpers/strings';
import i18next from 'i18next';
import { sendMessage } from 'services/firebase';

function hasSomethingPicked(object) {
  return Object.values(object).some((selection) =>
    [1, 2, 3, 4].includes(selection)
  );
}

function isAppending(option, variationOption) {
  return option > 0 && variationOption?.startsWith('append');
}

function getRoomSettingsMessage(settings) {
  const { t } = i18next;
  let message = `### ${t('roomSettings')}\r\n`;

  Object.entries(settings).forEach(([key, val]) => {
    if (key === 'room') return; // we handle the room separately.
    if (key === 'roomBackgroundURL') {
      message += `* ${t(key)}: [${getSiteName(val)}:link:](${val})\r\n`;
      return;
    }
    if (val !== '') {
      message += `* ${t(key)}: ${val}\r\n`;
    }
  });
  return message;
}

function exportRoomSettings(formData) {
  const newSettings = {};
  Object.entries(formData).forEach(([settingKey, settingValue]) => {
    if (
      settingKey.startsWith('room') &&
      !['roomUpdated', 'roomBackground'].some((key) => key === settingKey)
    ) {
      newSettings[settingKey] = settingValue;
    }
  });
  return newSettings;
}

export async function handleUser(user, displayName, updateUser, login) {
  let updatedUser = { ...user };
  if (displayName !== undefined && displayName.length > 0) {
    updatedUser = user
      ? await updateUser(displayName)
      : await login(displayName);
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

// returns a translation key for an alert if fails.
export function validateFormData(gameOptions) {
  if (!hasSomethingPicked(gameOptions)) {
    return 'pickSomething';
  }

  const { poppers, alcohol, ...actionItems } = { ...gameOptions };

  if (
    (isAppending(poppers, gameOptions.poppersVariation) ||
      isAppending(alcohol, gameOptions.alcoholVariation)) &&
    !hasSomethingPicked(actionItems)
  ) {
    return 'appendWithAction';
  }

  return null;
}
