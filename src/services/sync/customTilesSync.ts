import type { SyncOptions, SyncResult } from '@/types/sync';
/**
 * Custom tiles synchronization logic
 * Updated to use group_id-based matching for improved sync reliability
 */
import { addCustomTile, getTiles, updateCustomTile } from '@/stores/customTiles';
import { deleteAllCustomTiles, syncCustomTilesToFirebase } from '../syncService';

import type { CustomTilePull } from '@/types/customTiles';
import { SyncBase } from './base';
import { TileMatcher } from './tileMatcher';

export class CustomTilesSync extends SyncBase {
  /**
   * Sync custom tiles from Firebase with smart conflict resolution
   */
  static async syncFromFirebase(
    firebaseTiles: CustomTilePull[],
    options: SyncOptions
  ): Promise<SyncResult> {
    try {
      const localTiles = await getTiles({ isCustom: 1 });

      // Smart conflict resolution
      if (firebaseTiles.length === 0 && localTiles.length > 0 && !options.forceSync) {
        await syncCustomTilesToFirebase();
        return this.createSuccessResult(localTiles.length);
      }

      if (firebaseTiles.length > 0 && localTiles.length > 0 && !options.forceSync) {
        return await this.mergeConflicts(firebaseTiles, localTiles);
      }

      if (firebaseTiles.length > 0 && (localTiles.length === 0 || options.forceSync)) {
        return await this.replaceLocal(firebaseTiles);
      }

      return this.createSuccessResult(0);
    } catch (error) {
      return this.handleSyncError('custom tiles sync', error);
    }
  }

  /**
   * Merge Firebase tiles with local tiles using group_id-based matching
   */
  private static async mergeConflicts(
    firebaseTiles: CustomTilePull[],
    localTiles: any[]
  ): Promise<SyncResult> {
    let addedCount = 0;
    let updatedCount = 0;

    for (const tile of firebaseTiles) {
      try {
        // Only process actual custom tiles (isCustom: 1)
        if (tile.isCustom !== 1) {
          console.warn(`Skipping non-custom tile in custom tiles sync: ${tile.action}`);
          continue;
        }

        // Validate tile has group_id (required for new sync system)
        if (!tile.group_id || !tile.group_id.trim()) {
          console.error(
            `Tile missing group_id during sync: ${tile.action} (group_id: ${tile.group_id})`
          );
          throw new Error(`All tiles must have group_id for sync. Tile: ${tile.action}`);
        }

        const matchResult = await TileMatcher.findExistingTile(tile);

        if (matchResult.existingTile) {
          // Update existing tile if needed (only isEnabled can be synced)
          if (matchResult.existingTile.isEnabled !== tile.isEnabled) {
            await updateCustomTile(matchResult.existingTile.id!, {
              isEnabled: tile.isEnabled,
            });
            updatedCount++;
          }
        } else {
          // Add new tile
          const tileWithoutId = this.removeId(tile);
          await addCustomTile(tileWithoutId);
          addedCount++;
        }
      } catch (error) {
        console.error('Error merging custom tile:', tile, error);
      }
    }

    // Sync the merged result back to Firebase
    await syncCustomTilesToFirebase();

    return this.createSuccessResult(addedCount + updatedCount + localTiles.length);
  }

  /**
   * Replace local tiles with Firebase tiles using group_id-based matching
   */
  private static async replaceLocal(firebaseTiles: CustomTilePull[]): Promise<SyncResult> {
    await deleteAllCustomTiles();
    await this.addSyncDelay();

    let importedCount = 0;

    for (const tile of firebaseTiles) {
      try {
        // Only process actual custom tiles (isCustom: 1)
        if (tile.isCustom !== 1) {
          console.warn(`Skipping non-custom tile in custom tiles sync: ${tile.action}`);
          continue;
        }

        // Validate tile has group_id (required for new sync system)
        if (!tile.group_id || !tile.group_id.trim()) {
          console.error(
            `Tile missing group_id during import: ${tile.action} (group_id: ${tile.group_id})`
          );
          throw new Error(`All tiles must have group_id for sync. Tile: ${tile.action}`);
        }

        const matchResult = await TileMatcher.findExistingTile(tile);

        if (!matchResult.existingTile) {
          const tileWithoutId = this.removeId(tile);
          await addCustomTile(tileWithoutId);
          importedCount++;
        }
      } catch (error) {
        console.error('Error importing custom tile:', tile, error);
      }
    }

    return this.createSuccessResult(importedCount);
  }
}
