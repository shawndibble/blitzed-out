import latestMessageByType from '@/helpers/messages';
import useAuth from '@/context/hooks/useAuth';
import useGameBoard from '@/hooks/useGameBoard';
import { useSettings } from '@/stores/settingsStore';
import useMessages from '@/context/hooks/useMessages';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import sendGameSettingsMessage from '@/services/gameSettingsMessage';
import { importActions } from '@/services/dexieActionImport';
import { useLiveQuery } from 'dexie-react-hooks';
import { getActiveTiles } from '@/stores/customTiles';
import { isOnlineMode, isPublicRoom } from '@/helpers/strings';
import { RoomMessage } from '@/types/Message';
import { GameBoard } from '@/types/gameBoard';
import { parseMessageTimestamp } from '@/helpers/timestamp';

// Debounce utility
function useDebounce<T extends any[]>(
  callback: (...args: T) => void,
  delay: number
): (...args: T) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  return useCallback(
    (...args: T) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  );
}

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

  const [settings, updateSettings] = useSettings();
  const customTiles = useLiveQuery(() => getActiveTiles(settings?.gameMode));
  const { messages, isLoading } = useMessages();
  const [roller, setRoller] = useState<string>(DEFAULT_DIEM);
  const [roomBgUrl, setRoomBackground] = useState<string>('');
  const updateGameBoardTiles = useGameBoard();

  // Track if we've already rebuilt the board for this room change
  const hasRebuiltRef = useRef(false);

  // Track if this is the first run to prevent false positives during page load
  const isFirstRunRef = useRef(true);

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

  // Debounced version of roomChanged to prevent rapid-fire calls
  const debouncedRoomChanged = useDebounce(roomChanged, 200);

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

        // Only rebuild if the room message is recent (within last 5 minutes)
        const messageDate = parseMessageTimestamp(roomMessage.timestamp);
        const messageAge = messageDate ? Date.now() - messageDate.getTime() : Infinity;
        const isRecentMessage = messageAge < 5 * 60 * 1000; // 5 minutes in milliseconds

        const shouldRebuildGameBoard =
          roomMessage.uid !== user?.uid &&
          roomTileCount &&
          gameBoard?.length &&
          roomTileCount !== gameBoard?.length &&
          isRecentMessage;

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

      // Skip room change detection on the very first run (page load)
      if (isFirstRunRef.current) {
        isFirstRunRef.current = false;
        if (settings?.roomBackgroundURL?.length) {
          setRoomBackground(settings.roomBackgroundURL);
        }
        return;
      }

      // Enhanced room change detection
      const hasRoomChanged = room !== settings?.room;
      const hasValidSettings = settings && typeof settings.room !== 'undefined';
      const hasGameBoard = gameBoard?.length;
      const canRebuild = !hasRebuiltRef.current;

      // Only trigger room change if we have valid conditions
      if (hasValidSettings && hasRoomChanged && hasGameBoard && canRebuild) {
        debouncedRoomChanged();
        return;
      }

      if (settings?.roomBackgroundURL?.length) {
        setRoomBackground(settings.roomBackgroundURL);
      }
    } catch (error) {
      console.error('Error in room change effect:', error);
    }
  }, [room, settings, gameBoard, messages, isLoading, debouncedRoomChanged]);

  return { roller, roomBgUrl };
}
