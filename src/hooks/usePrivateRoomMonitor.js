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
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const customTiles = useLocalStorage('customTiles', [])[0];
  const messages = useMessages(room);
  const [roller, setRoller] = useState('1d4');
  const [roomBgUrl, setRoomBackground] = useState('');
  const updateGameBoardTiles = useGameBoard();

  const rebuildGameBoard = useCallback(async (messageSettings, messageUser) => {
    const { gameMode, newBoard } = await updateGameBoardTiles(messageSettings);

    await sendGameSettingsMessage({
      formData: { ...settings, ...messageSettings },
      user,
      customTiles,
      actionsList: importActions(i18n.resolvedLanguage, gameMode),
      board: newBoard,
      reason: `Rebuilt game board due to room size changes by ${messageUser}.`,
    });
  }, [settings, user, customTiles, i18n.resolvedLanguage, updateGameBoardTiles]);

  useEffect(() => {
    const roomMessage = latestMessageByType(messages, 'room');
    if (roomMessage) {
      const messageSettings = JSON.parse(roomMessage.settings);
      const { roomDice, roomBackgroundURL, roomTileCount } = messageSettings;
      setRoller(roomDice || '1d6');
      setRoomBackground(roomBackgroundURL);

      const shouldRebuildGameBoard = roomMessage.uid !== user.uid
        && roomTileCount !== gameBoard.length;

      if (shouldRebuildGameBoard) {
        rebuildGameBoard(messageSettings, roomMessage.displayName);
      }
      return;
    }
    if (settings?.roomBackgroundURL?.length) {
      setRoomBackground(settings.roomBackgroundURL);
    }
  }, [messages, settings, user.uid, gameBoard.length, rebuildGameBoard]);

  return { roller, roomBgUrl };
}
