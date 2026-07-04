import { Params, useParams } from 'react-router-dom';
import { getActiveBoard, upsertBoard } from '@/stores/gameBoard';

import type { SubmitContext, LocalEffects } from '@/services/gameSettingsOrchestrator';
import type { FirebaseGatewayPort } from '@/services/ports/FirebaseGatewayPort';
import type { GamePersistencePort } from '@/services/ports/GamePersistencePort';
import { makeFirebaseGatewayAdapter } from '@/services/adapters/FirebaseGatewayAdapter';
import { getActiveTiles } from '@/stores/contentLibrary';
import useAuth from '@/context/hooks/useAuth';
import useGameBoard from './useGameBoard';
import { useLiveQuery } from 'dexie-react-hooks';
import { useLocalPlayers } from './useLocalPlayers';
import useMessages from '@/context/hooks/useMessages';
import useRoomNavigate from './useRoomNavigate';
import { useContentMode, useSettings } from '@/stores/settingsStore';
import { useTranslation } from 'react-i18next';
import { recordGameStart } from '@/services/playerStatsService';

export interface GameSettingsWiring {
  ctx: SubmitContext;
  firebase: FirebaseGatewayPort;
  persistence: GamePersistencePort;
  effects: LocalEffects;
}

export function useGameSettingsWiring(): GameSettingsWiring {
  const { user, updateUser } = useAuth();
  const { id: currentRoom } = useParams<Params>();
  const { t } = useTranslation();
  const updateGameBoardTiles = useGameBoard();
  const [settings, updateSettings] = useSettings();
  const contentMode = useContentMode();
  const customTiles = useLiveQuery(() => getActiveTiles(contentMode));
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

  const firebase = makeFirebaseGatewayAdapter(user, updateUser);

  const persistence: GamePersistencePort = {
    updateGameBoardTiles,
    upsertBoard,
    createLocalSession,
    recordGameStart,
  };

  const effects: LocalEffects = {
    updateSettings,
    navigate,
    translate: t,
  };

  return { ctx, firebase, persistence, effects };
}
