import latestMessageByType from '@/helpers/messages';
import useAuth from '@/context/hooks/useAuth';
import useGameBoard from '@/hooks/useGameBoard';
import useLocalStorage from '@/hooks/useLocalStorage';
import useMessages from '@/context/hooks/useMessages';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import sendGameSettingsMessage from '@/services/gameSettingsMessage';
import { importActions } from '@/services/importLocales';
import { useLiveQuery } from 'dexie-react-hooks';
import { getActiveTiles } from '@/stores/customTiles';
import { isOnlineMode, isPublicRoom } from '@/helpers/strings';
import { Settings } from '@/types/Settings';
import { RoomMessage } from '@/types/Message';
import { GameBoard } from '@/types/gameBoard';

interface PrivateRoomMonitorResult {
  roller: string;
  roomBgUrl: string;
}

export default function usePrivateRoomMonitor(
  room: string,
  gameBoard?: GameBoard
): PrivateRoomMonitorResult {
  const DEFAULT_DIEM = '1d6';

  const { i18n, t } = useTranslation();
  const { user } = useAuth();

  const [settings, updateSettings] = useLocalStorage<Settings>('gameSettings');
  const customTiles = useLiveQuery(() => getActiveTiles(settings?.gameMode));
  const { messages, isLoading } = useMessages();
  const [roller, setRoller] = useState<string>(DEFAULT_DIEM);
  const [roomBgUrl, setRoomBackground] = useState<string>('');
  const updateGameBoardTiles = useGameBoard();

  const rebuildGameBoard = useCallback(
    async (messageSettings: any, messageUser: string | null = null): Promise<void> => {
      const { gameMode, newBoard } = await updateGameBoardTiles(messageSettings);

      const message: any = {
        formData: { ...settings, ...messageSettings },
        user,
        customTiles,
        actionsList: await importActions(i18n.resolvedLanguage, gameMode || 'online'),
        tiles: newBoard,
        title: t('settingsGenerated'),
      };
      if (messageUser) {
        message.reason = t('rebuiltBoard', { messageUser });
      }

      await sendGameSettingsMessage(message);
    },
    [settings, user, customTiles, i18n.resolvedLanguage, t, updateGameBoardTiles]
  );

  const roomChanged = useCallback(async (): Promise<void> => {
    await updateSettings({ ...settings, room });
    await rebuildGameBoard({ ...settings, roomUpdated: true, room });
  }, [settings, room, updateSettings, rebuildGameBoard]);

  useEffect(() => {
    if (isLoading) return;

    try {
      const roomMessage = latestMessageByType(messages, 'room') as RoomMessage | undefined;
      if (roomMessage) {
        const messageSettings = JSON.parse(roomMessage.settings);
        const { roomDice, roomBackgroundURL, roomTileCount } = messageSettings;

        let dice = DEFAULT_DIEM;
        if (!isPublicRoom(room) && roomDice) {
          dice = roomDice;
        }

        setRoller(dice);
        setRoomBackground(roomBackgroundURL || '');

        const shouldRebuildGameBoard =
          roomMessage.uid !== user?.uid &&
          roomTileCount &&
          gameBoard?.length &&
          roomTileCount !== gameBoard?.length;

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
      if (isPublicRoom(room) && !isOnlineMode(settings?.gameMode || '')) {
        return;
      }

      // if I am changing the room and have a game board, announce the board.
      if (room !== settings?.room && gameBoard?.length) {
        roomChanged();
        return;
      }

      if (settings?.roomBackgroundURL?.length) {
        setRoomBackground(settings.roomBackgroundURL);
      }
    } catch (error) {
      console.error('Error in usePrivateRoomMonitor effect:', error);
    }
  }, [room, messages, isLoading, settings, user, gameBoard, rebuildGameBoard, roomChanged]);

  return { roller, roomBgUrl };
}
