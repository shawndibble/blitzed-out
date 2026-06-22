/**
 * Database helpers backing the export-statistics queries.
 */

import db from '@/stores/store';
import { CustomGroupPull } from '@/types/customGroups';

/**
 * Fetch groups regardless of locale or game mode, for export purposes.
 *
 * By default only custom (non-default) groups are returned. Pass
 * `includeDefaultGroups` when the caller needs default groups too — e.g.
 * resolving the groups that disabled-default tiles belong to for export stats.
 */
export async function batchFetchAllGroups(
  groupNames?: string[],
  includeDefaultGroups = false
): Promise<CustomGroupPull[]> {
  const allGroups = await db.customGroups.toArray();
  const groups = includeDefaultGroups ? allGroups : allGroups.filter((g) => !g.isDefault);

  if (groupNames && groupNames.length > 0) {
    return groups.filter((g) => groupNames.includes(g.name));
  }

  return groups;
}
