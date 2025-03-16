import useAuth from '@/context/hooks/useAuth';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { getActiveTiles } from '@/stores/customTiles';
import useGameBoard from './useGameBoard';
import useLocalStorage from './useLocalStorage';
import sendGameSettingsMessage from '@/services/gameSettingsMessage';
import { getActiveBoard, upsertBoard } from '@/stores/gameBoard';
import { handleUser, sendRoomSettingsMessage } from '@/views/GameSettings/submitForm';
import useMessages from '@/context/hooks/useMessages';
import useRoomNavigate from './useRoomNavigate';
import { isPublicRoom } from '@/helpers/strings';
import { isValidURL } from '@/helpers/urls';
import { useCallback } from 'react';

interface FormData {
  room: string;
  roomTileCount?: number;
  roomBackgroundURL?: string;
  roomUpdated?: boolean;
  displayName: string;
  gameMode?: string;
  boardUpdated?: boolean;
  [key: string]: any;
}

interface RouteParams {
  id: string;
}

interface Message {
  type: string;
  [key: string]: any;
}

interface RoomChangeResult {
  roomChanged: boolean;
  isPrivateRoom: boolean;
  privateBoardSizeChanged: boolean;
}

interface Settings {
  roomTileCount?: number;
  [key: string]: any;
}

interface GameBoardResult {
  settingsBoardUpdated: boolean;
  gameMode: string;
  newBoard: any[];
}

function updateRoomBackground(formData: FormData): void {
  if (!formData.roomBackgroundURL || !isValidURL(formData.roomBackgroundURL)) {
    formData.roomBackground = 'app';
  }
}

export default function useSubmitGameSettings(): (formData: FormData, actionsList: any) => Promise<void> {
  const { user, updateUser } = useAuth();
  const { id: room } = useParams<RouteParams>();
  const { t } = useTranslation();
  const updateGameBoardTiles = useGameBoard();
  const [settings, updateSettings] = useLocalStorage<Settings>('gameSettings');
  const customTiles = useLiveQuery(() => getActiveTiles(settings?.gameMode));
  const gameBoard = useLiveQuery(getActiveBoard);
  const navigate = useRoomNavigate();
  const { messages } = useMessages();

  const handleRoomChange = useCallback((formData: FormData): RoomChangeResult => {
    const roomChanged = room?.toUpperCase() !== formData.room.toUpperCase();
    const isPrivateRoom = formData.room && !isPublicRoom(formData.room);
    const privateBoardSizeChanged =
      isPrivateRoom && formData.roomTileCount !== settings?.roomTileCount;
    return { roomChanged, isPrivateRoom, privateBoardSizeChanged };
  }, [room, settings?.roomTileCount]);

  const submitSettings = useCallback(async (formData: FormData, actionsList: any): Promise<void> => {
    const { displayName } = formData;
    const updatedUser = await handleUser(user, displayName, updateUser);

    updateRoomBackground(formData);

    const { settingsBoardUpdated, gameMode, newBoard } = await updateGameBoardTiles(formData) as GameBoardResult;
    const { roomChanged, isPrivateRoom, privateBoardSizeChanged } = handleRoomChange(formData);

    if (isPrivateRoom && (formData.roomUpdated || !messages.find((m: Message) => m.type === 'room'))) {
      await sendRoomSettingsMessage(formData, updatedUser);
    }

    if (gameBoard?.tiles !== newBoard) {
      await upsertBoard({
        title: t('settingsGenerated'),
        tiles: newBoard,
        isActive: 1,
        gameMode,
      });
    }

    if (settingsBoardUpdated || roomChanged || privateBoardSizeChanged) {
      await sendGameSettingsMessage({
        formData,
        user: updatedUser,
        customTiles,
        actionsList,
        title: 'Settings Generated Board',
        tiles: newBoard,
      });
    }

    updateSettings({
      ...formData,
      boardUpdated: false,
      roomUpdated: false,
      gameMode,
    });

    navigate(formData.room);
  }, [user, updateUser, updateGameBoardTiles, handleRoomChange, messages, gameBoard, t, customTiles, updateSettings, navigate]);

  return useCallback((formData: FormData, actionsList: any) => submitSettings(formData, actionsList), [submitSettings]);
}
