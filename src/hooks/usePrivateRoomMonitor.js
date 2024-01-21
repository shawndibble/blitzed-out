import latestMessageByType from 'helpers/messages';
import useAuth from 'hooks/useAuth';
import useGameBoard from 'hooks/useGameBoard';
import useLocalStorage from 'hooks/useLocalStorage';
import useMessages from 'hooks/useMessages';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import sendGameSettingsMessage from 'services/gameSettingsMessage';
import { importActions } from 'services/importLocales';

export default function usePrivateRoomMonitor(room, settings, gameBoard) {
  const DEFAULT_DIEM = '1d6';

  const { i18n } = useTranslation();
  const { user } = useAuth();

  const customTiles = useLocalStorage('customTiles', [])[0];
  const { messages, isLoading } = useMessages(room);
  const [roller, setRoller] = useState(DEFAULT_DIEM);
  const [roomBgUrl, setRoomBackground] = useState('');
  const updateGameBoardTiles = useGameBoard();

  const rebuildGameBoard = useCallback(
    async (messageSettings, messageUser = null) => {
      const { gameMode, newBoard } =
        await updateGameBoardTiles(messageSettings);

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
    },
    [settings, user, customTiles, i18n.resolvedLanguage, updateGameBoardTiles]
  );

  useEffect(() => {
    if (isLoading) return;

    const roomMessage = latestMessageByType(messages, 'room');
    if (roomMessage) {
      const messageSettings = JSON.parse(roomMessage.settings);
      const { roomDice, roomBackgroundURL, roomTileCount } = messageSettings;

      let dice = DEFAULT_DIEM;
      if (room !== 'public' && roomDice) {
        dice = roomDice;
      }

      setRoller(dice);
      setRoomBackground(roomBackgroundURL);

      const shouldRebuildGameBoard =
        roomMessage.uid !== user.uid && roomTileCount !== gameBoard.length;

      if (shouldRebuildGameBoard) {
        rebuildGameBoard(messageSettings, roomMessage.displayName);
      }
      return;
    }
    if (room !== settings.room) {
      rebuildGameBoard({ ...settings, roomUpdated: true, room });
      return;
    }

    if (settings?.roomBackgroundURL?.length) {
      setRoomBackground(settings.roomBackgroundURL);
    }
  }, [room, messages, isLoading, settings]);

  return { roller, roomBgUrl };
}
