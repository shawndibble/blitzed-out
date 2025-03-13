import latestMessageByType from '@/helpers/messages';
import useAuth from '@/context/hooks/useAuth';
import useGameBoard from '@/hooks/useGameBoard';
import useLocalStorage from '@/hooks/useLocalStorage';
import useMessages from '@/context/hooks/useMessages';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import sendGameSettingsMessage from '@/services/gameSettingsMessage';
import { importActions } from '@/services/importLocales';
import { useLiveQuery } from 'dexie-react-hooks';
import { getActiveTiles } from '@/stores/customTiles';
import { isOnlineMode, isPublicRoom } from '@/helpers/strings';

export default function usePrivateRoomMonitor(room, gameBoard) {
  const DEFAULT_DIEM = '1d6';

  const { i18n, t } = useTranslation();
  const { user } = useAuth();

  const [settings, updateSettings] = useLocalStorage('gameSettings');
  const customTiles = useLiveQuery(() => getActiveTiles(settings.gameMode));
  const { messages, isLoading } = useMessages();
  const [roller, setRoller] = useState(DEFAULT_DIEM);
  const [roomBgUrl, setRoomBackground] = useState('');
  const updateGameBoardTiles = useGameBoard();

  const rebuildGameBoard = async (messageSettings, messageUser = null) => {
    const { gameMode, newBoard } = await updateGameBoardTiles(messageSettings);

    const message = {
      formData: { ...settings, ...messageSettings },
      user,
      customTiles,
      actionsList: importActions(i18n.resolvedLanguage, gameMode),
      tiles: newBoard,
      title: t('settingsGenerated'),
    };
    if (messageUser) {
      message.reason = t('rebuiltBoard', { messageUser });
    }

    await sendGameSettingsMessage(message);
  };

  const roomChanged = async () => {
    await updateSettings({ ...settings, room });
    await rebuildGameBoard({ ...settings, roomUpdated: true, room });
  };

  useEffect(() => {
    if (isLoading) return;

    const roomMessage = latestMessageByType(messages, 'room');
    if (roomMessage) {
      const messageSettings = JSON.parse(roomMessage.settings);
      const { roomDice, roomBackgroundURL, roomTileCount } = messageSettings;

      let dice = DEFAULT_DIEM;
      if (!isPublicRoom(room) && roomDice) {
        dice = roomDice;
      }

      setRoller(dice);
      setRoomBackground(roomBackgroundURL);

      const shouldRebuildGameBoard =
        roomMessage.uid !== user.uid &&
        roomTileCount &&
        gameBoard?.tile?.length &&
        roomTileCount !== gameBoard?.tile?.length;

      if (shouldRebuildGameBoard) {
        rebuildGameBoard(messageSettings, roomMessage.displayName);
      }
      return;
    }

    // make sure that a private room sends out the room settings
    // before it sends out my game board settings.
    if (!isPublicRoom(room) && !roomMessage) {
      return;
    }

    // make sure if I am in a public room, I can't send out private room settings.
    if (isPublicRoom(room) && !isOnlineMode(settings?.gameMode)) {
      return;
    }

    // if I am changing the room and have a game board, announce the board.
    if (room !== settings.room && gameBoard?.length) {
      roomChanged();
      return;
    }

    if (settings?.roomBackgroundURL?.length) {
      setRoomBackground(settings.roomBackgroundURL);
    }
  }, [room, messages, isLoading, settings.room]);

  return { roller, roomBgUrl };
}
