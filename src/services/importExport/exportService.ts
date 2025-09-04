/**
 * Export service with optimized performance for large datasets
 * Handles streaming, batching, and efficient memory usage
 */

import {
  CleanExportData,
  ExportOptions,
  ExportContext,
  EXPORT_FORMAT_VERSION,
  ExportableGroupStats,
} from './types';
import {
  batchFetchGroups,
  batchFetchAllGroups,
  streamTilesForExport,
  getTileStatistics,
} from './databaseOperations';
import { getTiles } from '@/stores/customTiles';

const JSON_INDENT_SPACES = 2;

/**
 * Main export function with optimized data fetching
 * Streams data to prevent memory issues with large datasets
 */
export async function exportData(
  locale = 'en',
  gameMode = 'online',
  options: ExportOptions = {}
): Promise<string> {
  const context: ExportContext = {
    locale,
    gameMode,
    options,
    groupIds: new Set(),
    stats: {
      groupsExported: 0,
      tilesExported: 0,
    },
  };

  try {
    // Initialize export data structure
    const exportData: CleanExportData = {
      version: EXPORT_FORMAT_VERSION,
      locale,
      gameMode,
      groups: {},
      customTiles: {},
    };

    // Fetch and process groups
    const groups = await fetchGroupsForExport(context);

    // Process groups and build export structure
    for (const group of groups) {
      // Add group to export
      exportData.groups[group.name] = {
        label: group.label,
        type: group.type || 'solo',
        intensities: group.intensities
          .sort((a, b) => a.value - b.value)
          .map((intensity) => intensity.label),
      };

      // Track group ID for tile fetching
      context.groupIds.add(group.id);
      context.stats.groupsExported++;

      // Initialize tile structure for this group
      exportData.customTiles[group.name] = {};
    }

    // Stream and process tiles efficiently
    await processTilesForExport(exportData, context, groups);

    // Clean up empty groups if needed
    if (options.exportScope !== 'all') {
      cleanupEmptyGroups(exportData);
    }

    // Log statistics for debugging
    console.info(
      `Export completed: ${context.stats.groupsExported} groups, ${context.stats.tilesExported} tiles`
    );

    return JSON.stringify(exportData, null, JSON_INDENT_SPACES);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Export failed: ${message}`);
  }
}

/**
 * Fetch groups based on export options
 * Optimized to only fetch what's needed
 */
async function fetchGroupsForExport(context: ExportContext) {
  const { options } = context;

  if (options.exportScope === 'single' && options.singleGroup) {
    // Fetch only the specific group (from all custom groups)
    const groups = await batchFetchAllGroups([options.singleGroup]);
    return groups.filter((g) => !g.isDefault || options.exportScope === 'default');
  } else if (options.exportScope === 'default') {
    // For default groups, we still need to filter by locale/gameMode (but this is rarely used for custom exports)
    const { locale, gameMode } = context;
    const allGroups = await batchFetchGroups(locale, gameMode);
    return allGroups.filter((g) => g.isDefault);
  } else {
    // Fetch ALL custom groups regardless of locale/gameMode
    const allGroups = await batchFetchAllGroups();
    return options.exportScope === 'all' ? allGroups : allGroups.filter((g) => !g.isDefault);
  }
}

/**
 * Process tiles using streaming for memory efficiency
 * Handles large datasets without loading everything into memory
 */
async function processTilesForExport(
  exportData: CleanExportData,
  context: ExportContext,
  groups: any[]
) {
  const groupMap = new Map(groups.map((g) => [g.id, g]));
  const groupIds = Array.from(context.groupIds);

  // Get statistics first for progress tracking
  const stats = await getTileStatistics(groupIds);
  console.info(`Processing ${stats.total} tiles across ${groupIds.length} groups`);

  // Stream tiles in batches
  const tileStream = streamTilesForExport(groupIds, 100);

  for await (const tileBatch of tileStream) {
    for (const tile of tileBatch) {
      const group = groupMap.get(tile.group_id);
      if (!group) continue;

      const groupName = group.name;

      // Initialize intensity array if needed
      if (!exportData.customTiles[groupName][tile.intensity]) {
        exportData.customTiles[groupName][tile.intensity] = [];
      }

      // Add tile (optimized format)
      const tileData =
        tile.tags && tile.tags.length > 0 ? { action: tile.action, tags: tile.tags } : tile.action;

      exportData.customTiles[groupName][tile.intensity].push(tileData);
      context.stats.tilesExported++;
    }
  }
}

/**
 * Remove empty groups from export data
 * Cleans up groups with no custom tiles
 */
function cleanupEmptyGroups(exportData: CleanExportData): void {
  const groupsToRemove: string[] = [];

  for (const [groupName, intensityData] of Object.entries(exportData.customTiles)) {
    const hasAnyTiles = Object.values(intensityData).some((tiles) => tiles.length > 0);

    if (!hasAnyTiles) {
      groupsToRemove.push(groupName);
    }
  }

  // Remove empty groups
  for (const groupName of groupsToRemove) {
    delete exportData.customTiles[groupName];
    // Only remove group definition if it has no tiles and isn't being explicitly exported
    if (!exportData.groups[groupName] || Object.keys(exportData.groups[groupName]).length === 0) {
      delete exportData.groups[groupName];
    }
  }
}

/**
 * Export a specific group's data
 * Optimized version of single group export
 */
export async function exportGroupData(
  groupName: string,
  locale = 'en',
  gameMode = 'online'
): Promise<string> {
  return exportData(locale, gameMode, {
    exportScope: 'single',
    singleGroup: groupName,
  });
}

/**
 * Get exportable groups with accurate counts for each export category
 * Gets ALL user custom groups regardless of locale/gameMode for export
 * Uses the same 3-query approach as exportAllData for consistency
 */
export async function getExportableGroupStats(
  includeDisabledDefaults = false,
  exportScope: 'all' | 'custom' | 'single' | 'disabled' = 'all'
): Promise<ExportableGroupStats[]> {
  // Use the same 3-query approach as exportAllData, but filter based on export scope

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

  // Get all groups (both custom and default) that have exportable content
  const allGroups = await batchFetchAllGroups();
  const relevantGroups = allGroups.filter((g) => allRelevantGroupIds.has(g.id));

  // Deduplicate groups by name, keeping the first occurrence
  const uniqueGroups = relevantGroups.filter(
    (group, index, self) => self.findIndex((g) => g.name === group.name) === index
  );

  const exportableGroups: ExportableGroupStats[] = [];

  for (const group of uniqueGroups) {
    let customGroups = 0;
    let customTiles = 0;
    let disabledDefaults = 0;

    // Check if group itself is custom (non-default) - only count for non-disabled scopes
    if (exportScope !== 'disabled' && !group.isDefault) {
      customGroups = 1;
    }

    // Count custom tiles in this group - only count for non-disabled scopes
    if (exportScope !== 'disabled') {
      customTiles = allCustomTiles.filter((t) => t.group_id === group.id).length;
    }

    // Count disabled default tiles - only for non-custom scopes
    if (exportScope !== 'custom') {
      disabledDefaults = allDisabledDefaults.filter((t) => t.group_id === group.id).length;
    }

    const total = customGroups + customTiles + disabledDefaults;

    // Only include groups that have exportable content (should always be > 0 due to filtering)
    if (total > 0) {
      exportableGroups.push({
        name: group.name,
        label: group.label || group.name,
        exportCount: {
          customGroups,
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

/**
 * Get available groups for export with tile counts
 * Uses efficient counting without loading all tiles
 */
export async function getAvailableGroupsForExport(
  locale = 'en',
  gameMode = 'online'
): Promise<{ name: string; label: string; tileCount: number }[]> {
  const groups = await batchFetchGroups(locale, gameMode);
  const customGroups = groups.filter((g) => !g.isDefault);

  // Get tile counts efficiently
  const groupIds = customGroups.map((g) => g.id);
  const stats = await getTileStatistics(groupIds);

  return customGroups.map((group) => ({
    name: group.name,
    label: group.label || group.name,
    tileCount: stats.byGroup.get(group.id) || 0,
  }));
}
