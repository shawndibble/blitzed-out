import type { LocalPlayer, LocalSessionSettings } from '@/types';
import { Params, useParams } from 'react-router-dom';
import { getActiveBoard, upsertBoard } from '@/stores/gameBoard';
import { handleUser, sendRoomSettingsMessage } from '@/views/GameSettings/submitForm';

import { GameBoardResult } from '@/types/gameBoard';
import { Message } from '@/types/Message';
import { Settings } from '@/types/Settings';
import { getActiveTiles } from '@/stores/customTiles';
import { VALID_GROUP_TYPES } from '@/services/validationService';
import { isPublicRoom } from '@/helpers/strings';
import { isValidURL } from '@/helpers/urls';
import sendGameSettingsMessage from '@/services/gameSettingsMessage';
import useAuth from '@/context/hooks/useAuth';
import { useCallback } from 'react';
import useGameBoard from './useGameBoard';
import { useLiveQuery } from 'dexie-react-hooks';
import { useLocalPlayers } from './useLocalPlayers';
import useMessages from '@/context/hooks/useMessages';
import useRoomNavigate from './useRoomNavigate';
import { useSettings } from '@/stores/settingsStore';
import { useTranslation } from 'react-i18next';

interface RoomChangeResult {
  roomChanged: boolean;
  isPrivateRoom: boolean;
  privateBoardSizeChanged: boolean;
}
function updateRoomBackground(formData: Settings): void {
  const url = formData.roomBackgroundURL?.trim();
  if (url !== formData.roomBackgroundURL) {
    formData.roomBackgroundURL = url || '';
  }
  if (formData.roomBackgroundURL && !isValidURL(formData.roomBackgroundURL)) {
    formData.roomBackgroundURL = ''; // Clear invalid URL
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
      if (entry && entry.levels && entry.levels.length > 0) {
        cleanedSelectedActions[key] = entry;
      }
    });
  }

  // Remove any old root-level action keys (for migration cleanup)
  Object.keys(cleanedData).forEach((key) => {
    const entry = cleanedData[key] as any;
    if (
      entry &&
      typeof entry === 'object' &&
      entry.type &&
      VALID_GROUP_TYPES.includes(entry.type)
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
  const { createLocalSession } = useLocalPlayers();

  const handleRoomChange = useCallback(
    (formData: Settings): RoomChangeResult => {
      // Handle the case where room might be undefined (original logic with safety check)
      const currentRoomUpper = (room || '')?.toUpperCase();
      const formDataRoomUpper = (formData.room || '').toUpperCase();
      const roomChanged = currentRoomUpper !== formDataRoomUpper;
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

      // Handle local player session initialization if data exists
      const typedFormData = formData as any; // Use any type to access wizard-specific properties
      if (
        typedFormData.hasLocalPlayers &&
        typedFormData.localPlayersData &&
        typedFormData.localPlayerSessionSettings
      ) {
        try {
          await createLocalSession(
            formData.room,
            typedFormData.localPlayersData as LocalPlayer[],
            typedFormData.localPlayerSessionSettings as LocalSessionSettings
          );
        } catch (error) {
          console.error('Error creating local session:', error);
          // Don't throw here to prevent blocking the settings save
        }
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
      createLocalSession,
    ]
  );

  return useCallback(
    (formData: Settings, actionsList: any) => submitSettings(formData, actionsList),
    [submitSettings]
  );
}
