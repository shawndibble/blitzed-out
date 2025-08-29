import type { DBGameBoard } from '@/types/gameBoard';
import { SyncBase } from './base';
import type { SyncResult } from '@/types/sync';
/**
 * Game boards synchronization logic
 */
import { upsertBoard } from '@/stores/gameBoard';

export class GameBoardsSync extends SyncBase {
  /**
   * Sync game boards from Firebase
   */
  static async syncFromFirebase(gameBoards: DBGameBoard[]): Promise<SyncResult> {
    if (!gameBoards || gameBoards.length === 0) {
      return this.createSuccessResult(0);
    }

    try {
      let importedCount = 0;
      for (const board of gameBoards) {
        try {
          await upsertBoard({
            title: board.title,
            tiles: board.tiles || [],
            tags: board.tags || [],
            gameMode: board.gameMode || 'online',
            isActive: board.isActive || 0,
          });
          importedCount++;
        } catch (error) {
          console.error('Error importing game board:', board, error);
        }
      }

      return this.createSuccessResult(importedCount);
    } catch (error) {
      return this.handleSyncError('game boards sync', error);
    }
  }
}
