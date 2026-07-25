/**
 * Disabled defaults synchronization.
 *
 * Disabled defaults are first-class records (`disabledDefaults` table) keyed by
 * the content tuple, each carrying `active` (tombstone) + `updatedAt`. Sync is
 * per-record last-writer-wins, so re-enables propagate across devices and the
 * old whole-list-replace + 100-cap data loss is gone.
 *
 * Back-compat lives in the document owner (`remoteUserData`): it resolves the
 * V2 field against the legacy `disabledDefaults` array, so this merge only ever
 * sees records.
 */
import { SyncBase } from './base';
import { mergeRemoteDisabledRecords, reconcileDisabledRows } from '@/stores/disabledDefaults';
import type { DisabledDefault } from '@/types/customTiles';
import type { SyncResult } from '@/types/sync';

export class DisabledDefaultsSync extends SyncBase {
  static async syncFromFirebase(remote: DisabledDefault[]): Promise<SyncResult> {
    try {
      const changed = await mergeRemoteDisabledRecords(remote);

      // Only touch row flags when the merge actually changed the table. A no-op
      // pull means rows are already consistent (reconciled on the prior change
      // and after migration), so we skip the full default scan — and report no
      // change, so the cycle doesn't echo its own apply back to the cloud.
      if (changed > 0) {
        await reconcileDisabledRows();
      }

      return this.createSuccessResult(changed, changed > 0);
    } catch (error) {
      return this.handleSyncError('disabled defaults sync', error);
    }
  }
}
