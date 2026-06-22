/**
 * Export statistics: counts exportable custom groups, custom tiles, and
 * disabled default tiles for the export-selection UI.
 */

import { batchFetchAllGroups } from './databaseOperations';
import { getTiles } from '@/stores/customTiles';

export interface ExportableGroupStats {
  name: string;
  label: string;
  exportCount: {
    customGroups: number; // 1 if group itself is custom, 0 if default
    customTiles: number; // Count of custom tiles in this group
    disabledDefaults: number; // Count of disabled default tiles (if includeDisabled)
    total: number; // Sum of all above
  };
}

/**
 * Get exportable groups with accurate counts for each export category.
 * Gets ALL user custom groups regardless of locale/gameMode for export.
 * Uses the same 3-query approach as exportAllData for consistency.
 */
export async function getExportableGroupStats(
  includeDisabledDefaults = false,
  exportScope: 'all' | 'custom' | 'single' | 'disabled' = 'all'
): Promise<ExportableGroupStats[]> {
  // Query 1: Get ALL custom groups (regardless of locale/gameMode) - only for 'all', 'custom', and 'single' scopes
  const customGroups = exportScope === 'disabled' ? [] : await batchFetchAllGroups();

  // Query 2: Get ALL custom tiles (isCustom = true) regardless of locale/gameMode - only for 'all', 'custom', and 'single' scopes
  const allCustomTiles = exportScope === 'disabled' ? [] : await getTiles({ isCustom: 1 });

  // Query 3: Get ALL disabled default tiles (isCustom = false, isEnabled = false) regardless of locale/gameMode
  // For 'disabled' scope, always include. For 'custom' scope, never include. For others, based on includeDisabledDefaults flag
  const allDisabledDefaults = await (async () => {
    if (exportScope === 'disabled') return await getTiles({ isCustom: 0, isEnabled: 0 });
    if (exportScope === 'custom') return [];
    return includeDisabledDefaults ? await getTiles({ isCustom: 0, isEnabled: 0 }) : [];
  })();

  // Get all groups that have exportable content (union of group IDs from all queries)
  const customGroupIds = new Set(customGroups.map((g) => g.id));
  const tilesGroupIds = new Set(allCustomTiles.map((t) => t.group_id).filter(Boolean));
  const disabledGroupIds = new Set(allDisabledDefaults.map((t) => t.group_id).filter(Boolean));

  const allRelevantGroupIds = new Set([...customGroupIds, ...tilesGroupIds, ...disabledGroupIds]);

  // Get all groups (both custom and default) that have exportable content —
  // default groups are needed so disabled-default tiles map to their group.
  const allGroups = await batchFetchAllGroups(undefined, true);
  const relevantGroups = allGroups.filter((g) => allRelevantGroupIds.has(g.id));

  // Deduplicate by name across locale/gameMode variants. When a custom group
  // and a same-named default group both qualify (now that default groups are
  // included for their disabled-default tiles), prefer the custom one so the
  // user's group is never dropped from the export-selection UI.
  const uniqueGroups = relevantGroups.filter((group, index, self) => {
    const preferred =
      self.find((g) => g.name === group.name && !g.isDefault) ??
      self.find((g) => g.name === group.name);
    return preferred !== undefined && self.indexOf(preferred) === index;
  });

  const exportableGroups: ExportableGroupStats[] = [];

  for (const group of uniqueGroups) {
    let customGroupsCount = 0;
    let customTiles = 0;
    let disabledDefaults = 0;

    // Check if group itself is custom (non-default) - only count for non-disabled scopes
    if (exportScope !== 'disabled' && !group.isDefault) {
      customGroupsCount = 1;
    }

    // Count custom tiles in this group - only count for non-disabled scopes
    if (exportScope !== 'disabled') {
      customTiles = allCustomTiles.filter((t) => t.group_id === group.id).length;
    }

    // Count disabled default tiles - only for non-custom scopes
    if (exportScope !== 'custom') {
      disabledDefaults = allDisabledDefaults.filter((t) => t.group_id === group.id).length;
    }

    const total = customGroupsCount + customTiles + disabledDefaults;

    // Only include groups that have exportable content (should always be > 0 due to filtering)
    if (total > 0) {
      exportableGroups.push({
        name: group.name,
        label: group.label || group.name,
        exportCount: {
          customGroups: customGroupsCount,
          customTiles,
          disabledDefaults,
          total,
        },
      });
    }
  }

  // Sort by total count (descending) then by name
  return exportableGroups.sort((a, b) => {
    if (a.exportCount.total !== b.exportCount.total) {
      return b.exportCount.total - a.exportCount.total;
    }
    return a.name.localeCompare(b.name);
  });
}
