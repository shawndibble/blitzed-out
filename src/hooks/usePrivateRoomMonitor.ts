import latestMessageByType from '@/helpers/messages';
import useAuth from '@/context/hooks/useAuth';
import useGameBoard from '@/hooks/useGameBoard';
import useLocalStorage from '@/hooks/useLocalStorage';
import useMessages from '@/context/hooks/useMessages';
import { useEffect, useState, useCallback, useRef } from 'react';
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
  
  // Track if we've already rebuilt the board for this room change
  const hasRebuiltRef = useRef(false);

  const rebuildGameBoard = useCallback(
    async (messageSettings: any, messageUser: string | null = null): Promise<void> => {
      // Prevent multiple rebuilds for the same settings
      if (hasRebuiltRef.current) {
        return;
      }
      
      hasRebuiltRef.current = true;
      
      try {
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
      } finally {
        // Reset the flag after a short delay to prevent immediate re-triggering
        setTimeout(() => {
          hasRebuiltRef.current = false;
        }, 500);
      }
    },
    [settings, user, customTiles, i18n.resolvedLanguage, t, updateGameBoardTiles]
  );

  const roomChanged = useCallback(async (): Promise<void> => {
    // Skip if we've already handled this room change
    if (settings?.room === room) {
      return;
    }
    
    await updateSettings({ ...settings, room });
    await rebuildGameBoard({ ...settings, roomUpdated: true, room });
  }, [settings, room, updateSettings, rebuildGameBoard]);

  // Process room messages
  useEffect(() => {
    if (isLoading || !messages.length) return;
    
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

        if (shouldRebuildGameBoard && !hasRebuiltRef.current) {
          rebuildGameBoard(messageSettings, roomMessage.displayName);
        }
      }
    } catch (error) {
      console.error('Error processing room message:', error);
    }
  }, [messages, isLoading, room, user, gameBoard, rebuildGameBoard]);

  // Handle room changes
  useEffect(() => {
    if (isLoading) return;

    try {
      const roomMessage = latestMessageByType(messages, 'room') as RoomMessage | undefined;
      
      // Skip if we have a room message (handled by the other effect)
      if (roomMessage) return;
      
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
      if (room !== settings?.room && gameBoard?.length && !hasRebuiltRef.current) {
        roomChanged();
        return;
      }

      if (settings?.roomBackgroundURL?.length) {
        setRoomBackground(settings.roomBackgroundURL);
      }
    } catch (error) {
      console.error('Error in room change effect:', error);
    }
  }, [room, settings, gameBoard, messages, isLoading, roomChanged]);

  return { roller, roomBgUrl };
}
