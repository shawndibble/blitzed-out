/**
 * Local-side repairs the sync path performs on Dexie before or during a merge.
 *
 * These live below the sync modules rather than in `syncService` so the entity
 * syncs can use them without importing their own caller.
 */
import { logger } from '@/utils/logger';
import {
  deleteAllIsCustomTiles,
  deleteCustomTile,
  getTiles,
  updateCustomTile,
} from '@/stores/customTiles';
import { getCustomGroups } from '@/stores/customGroups';
import { deleteGroup } from '@/stores/contentLibrary';

export const deleteAllCustomTiles = deleteAllIsCustomTiles;

/**
 * Collapse tiles that an earlier sync bug duplicated: keep the lowest id, and
 * carry a disabled state over from any duplicate so the user's intent survives.
 */
export async function cleanupDuplicateTiles(): Promise<boolean> {
  try {
    const allTiles = await getTiles({});

    const tileGroups = new Map<string, typeof allTiles>();
    allTiles.forEach((tile) => {
      const key = `${tile.group_id}|${tile.intensity}|${tile.action}`;
      if (!tileGroups.has(key)) {
        tileGroups.set(key, []);
      }
      tileGroups.get(key)!.push(tile);
    });

    for (const [, tiles] of tileGroups) {
      if (tiles.length > 1) {
        tiles.sort((a, b) => (a.id || 0) - (b.id || 0));
        const original = tiles[0];
        const duplicates = tiles.slice(1);

        const wasDisabled = duplicates.some((tile) => tile.isEnabled === 0);

        for (const duplicate of duplicates) {
          if (duplicate.id) {
            await deleteCustomTile(duplicate.id);
          }
        }

        if (wasDisabled && original.isEnabled === 1) {
          await updateCustomTile(original.id!, { isEnabled: 0 });
        }
      }
    }

    return true;
  } catch (error) {
    logger.error('Error cleaning up duplicate tiles:', error);
    return false;
  }
}

/** Clear user-created groups ahead of a full replace-from-cloud. */
export async function clearUserCustomGroups(): Promise<boolean> {
  try {
    const userGroups = await getCustomGroups({ isDefault: false });

    // Deliberately NOT cascadeDelete: deleteGroup refuses tile-owning groups,
    // which is load-bearing here. The re-import that follows strips incoming
    // ids and re-adds tiles under fresh local ids, so cascading would destroy
    // tiles the pull cannot faithfully restore. A refused delete still counts
    // as success — the group is about to be overwritten by the cloud copy.
    const deletePromises = userGroups.map((group) => deleteGroup(group.id));
    await Promise.all(deletePromises);

    return true;
  } catch (error) {
    logger.error('Error deleting user custom groups:', error);
    return false;
  }
}
