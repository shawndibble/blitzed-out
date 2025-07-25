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
import { getValidationConstants } from '@/services/validationService';

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

/**
 * Clean form data by removing any action/consumption entries that have been deselected
 * This ensures that the Zustand store doesn't retain stale action selections
 */
function cleanFormData(formData: Settings): Settings {
  const cleanedData = { ...formData };
  const cleanedSelectedActions: Record<string, any> = {};

  // Clean the selectedActions object
  if (formData.selectedActions) {
    Object.entries(formData.selectedActions).forEach(([key, entry]) => {
      if (entry && entry.level > 0) {
        cleanedSelectedActions[key] = entry;
      }
    });
  }

  // Remove any old root-level action keys (for migration cleanup)
  const validationConstants = getValidationConstants();
  Object.keys(cleanedData).forEach((key) => {
    const entry = cleanedData[key] as any;
    if (
      entry &&
      typeof entry === 'object' &&
      entry.type &&
      validationConstants.VALID_GROUP_TYPES.includes(entry.type)
    ) {
      delete cleanedData[key];
    }
  });

  cleanedData.selectedActions = cleanedSelectedActions;

  return cleanedData;
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

      // Clean the formData to remove any deselected actions/consumptions before storing
      const cleanedFormData = cleanFormData(formData);

      updateSettings({
        ...cleanedFormData,
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
