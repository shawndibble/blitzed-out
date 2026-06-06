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
      // The active board is device-local — it is never adopted from a remote
      // copy, so a switch on one device can't deactivate/clobber another's.
      // Exception: a cold-start device with nothing active yet adopts the
      // remote-active board once, so the user isn't left with no active board.
      const hasActiveLocal = localBoards.some((board) => board.isActive);
      let coldStartActivated = false;

      let importedCount = 0;
      for (const board of gameBoards) {
        try {
          const local = localByTitle.get(board.title);
          // Skip when the local board is the winner; otherwise apply the remote
          // copy and preserve its timestamp.
          if (local && !this.remoteWins(local.updatedAt, board.updatedAt)) {
            continue;
          }

          // Keep the device-local active flag; only honor the remote flag for a
          // brand-new board on a device that has nothing active yet (once).
          let isActive = local ? local.isActive : 0;
          if (!local && !hasActiveLocal && !coldStartActivated && board.isActive) {
            isActive = 1;
            coldStartActivated = true;
          }

          await upsertBoard({
            title: board.title,
            tiles: board.tiles || [],
            tags: board.tags || [],
            gameMode: board.gameMode || 'online',
            isActive,
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
