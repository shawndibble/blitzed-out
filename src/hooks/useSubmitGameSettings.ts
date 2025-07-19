import useAuth from '@/context/hooks/useAuth';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { Params, useParams } from 'react-router-dom';
import { getActiveTiles } from '@/stores/customTiles';
import useGameBoard from './useGameBoard';
import { useSettings } from '@/stores/settingsStore';
import sendGameSettingsMessage from '@/services/gameSettingsMessage';
import { getActiveBoard, upsertBoard } from '@/stores/gameBoard';
import { handleUser, sendRoomSettingsMessage } from '@/views/GameSettings/submitForm';
import useMessages from '@/context/hooks/useMessages';
import useRoomNavigate from './useRoomNavigate';
import { isPublicRoom } from '@/helpers/strings';
import { isValidURL } from '@/helpers/urls';
import { useCallback } from 'react';
import { Message } from '@/types/Message';
import { Settings } from '@/types/Settings';
import { GameBoardResult } from '@/types/gameBoard';

interface RoomChangeResult {
  roomChanged: boolean;
  isPrivateRoom: boolean;
  privateBoardSizeChanged: boolean;
}
function updateRoomBackground(formData: Settings): void {
  if (!formData.roomBackgroundURL || !isValidURL(formData.roomBackgroundURL)) {
    formData.roomBackground = 'app';
  }
}

export default function useSubmitGameSettings(): (
  formData: Settings,
  actionsList: any
) => Promise<void> {
  const { user, updateUser } = useAuth();
  const { id: room } = useParams<Params>();
  const { t } = useTranslation();
  const updateGameBoardTiles = useGameBoard();
  const [settings, updateSettings] = useSettings();
  const customTiles = useLiveQuery(() => getActiveTiles(settings?.gameMode));
  const gameBoard = useLiveQuery(getActiveBoard);
  const navigate = useRoomNavigate();
  const { messages } = useMessages();

  const handleRoomChange = useCallback(
    (formData: Settings): RoomChangeResult => {
      const roomChanged = room?.toUpperCase() !== formData.room.toUpperCase();
      const isPrivateRoom = Boolean(formData.room && !isPublicRoom(formData.room));
      const privateBoardSizeChanged =
        isPrivateRoom && formData.roomTileCount !== settings?.roomTileCount;
      return { roomChanged, isPrivateRoom, privateBoardSizeChanged };
    },
    [room, settings?.roomTileCount]
  );

  const submitSettings = useCallback(
    async (formData: Settings, actionsList: any): Promise<void> => {
      const { displayName } = formData;
      const updatedUser = await handleUser(user, displayName, updateUser);

      updateRoomBackground(formData);

      const {
        settingsBoardUpdated,
        gameMode,
        newBoard = [],
      } = (await updateGameBoardTiles(formData)) as GameBoardResult;
      const { roomChanged, isPrivateRoom, privateBoardSizeChanged } = handleRoomChange(formData);

      if (!updatedUser) return;

      if (
        isPrivateRoom &&
        (formData.roomUpdated || !messages.find((m: Message) => m.type === 'room'))
      ) {
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

      const shouldSendGameSettings =
        (settingsBoardUpdated || roomChanged || privateBoardSizeChanged) &&
        !messages.some(
          (m: Message) =>
            m.type === 'settings' &&
            m.uid === updatedUser.uid &&
            Date.now() - (m.timestamp?.toMillis() || 0) < 5000
        );

      if (shouldSendGameSettings) {
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
    },
    [
      user,
      updateUser,
      updateGameBoardTiles,
      handleRoomChange,
      messages,
      gameBoard,
      t,
      customTiles,
      updateSettings,
      navigate,
    ]
  );

  return useCallback(
    (formData: Settings, actionsList: any) => submitSettings(formData, actionsList),
    [submitSettings]
  );
}
