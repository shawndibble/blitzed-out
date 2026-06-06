import type { DBGameBoard } from '@/types/gameBoard';
import { SyncBase } from './base';
import type { SyncResult } from '@/types/sync';
/**
 * Game boards synchronization logic
 */
import { getBoards, upsertBoard } from '@/stores/gameBoard';

export class GameBoardsSync extends SyncBase {
  /**
   * Sync game boards from Firebase
   */
  static async syncFromFirebase(gameBoards: DBGameBoard[]): Promise<SyncResult> {
    if (!gameBoards || gameBoards.length === 0) {
      return this.createSuccessResult(0);
    }

    try {
      // Index local boards by title for last-writer-wins comparison.
      const localBoards = await getBoards();
      const localByTitle = new Map(localBoards.map((board) => [board.title, board]));

      let importedCount = 0;
      for (const board of gameBoards) {
        try {
          const local = localByTitle.get(board.title);
          // Skip when the local board is the winner; otherwise apply the remote
          // copy and preserve its timestamp.
          if (local && !this.remoteWins(local.updatedAt, board.updatedAt)) {
            continue;
          }

          await upsertBoard({
            title: board.title,
            tiles: board.tiles || [],
            tags: board.tags || [],
            gameMode: board.gameMode || 'online',
            isActive: board.isActive || 0,
            updatedAt: board.updatedAt ?? Date.now(),
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
