import { Params, useParams } from 'react-router-dom';
import { getActiveBoard, upsertBoard } from '@/stores/gameBoard';
import {
  SubmitContext,
  SubmitDependencies,
  submitGameSettings,
} from '@/services/gameSettingsOrchestrator';
import { handleUser, sendRoomSettingsMessage } from '@/services/roomSettingsService';

import { Settings } from '@/types/Settings';
import { getActiveTiles } from '@/stores/customTiles';
import sendGameSettingsMessage from '@/services/gameSettingsMessage';
import useAuth from '@/context/hooks/useAuth';
import { useCallback, useState } from 'react';
import useGameBoard from './useGameBoard';
import { useLiveQuery } from 'dexie-react-hooks';
import { useLocalPlayers } from './useLocalPlayers';
import useMessages from '@/context/hooks/useMessages';
import useRoomNavigate from './useRoomNavigate';
import { useSettings } from '@/stores/settingsStore';
import { useTranslation } from 'react-i18next';
import { recordGameStart } from '@/services/playerStatsService';

export interface GameSettingsSubmitResult {
  submit: (formData: Settings, actionsList: any) => Promise<void>;
  isSubmitting: boolean;
  error: Error | null;
}

export default function useSubmitGameSettings(
  overrideDeps?: Partial<SubmitDependencies>
): GameSettingsSubmitResult {
  const { user, updateUser } = useAuth();
  const { id: currentRoom } = useParams<Params>();
  const { t } = useTranslation();
  const updateGameBoardTiles = useGameBoard();
  const [settings, updateSettings] = useSettings();
  const customTiles = useLiveQuery(() => getActiveTiles(settings?.gameMode));
  const gameBoard = useLiveQuery(getActiveBoard);
  const navigate = useRoomNavigate();
  const { messages } = useMessages();
  const { createLocalSession, hasLocalPlayers } = useLocalPlayers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submit = useCallback(
    async (formData: Settings, actionsList: any): Promise<void> => {
      setIsSubmitting(true);
      setError(null);

      const ctx: SubmitContext = {
        user,
        currentRoom,
        currentRoomTileCount: settings?.roomTileCount,
        messages,
        gameBoard,
        customTiles,
        hasLocalPlayers,
        settingsSnapshot: settings,
      };

      const deps: SubmitDependencies = {
        updateUser: (displayName: string) => handleUser(user, displayName, updateUser),
        updateGameBoardTiles,
        sendRoomSettingsFn: sendRoomSettingsMessage,
        upsertBoardFn: upsertBoard,
        sendGameSettingsFn: sendGameSettingsMessage,
        createLocalSessionFn: createLocalSession,
        updateSettingsFn: updateSettings,
        navigateFn: navigate,
        translateFn: t,
        recordGameStartFn: recordGameStart,
        ...overrideDeps,
      };

      try {
        await submitGameSettings(formData, actionsList, ctx, deps);
      } catch (err) {
        const e = err instanceof Error ? err : new Error('Submission failed');
        setError(e);
        throw e;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      user,
      updateUser,
      currentRoom,
      settings,
      messages,
      gameBoard,
      customTiles,
      hasLocalPlayers,
      updateGameBoardTiles,
      updateSettings,
      navigate,
      createLocalSession,
      t,
      overrideDeps,
    ]
  );

  return { submit, isSubmitting, error };
}
