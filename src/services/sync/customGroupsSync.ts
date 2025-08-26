/**
 * Custom groups synchronization logic
 */
import { getCustomGroups, importCustomGroups } from '@/stores/customGroups';
import { syncCustomGroupsToFirebase, clearUserCustomGroups } from '../syncService';
import { SyncBase } from './base';
import type { SyncOptions, SyncResult } from '@/types/sync';
import type { CustomGroupPull } from '@/types/customGroups';

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
      if (firebaseGroups.length === 0 && localGroups.length > 0 && !options.forceSync) {
        console.log('Preserving local custom groups - Firebase is empty but local has data');
        await syncCustomGroupsToFirebase();
        return this.createSuccessResult(localGroups.length);
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
    console.log(
      `Merging groups: Local has ${localGroups.length}, Firebase has ${firebaseGroups.length}`
    );

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
        console.error('Error merging custom group:', group, error);
      }
    }

    console.log(
      `Merged groups: Added ${addedCount} new groups from Firebase, preserved ${localGroups.length} local groups`
    );

    // Sync the merged result back to Firebase
    await syncCustomGroupsToFirebase();

    return this.createSuccessResult(addedCount + localGroups.length);
  }

  /**
   * Replace local groups with Firebase groups
   */
  private static async replaceLocal(firebaseGroups: CustomGroupPull[]): Promise<SyncResult> {
    console.log(`Syncing ${firebaseGroups.length} custom groups from Firebase`);

    await clearUserCustomGroups();
    await this.addSyncDelay();

    try {
      const groupsWithoutIds = firebaseGroups.map((group) => this.removeId(group));
      await importCustomGroups(groupsWithoutIds);

      console.log(`Successfully imported ${firebaseGroups.length} custom groups from Firebase`);
      return this.createSuccessResult(firebaseGroups.length);
    } catch (error) {
      console.error('Error importing custom groups:', error);
      return this.handleSyncError('groups import', error);
    }
  }
}
