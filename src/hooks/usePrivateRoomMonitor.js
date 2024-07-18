import latestMessageByType from 'helpers/messages';
import useAuth from 'context/hooks/useAuth';
import useGameBoard from 'hooks/useGameBoard';
import useLocalStorage from 'hooks/useLocalStorage';
import useMessages from 'context/hooks/useMessages';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import sendGameSettingsMessage from 'services/gameSettingsMessage';
import { importActions } from 'services/importLocales';
import { useLiveQuery } from 'dexie-react-hooks';
import { getActiveTiles } from 'stores/customTiles';

export default function usePrivateRoomMonitor(room, gameBoard) {
  const DEFAULT_DIEM = '1d6';

  const { i18n } = useTranslation();
  const { user } = useAuth();

  const customTiles = useLiveQuery(() => getActiveTiles());
  const [settings, updateSettings] = useLocalStorage('gameSettings');
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
      board: newBoard,
    };
    if (messageUser) {
      message.reason = `Rebuilt game board due to room size changes by ${messageUser}.`;
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
      if (room.toUpperCase() !== 'PUBLIC' && roomDice) {
        dice = roomDice;
      }

      setRoller(dice);
      setRoomBackground(roomBackgroundURL);

      const shouldRebuildGameBoard =
        roomMessage.uid !== user.uid &&
        roomTileCount &&
        gameBoard.length &&
        roomTileCount !== gameBoard.length;

      if (shouldRebuildGameBoard) {
        rebuildGameBoard(messageSettings, roomMessage.displayName);
      }
      return;
    }

    if (room !== settings.room && gameBoard.length) {
      roomChanged();
      return;
    }

    if (settings?.roomBackgroundURL?.length) {
      setRoomBackground(settings.roomBackgroundURL);
    }
  }, [room, messages, isLoading, settings.room]);

  return { roller, roomBgUrl };
}
