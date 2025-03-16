import { useEffect, useState, useCallback } from 'react';
import { sendRoomSettingsMessage } from '@/views/GameSettings/submitForm';
import sendGameSettingsMessage from '@/services/gameSettingsMessage';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useTranslation } from 'react-i18next';
import { importActions } from '@/services/importLocales';
import latestMessageByType, { latestMessageBy } from '@/helpers/messages';
import { useParams } from 'react-router-dom';
import { getActiveTiles } from '@/stores/customTiles';
import { useLiveQuery } from 'dexie-react-hooks';
import { getActiveBoard } from '@/stores/gameBoard';
import { isPublicRoom } from '@/helpers/strings';

interface User {
  uid: string;
  [key: string]: any;
}

interface Message {
  type: string;
  uid: string;
  settings?: string;
  [key: string]: any;
}

interface RoomMessage {
  roomTileCount: number;
  [key: string]: any;
}

interface RouteParams {
  id: string;
}

interface Settings {
  gameMode: string;
  roomTileCount?: number;
  [key: string]: any;
}

interface Board {
  title: string;
  tiles: any[];
  [key: string]: any;
}

function isCompatibleBoard(
  isPrivateRoom: boolean, 
  latestRoomMessage: RoomMessage | null, 
  boardSize: number, 
  roomTileCount?: number
): boolean {
  if (!isPrivateRoom && boardSize === 40) return true;

  if (!latestRoomMessage) return false;

  const { roomTileCount: latestRoomTileCount } = latestRoomMessage;

  if (boardSize !== latestRoomTileCount) return false;

  return boardSize === roomTileCount;
}

export default function useSendSettings(
  user: User, 
  messages: Message[], 
  isLoading: boolean
): void {
  const { id: room } = useParams<RouteParams>();
  const [settingsSent, setSettingsSent] = useState<boolean>(false);
  const { i18n } = useTranslation();
  const [settings] = useLocalStorage<Settings>('gameSettings');
  const customTiles = useLiveQuery(() => getActiveTiles(settings?.gameMode));
  const board = useLiveQuery<Board | undefined>(getActiveBoard);

  const sendSettings = useCallback(async () => {
    if (!settings || isLoading || settingsSent || !board?.tiles?.length) return;

    const isPrivateRoom = !isPublicRoom(room || '');
    const formData = { ...settings, room };
    // send out room specific settings if we are in a private room.
    const latestRoomMessage = latestMessageByType(messages, 'room') as RoomMessage | null;
    if (isPrivateRoom && !latestRoomMessage) {
      await sendRoomSettingsMessage(formData, user);
    }

    setSettingsSent(true);

    // if our board updated, or we changed rooms, send out game settings message.
    // if our settings board is incompatible with the room, let PrivateRoomMonitor handle it.
    const isCompatible = isCompatibleBoard(
      isPrivateRoom,
      latestRoomMessage,
      board.tiles.length,
      settings.roomTileCount
    );

    const alreadySentSettings = latestMessageBy(
      messages,
      (m: Message) => m.type === 'settings' && m.uid === user.uid
    );

    if (!alreadySentSettings && isCompatible) {
      const actionsList = await importActions(i18n.resolvedLanguage, settings.gameMode);

      await sendGameSettingsMessage({
        formData,
        user,
        customTiles,
        actionsList,
        tiles: board.tiles,
        title: board.title,
      });
    }
  }, [board, customTiles, i18n.resolvedLanguage, isLoading, messages, room, settings, settingsSent, user]);

  // populate the room and game settings if they are not part of the message list.
  useEffect(() => {
    sendSettings();
  }, [sendSettings]);
}
