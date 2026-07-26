import { logger } from '@/utils/logger';
import type { SyncOptions, SyncResult } from '@/types/sync';
import { clearUserCustomGroups } from './localCleanup';
/**
 * Custom groups synchronization logic
 */
import { getCustomGroups, importCustomGroups } from '@/stores/customGroups';

import type { CustomGroupPull } from '@/types/customGroups';
import { SyncBase } from './base';

export class CustomGroupsSync extends SyncBase {
  /**
   * Sync custom groups from Firebase with smart conflict resolution
   */
  static async syncFromFirebase(
    firebaseGroups: CustomGroupPull[],
    options: SyncOptions
  ): Promise<SyncResult> {
    try {
      const localGroups = await getCustomGroups({ isDefault: false });

      // Smart conflict resolution
      // Cloud has nothing, this device does: the cycle's single push publishes it.
      if (firebaseGroups.length === 0 && localGroups.length > 0 && !options.forceSync) {
        return this.createSuccessResult(localGroups.length, true);
      }

      if (firebaseGroups.length > 0 && localGroups.length > 0 && !options.forceSync) {
        return await this.mergeConflicts(firebaseGroups, localGroups);
      }

      if (firebaseGroups.length > 0 && (localGroups.length === 0 || options.forceSync)) {
        return await this.replaceLocal(firebaseGroups);
      }

      return this.createSuccessResult(0);
    } catch (error) {
      return this.handleSyncError('custom groups sync', error);
    }
  }

  /**
   * Merge Firebase groups with local groups (no conflicts)
   */
  private static async mergeConflicts(
    firebaseGroups: CustomGroupPull[],
    localGroups: any[]
  ): Promise<SyncResult> {
    let addedCount = 0;

    for (const group of firebaseGroups) {
      try {
        const existingGroups = await getCustomGroups({
          locale: group.locale,
          gameMode: group.gameMode,
          name: group.name,
        });

        if (existingGroups.length === 0) {
          const groupWithoutId = this.removeId(group);
          await importCustomGroups([groupWithoutId]);
          addedCount++;
        }
      } catch (error) {
        logger.error('Error merging custom group:', group, error);
      }
    }

    return this.createSuccessResult(addedCount + localGroups.length, addedCount > 0);
  }

  /**
   * Replace local groups with Firebase groups
   */
  private static async replaceLocal(firebaseGroups: CustomGroupPull[]): Promise<SyncResult> {
    await clearUserCustomGroups();
    await this.addSyncDelay();

    try {
      const groupsWithoutIds = firebaseGroups.map((group) => this.removeId(group));
      await importCustomGroups(groupsWithoutIds);

      return this.createSuccessResult(firebaseGroups.length);
    } catch (error) {
      logger.error('Error importing custom groups:', error);
      return this.handleSyncError('groups import', error);
    }
  }
}
