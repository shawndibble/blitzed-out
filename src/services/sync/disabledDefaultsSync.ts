/**
 * Disabled defaults synchronization.
 *
 * Disabled defaults are first-class records (`disabledDefaults` table) keyed by
 * the content tuple, each carrying `active` (tombstone) + `updatedAt`. Sync is
 * per-record last-writer-wins, so re-enables propagate across devices and the
 * old whole-list-replace + 100-cap data loss is gone.
 *
 * Back-compat: new clients write `disabledDefaultsV2` (full records) plus a
 * legacy `disabledDefaults` array (active-only) for pre-V2 clients. On pull we
 * prefer V2; when only the legacy array exists (written by an old client) we
 * import its entries as active records.
 */
import { SyncBase } from './base';
import { mergeRemoteDisabledRecords, reconcileDisabledRows } from '@/stores/disabledDefaults';
import { syncDisabledDefaultsToFirebase } from '../syncService';
import type { DisabledDefault } from '@/types/customTiles';
import type { SyncResult } from '@/types/sync';

interface LegacyDisabled {
  group_id?: string;
  intensity: number;
  action: string;
}

function legacyToRecords(legacy: LegacyDisabled[]): DisabledDefault[] {
  // No timestamp in the legacy shape; stamp 1 so any genuine V2 edit wins, but
  // a first-time import still applies over the never-seen local default (-1).
  return legacy
    .filter((t) => t && typeof t.action === 'string')
    .map((t) => ({
      key: `${t.group_id}|${t.intensity}|${t.action}`,
      group_id: t.group_id,
      intensity: t.intensity,
      action: t.action,
      active: true,
      updatedAt: 1,
    }));
}

export class DisabledDefaultsSync extends SyncBase {
  /**
   * @param v2 the `disabledDefaultsV2` field (preferred) or undefined
   * @param legacy the legacy `disabledDefaults` array (fallback)
   */
  static async syncFromFirebase(
    v2: DisabledDefault[] | undefined,
    legacy: LegacyDisabled[] | undefined
  ): Promise<SyncResult> {
    try {
      const remote = Array.isArray(v2) ? v2 : legacyToRecords(legacy ?? []);

      const changed = await mergeRemoteDisabledRecords(remote);

      // Only touch row flags / push back when the merge actually changed the
      // table. A no-op pull means rows are already consistent (reconciled on the
      // prior change and after migration), so we skip the full default scan and
      // avoid echoing our own apply through the real-time listener.
      if (changed > 0) {
        await reconcileDisabledRows();
        await syncDisabledDefaultsToFirebase();
      }

      return this.createSuccessResult(changed);
    } catch (error) {
      return this.handleSyncError('disabled defaults sync', error);
    }
  }
}
