import { getSiteName } from '@/helpers/urls';
import i18next from 'i18next';
import { sendMessage } from '@/services/firebase';
import { Settings } from '@/types/Settings';
import { User } from '@/types';

function getRoomSettingsMessage(settings: Partial<Settings>): string {
  const { t } = i18next;
  let message = `### ${t('roomSettings')}\r\n`;

  Object.entries(settings).forEach(([key, val]) => {
    if (key === 'room') return; // we handle the room separately.
    if (key === 'roomBackgroundURL' && val !== '') {
      message += `* ${t(key)}: [${getSiteName(String(val))}:link:](${val})\r\n`;
      return;
    }
    if (key === 'roomRealtime') {
      message += `* ${t('playerList')}: ${val ? t('delayed') : t('realtime')}\r\n`;
      return;
    }
    if (val !== '') {
      message += `* ${t(key)}: ${val}\r\n`;
    }
  });
  return message;
}

function exportRoomSettings(formData: Settings): Partial<Settings> {
  const newSettings: Partial<Settings> = {};
  Object.entries(formData).forEach(([settingKey, settingValue]) => {
    if (
      settingKey.startsWith('room') &&
      !['roomUpdated', 'roomBackground'].some((key) => key === settingKey)
    ) {
      newSettings[settingKey as keyof Settings] = settingValue;
    }
  });
  return newSettings;
}

export async function handleUser(
  user: User | null,
  displayName: string | undefined,
  updateUser: (displayName: string) => Promise<User | null>
): Promise<User | null> {
  let updatedUser = user;
  if (displayName !== undefined && displayName.length > 0) {
    updatedUser = await updateUser(displayName);
  }
  return updatedUser;
}

export function sendRoomSettingsMessage(formData: Settings, updatedUser: User): Promise<any> {
  const roomSettings = exportRoomSettings(formData);
  return sendMessage({
    room: formData.room,
    user: updatedUser,
    text: getRoomSettingsMessage(roomSettings),
    type: 'room',
    settings: JSON.stringify(roomSettings),
  });
}
