import { useEffect, useState } from 'react';
import { sendRoomSettingsMessage } from 'views/GameSettings/submitForm';
import sendGameSettingsMessage from 'services/gameSettingsMessage';
import useLocalStorage from 'hooks/useLocalStorage';
import { useTranslation } from 'react-i18next';
import { importActions } from 'services/importLocales';
import latestMessageByType, { latestMessageBy } from 'helpers/messages';
import { useParams } from 'react-router-dom';
import { getActiveTiles } from 'stores/customTiles';
import { useLiveQuery } from 'dexie-react-hooks';

function isCompatibleBoard(
  isPrivateRoom,
  latestRoomMessage,
  boardSize,
  roomTileCount
) {
  if (!isPrivateRoom && boardSize === 40) return true;

  if (!latestRoomMessage) return false;

  const { roomTileCount: latestRoomTileCount } = latestRoomMessage;

  if (boardSize !== latestRoomTileCount) return false;

  return boardSize === roomTileCount;
}

export default function useSendSettings(user, messages, isLoading) {
  const { id: room } = useParams();
  const [settingsSent, setSettingsSent] = useState(false);
  const { i18n } = useTranslation();
  const settings = useLocalStorage('gameSettings')[0];
  const customTiles = useLiveQuery(() => getActiveTiles());
  const board = useLocalStorage('customBoard', [])[0];

  // populate the room and game settings if they are not part of the message list.
  useEffect(() => {
    if (!settings || isLoading || settingsSent) return;

    const isPrivateRoom = room.toUpperCase() !== 'PUBLIC';
    const formData = { ...settings, room };
    // send out room specific settings if we are in a private room.
    const latestRoomMessage = latestMessageByType(messages, 'room');
    if (isPrivateRoom && !latestRoomMessage) {
      sendRoomSettingsMessage(formData, user);
    }

    setSettingsSent(true);

    // if our board updated, or we changed rooms, send out game settings message.
    // if our settings board is incompatible with the room, let PrivateRoomMonitor handle it.
    const isCompatible = isCompatibleBoard(
      isPrivateRoom,
      latestRoomMessage,
      board.length,
      settings.roomTileCount
    );

    const alreadySentSettings = latestMessageBy(
      messages,
      (m) => m.type === 'settings' && m.uid === user.uid
    );

    if (!alreadySentSettings && isCompatible) {
      const actionsList = importActions(
        i18n.resolvedLanguage,
        settings.gameMode
      );

      sendGameSettingsMessage({
        formData,
        user,
        customTiles,
        actionsList,
        board,
      });
    }
  }, [isLoading]);
}
