import { useEffect, useState } from 'react';
import { sendRoomSettingsMessage } from 'views/GameSettings/submitForm';
import sendGameSettingsMessage from 'services/gameSettingsMessage';
import useLocalStorage from 'hooks/useLocalStorage';
import { useTranslation } from 'react-i18next';
import { importActions } from 'services/importLocales';

export default function useSendSettings(room, user, messages, isLoading) {
  const [settingsSent, setSettingsSent] = useState(false);
  const { i18n } = useTranslation();
  const settings = useLocalStorage('gameSettings')[0];
  const customTiles = useLocalStorage('customTiles', [])[0];
  const board = useLocalStorage('customBoard', [])[0];

  // populate the room and game settings if they are not part of the message list.
  useEffect(() => {
    if (!settings || isLoading || settingsSent) return;

    setSettingsSent(true);

    const isPrivateRoom = room !== 'public';
    const formData = { ...settings, room };
    // send out room specific settings if we are in a private room.
    if (isPrivateRoom && !messages.find((m) => m.type === 'room')) {
      sendRoomSettingsMessage(formData, user);
    }

    // if our board updated, or we changed rooms, send out game settings message.
    if (!messages.find((m) => m.type === 'settings' && m.uid === user.uid)) {
      const actionsList = importActions(i18n.resolvedLanguage, settings.gameMode);

      sendGameSettingsMessage({
        formData, user, customTiles, actionsList, board,
      });
    }
  }, [messages, isLoading, settingsSent]);
}
