import { Params, useParams } from 'react-router-dom';
import { getActiveBoard, upsertBoard } from '@/stores/gameBoard';
import { handleUser, sendRoomSettingsMessage } from '@/services/roomSettingsService';

import type { SubmitContext, SubmitDependencies } from '@/services/gameSettingsOrchestrator';
import { getActiveTiles } from '@/stores/customTiles';
import sendGameSettingsMessage from '@/services/gameSettingsMessage';
import useAuth from '@/context/hooks/useAuth';
import useGameBoard from './useGameBoard';
import { useLiveQuery } from 'dexie-react-hooks';
import { useLocalPlayers } from './useLocalPlayers';
import useMessages from '@/context/hooks/useMessages';
import useRoomNavigate from './useRoomNavigate';
import { useSettings } from '@/stores/settingsStore';
import { useTranslation } from 'react-i18next';
import { recordGameStart } from '@/services/playerStatsService';
import { getContentGameMode } from '@/helpers/strings';

export interface GameSettingsWiring {
  ctx: SubmitContext;
  deps: SubmitDependencies;
}

export function useGameSettingsWiring(): GameSettingsWiring {
  const { user, updateUser } = useAuth();
  const { id: currentRoom } = useParams<Params>();
  const { t } = useTranslation();
  const updateGameBoardTiles = useGameBoard();
  const [settings, updateSettings] = useSettings();
  const customTiles = useLiveQuery(() => getActiveTiles(getContentGameMode(settings?.gameMode)));
  const gameBoard = useLiveQuery(getActiveBoard);
  const navigate = useRoomNavigate();
  const { messages } = useMessages();
  const { createLocalSession, hasLocalPlayers } = useLocalPlayers();

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
  };

  return { ctx, deps };
}
