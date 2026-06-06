import type { LocalPlayer, LocalSessionSettings } from '@/types';
import type { Settings } from '@/types/Settings';
import type { GameBoardResult, DBGameBoard, TileExport } from '@/types/gameBoard';

export interface UpsertBoardRecord extends Partial<DBGameBoard> {
  tiles: TileExport[];
  isActive: number;
}

/**
 * Port for all writes to local IndexedDB/Dexie.
 * Separate from FirebaseGatewayPort — different medium, different test doubles.
 */
export interface GamePersistencePort {
  updateGameBoardTiles(settings: Settings): Promise<GameBoardResult>;
  upsertBoard(record: UpsertBoardRecord): Promise<number | undefined>;
  createLocalSession(
    roomId: string,
    players: LocalPlayer[],
    sessionSettings: LocalSessionSettings
  ): Promise<void>;
  recordGameStart(uid: string): Promise<void>;
}
