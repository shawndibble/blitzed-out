/**
 * Export service with optimized performance for large datasets
 * Handles streaming, batching, and efficient memory usage
 */

import { CleanExportData, ExportOptions, ExportContext, EXPORT_FORMAT_VERSION } from './types';
import { batchFetchGroups, streamTilesForExport, getTileStatistics } from './databaseOperations';

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
  const { locale, gameMode, options } = context;

  if (options.exportScope === 'single' && options.singleGroup) {
    // Fetch only the specific group
    const groups = await batchFetchGroups(locale, gameMode, [options.singleGroup]);
    return groups.filter((g) => !g.isDefault || options.exportScope === 'default');
  } else if (options.exportScope === 'default') {
    // Fetch only default groups
    const allGroups = await batchFetchGroups(locale, gameMode);
    return allGroups.filter((g) => g.isDefault);
  } else {
    // Fetch all groups for this locale/gameMode
    const allGroups = await batchFetchGroups(locale, gameMode);
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
