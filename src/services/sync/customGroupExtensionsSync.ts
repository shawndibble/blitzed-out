/**
 * Sync for user-appended intensity levels on DEFAULT groups.
 *
 * Default groups never sync as whole records (each device seeds its own from
 * locale bundles), so appended levels travel as small name-keyed deltas on the
 * user-data doc and re-apply via the same append-only merge the importer and
 * re-seeder use. Removal propagation is out of scope (append-only, matching
 * CustomGroupsSync posture).
 */
import type { SyncResult } from '@/types/sync';
import { getCustomGroups, updateCustomGroup } from '@/stores/customGroups';
import { appendIntensities } from '@/services/intensityMerge';
import { SyncBase } from './base';

export interface GroupExtensionRecord {
  groupName: string;
  locale: string;
  gameMode: string;
  intensities: Array<{ value: number; label: string }>;
}

/** Snapshot the local extension records for pushing to the user-data doc. */
export async function collectGroupExtensionRecords(): Promise<GroupExtensionRecord[]> {
  const defaults = await getCustomGroups({ isDefault: true });
  return defaults
    .map((group) => ({
      groupName: group.name,
      locale: group.locale,
      gameMode: group.gameMode,
      intensities: group.intensities
        .filter((i) => !i.isDefault)
        .map((i) => ({ value: i.value, label: i.label })),
    }))
    .filter((record) => record.intensities.length > 0);
}

export class CustomGroupExtensionsSync extends SyncBase {
  static async syncFromFirebase(records: GroupExtensionRecord[]): Promise<SyncResult> {
    try {
      let applied = 0;

      for (const record of records) {
        const groups = await getCustomGroups({
          locale: record.locale,
          gameMode: record.gameMode,
          isDefault: true,
          name: record.groupName,
        });
        const group = groups[0];
        // Unknown group (different app version / unseeded locale): skip; the
        // record stays in Firebase and applies once the group exists.
        if (!group?.id) continue;

        const { merged, added } = appendIntensities(
          group.intensities,
          record.intensities,
          group.name
        );
        if (added.length === 0) continue;

        await updateCustomGroup(group.id, { intensities: merged });
        applied += added.length;
      }

      return this.createSuccessResult(applied);
    } catch (error) {
      return this.handleSyncError('custom group extensions sync', error);
    }
  }
}
