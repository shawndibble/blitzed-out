/**
 * Database helpers backing the export-statistics queries.
 */

import db from '@/stores/store';
import { CustomGroupPull } from '@/types/customGroups';

/**
 * Fetch all custom groups regardless of locale or game mode.
 * For export purposes — get everything the user created.
 */
export async function batchFetchAllGroups(groupNames?: string[]): Promise<CustomGroupPull[]> {
  // Get all groups first, then filter for custom groups (non-default)
  const allGroups = await db.customGroups.toArray();
  const customGroups = allGroups.filter((g) => !g.isDefault);

  if (groupNames && groupNames.length > 0) {
    return customGroups.filter((g) => groupNames.includes(g.name));
  }

  return customGroups;
}
