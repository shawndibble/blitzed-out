import { vi } from 'vitest';
import type { GamePersistencePort } from '../../ports/GamePersistencePort';
import type { GameBoardResult } from '@/types/gameBoard';

export function makeInMemoryGamePersistenceAdapter(
  boardResult: GameBoardResult = {
    settingsBoardUpdated: true,
    gameMode: 'online',
    newBoard: [{ title: 'Tile 1', description: 'Do something' }],
  }
): GamePersistencePort & {
  updateGameBoardTiles: ReturnType<typeof vi.fn>;
  upsertBoard: ReturnType<typeof vi.fn>;
  createLocalSession: ReturnType<typeof vi.fn>;
  recordGameStart: ReturnType<typeof vi.fn>;
} {
  return {
    updateGameBoardTiles: vi.fn().mockResolvedValue(boardResult),
    upsertBoard: vi.fn().mockResolvedValue(1),
    createLocalSession: vi.fn().mockResolvedValue(undefined),
    recordGameStart: vi.fn().mockResolvedValue(undefined),
  };
}
