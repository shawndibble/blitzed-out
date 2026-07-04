import type { SyncOptions, SyncResult } from '@/types/sync';
/**
 * Custom tiles synchronization logic
 * Updated to use group_id-based matching for improved sync reliability
 */
import {
  addCustomTile,
  canonicalizeTileAction,
  getTiles,
  updateCustomTile,
} from '@/stores/customTiles';
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
      // Tile identity (TileMatcher) compares raw action text, and stored tiles
      // are canonical (intake normalization). Canonicalize the remote side and
      // sweep any legacy alias rows locally, or the same tile in two forms
      // mints a duplicate on every merge cycle.
      firebaseTiles = firebaseTiles.map((tile) => canonicalizeTileAction(tile));

      const localTiles = await getTiles({ isCustom: 1 });
      for (const tile of localTiles) {
        try {
          const canonical = canonicalizeTileAction(tile);
          if (canonical.action !== tile.action && tile.id !== undefined) {
            await updateCustomTile(tile.id, { action: canonical.action });
            tile.action = canonical.action;
          }
        } catch (error) {
          // One bad row must not abort the whole sync (same per-tile isolation
          // as mergeConflicts/replaceLocal).
          console.error('Error canonicalizing legacy local tile:', tile, error);
        }
      }

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
          const existing = matchResult.existingTile;
          // Update existing tile if needed (only isEnabled is synced), and only
          // when the remote copy wins last-writer-wins. Preserve the remote
          // timestamp so the applied tile doesn't look newer than its source.
          if (
            existing.isEnabled !== tile.isEnabled &&
            this.remoteWins(existing.updatedAt, tile.updatedAt)
          ) {
            await updateCustomTile(existing.id!, {
              isEnabled: tile.isEnabled,
              updatedAt: tile.updatedAt ?? Date.now(),
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

    // Only push the merged result back when something actually changed —
    // otherwise the real-time listener would echo every pull into a push.
    if (addedCount + updatedCount > 0) {
      await syncCustomTilesToFirebase();
    }

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
