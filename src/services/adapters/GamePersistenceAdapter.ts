import type { LocalPlayer, LocalSessionSettings } from '@/types';
import type { Settings } from '@/types/Settings';
import type { GameBoardResult } from '@/types/gameBoard';
import type { GamePersistencePort } from '../ports/GamePersistencePort';
import { upsertBoard } from '@/stores/gameBoard';
import { recordGameStart } from '@/services/playerStatsService';

export function makeGamePersistenceAdapter(
  updateGameBoardTilesFn: (settings: Settings) => Promise<GameBoardResult>,
  createLocalSessionFn: (
    roomId: string,
    players: LocalPlayer[],
    sessionSettings: LocalSessionSettings
  ) => Promise<void>
): GamePersistencePort {
  return {
    updateGameBoardTiles: updateGameBoardTilesFn,
    upsertBoard,
    createLocalSession: createLocalSessionFn,
    recordGameStart,
  };
}
