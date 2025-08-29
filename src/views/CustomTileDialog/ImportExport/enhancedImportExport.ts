import { CustomGroupIntensity, CustomGroupPull } from '@/types/customGroups';
import {
  getCustomGroups,
  addCustomGroup,
  getCustomGroupByName,
  updateCustomGroup,
} from '@/stores/customGroups';
import { getTiles, addCustomTile } from '@/stores/customTiles';
import { validateCustomGroup } from '@/services/validationService';

/**
 * Clean import/export functionality with normalized group-based format
 */

// Version identifier for export format
const EXPORT_FORMAT_VERSION = '3.0.0';

// Constants for better maintainability
const JSON_INDENT_SPACES = 2;

// Custom tile with optional tags
export interface CleanCustomTile {
  action: string;
  tags?: string[];
}

// Clean export data structure
export interface CleanExportData {
  version: string;
  locale: string;
  gameMode: string;
  groups: {
    [groupName: string]: {
      label: string;
      type: string;
      intensities: string[];
    };
  };
  customTiles: {
    [groupName: string]: {
      [intensityValue: number]: (string | CleanCustomTile)[];
    };
  };
}

export interface ImportResult {
  success: boolean;
  importedGroups: number;
  importedTiles: number;
  errors: string[];
  warnings: string[];
}

/**
 * Export custom groups and tiles in clean v3.0 format (normalized group-based)
 * @param locale - Target locale for export ('en', 'es', 'fr')
 * @param gameMode - Target game mode for export ('online', 'offline')
 * @param options - Export configuration options
 * @param options.singleGroup - Name of specific group to export (only for 'single' scope)
 * @param options.exportScope - Scope of export: 'all' (everything), 'single' (one group), 'default' (custom tiles from default groups)
 * @returns Promise<string> - JSON string of exported data
 * @throws Error if export fails or validation errors occur
 */
export async function exportCleanData(
  locale = 'en',
  gameMode = 'online',
  options: {
    singleGroup?: string;
    exportScope?: 'all' | 'single' | 'default';
  } = {}
): Promise<string> {
  try {
    // Get custom groups based on scope
    let customGroups: CustomGroupPull[];

    if (options.exportScope === 'single' && options.singleGroup) {
      // Get only the single selected group
      const group = await getCustomGroupByName(options.singleGroup, locale, gameMode);
      customGroups = group && !group.isDefault ? [group] : [];
    } else if (options.exportScope === 'default') {
      // Only export default groups (no custom groups, but their tiles)
      customGroups = [];
    } else {
      // Get all custom groups for this locale/gameMode (exclude defaults)
      const allGroups = await getCustomGroups({ locale, gameMode });
      customGroups = allGroups.filter((group) => !group.isDefault);
    }

    // Get all groups to determine which are default vs custom
    const allGroupsForLocale = await getCustomGroups({ locale, gameMode });

    // Get ALL custom tiles that belong to groups in this locale/gameMode
    const allGroupIds = allGroupsForLocale.map((group) => group.id);
    const allCustomTiles = await getTiles({ isCustom: 1 });
    const relevantTiles = allCustomTiles.filter((tile) => {
      // Filter by group_id to ensure tiles belong to this locale/gameMode
      if (!tile.group_id || !allGroupIds.includes(tile.group_id)) {
        return false;
      }

      // If exporting single group, only include tiles from that group
      if (options.exportScope === 'single' && options.singleGroup) {
        const tileGroup = allGroupsForLocale.find((g) => g.id === tile.group_id);
        return tileGroup && tileGroup.name === options.singleGroup;
      }

      return true;
    });

    // Build the clean export format
    const exportData: CleanExportData = {
      version: EXPORT_FORMAT_VERSION,
      locale,
      gameMode,
      groups: {},
      customTiles: {},
    };

    // Add groups to export
    const groupsToExport =
      options.exportScope === 'default'
        ? allGroupsForLocale.filter((group) => group.isDefault)
        : [...customGroups, ...allGroupsForLocale.filter((group) => group.isDefault)];

    groupsToExport.forEach((group) => {
      exportData.groups[group.name] = {
        label: group.label,
        type: group.type || 'solo',
        intensities: group.intensities
          .sort((a, b) => a.value - b.value)
          .map((intensity) => intensity.label),
      };
    });

    // Add custom tiles organized by group name and intensity
    for (const tile of relevantTiles) {
      const tileGroup = allGroupsForLocale.find((g) => g.id === tile.group_id);
      if (!tileGroup) continue;

      const groupName = tileGroup.name;

      // Initialize group in customTiles if it doesn't exist
      if (!exportData.customTiles[groupName]) {
        exportData.customTiles[groupName] = {};
      }

      // Initialize intensity array if it doesn't exist
      if (!exportData.customTiles[groupName][tile.intensity]) {
        exportData.customTiles[groupName][tile.intensity] = [];
      }

      // Add tile (as string if no tags, as object if tags exist)
      if (!tile.tags || tile.tags.length === 0) {
        exportData.customTiles[groupName][tile.intensity].push(tile.action);
      } else {
        exportData.customTiles[groupName][tile.intensity].push({
          action: tile.action,
          tags: tile.tags,
        });
      }
    }

    // Remove groups with no custom tiles unless we're exporting custom groups themselves
    if (options.exportScope !== 'all') {
      Object.keys(exportData.customTiles).forEach((groupName) => {
        const hasAnyTiles = Object.values(exportData.customTiles[groupName]).some(
          (tiles) => tiles.length > 0
        );
        if (!hasAnyTiles) {
          delete exportData.customTiles[groupName];
          // Only keep the group definition if it's a custom group being exported
          if (!customGroups.some((group) => group.name === groupName)) {
            delete exportData.groups[groupName];
          }
        }
      });
    }

    return JSON.stringify(exportData, null, JSON_INDENT_SPACES);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Export failed: ${message}`);
  }
}

/**
 * Import custom groups and tiles from clean format
 * @param jsonData - JSON string to import
 * @param targetLocale - Target locale for import ('en', 'es', 'fr')
 * @param targetGameMode - Target game mode for import ('online', 'offline')
 * @returns Promise<ImportResult> - Result of import operation
 */
export async function importCleanData(
  jsonData: string,
  targetLocale = 'en',
  targetGameMode = 'online'
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    importedGroups: 0,
    importedTiles: 0,
    errors: [],
    warnings: [],
  };

  try {
    // Parse JSON data
    let parsedData: CleanExportData;
    try {
      parsedData = JSON.parse(jsonData);
    } catch {
      result.errors.push('Invalid JSON format');
      return result;
    }

    // Validate export format
    if (!parsedData.version) {
      result.errors.push('Missing version information');
      return result;
    }

    if (!parsedData.groups || !parsedData.customTiles) {
      result.errors.push('Invalid export format: missing groups or customTiles');
      return result;
    }

    // Get existing groups for the target locale/gameMode
    const existingGroups = await getCustomGroups({
      locale: targetLocale,
      gameMode: targetGameMode,
    });
    const existingGroupMap = new Map(existingGroups.map((group) => [group.name, group]));

    // Import groups first
    for (const [groupName, groupData] of Object.entries(parsedData.groups)) {
      try {
        const existingGroup = existingGroupMap.get(groupName);

        if (existingGroup && existingGroup.isDefault) {
          result.warnings.push(`Skipped default group: ${groupName}`);
          continue;
        }

        // Convert intensity labels to proper intensity objects
        const intensities: CustomGroupIntensity[] = groupData.intensities.map((label, index) => ({
          id: `${index + 1}`,
          label,
          value: index + 1,
          isDefault: true,
        }));

        const newGroup = {
          name: groupName,
          label: groupData.label,
          intensities,
          type: (groupData.type || 'solo') as 'solo' | 'foreplay' | 'sex' | 'consumption',
          isDefault: false,
          locale: targetLocale,
          gameMode: targetGameMode,
        };

        // Validate group
        const validation = await validateCustomGroup(newGroup, existingGroup?.id);
        if (!validation.isValid) {
          result.errors.push(`Group ${groupName}: ${validation.errors.join(', ')}`);
          continue;
        }

        // Add or update group
        if (existingGroup) {
          await updateCustomGroup(existingGroup.id, newGroup);
          result.warnings.push(`Updated existing group: ${groupName}`);
        } else {
          await addCustomGroup(newGroup);
          result.importedGroups++;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        result.errors.push(`Failed to import group ${groupName}: ${message}`);
      }
    }

    // Import tiles
    const updatedGroups = await getCustomGroups({ locale: targetLocale, gameMode: targetGameMode });
    const updatedGroupMap = new Map(updatedGroups.map((group) => [group.name, group]));

    for (const [groupName, intensityData] of Object.entries(parsedData.customTiles)) {
      const targetGroup = updatedGroupMap.get(groupName);
      if (!targetGroup) {
        result.warnings.push(`Skipped tiles for missing group: ${groupName}`);
        continue;
      }

      // Check existing tiles for this group
      const existingTiles = await getTiles({ group_id: targetGroup.id });
      const existingTileActions = new Set(existingTiles.map((tile) => tile.action));

      for (const [intensityStr, tiles] of Object.entries(intensityData)) {
        const intensity = parseInt(intensityStr, 10);

        // Validate intensity exists in group
        const hasIntensity = targetGroup.intensities.some((i) => i.value === intensity);
        if (!hasIntensity) {
          result.warnings.push(
            `Skipped tiles for invalid intensity ${intensity} in group ${groupName}`
          );
          continue;
        }

        for (const tileData of tiles) {
          try {
            const action = typeof tileData === 'string' ? tileData : tileData.action;
            const tags = typeof tileData === 'string' ? [] : tileData.tags || [];

            // Skip if tile already exists
            if (existingTileActions.has(action)) {
              result.warnings.push(`Skipped duplicate tile: ${action}`);
              continue;
            }

            const newTile = {
              group_id: targetGroup.id,
              intensity,
              action,
              tags,
              isEnabled: 1,
              isCustom: 1,
            };

            await addCustomTile(newTile);
            result.importedTiles++;
            existingTileActions.add(action);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            result.errors.push(`Failed to import tile: ${message}`);
          }
        }
      }
    }

    result.success = result.errors.length === 0;
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result.errors.push(`Import failed: ${message}`);
    return result;
  }
}

/**
 * Export a specific group's data
 * @param groupName - Name of the group to export
 * @param locale - Target locale for export
 * @returns Promise<string> - JSON string of exported data
 */
export async function exportGroupData(groupName: string, locale = 'en'): Promise<string> {
  // Get the group to determine its gameMode
  const group = await getCustomGroupByName(groupName, locale);
  if (!group) {
    throw new Error(`Group "${groupName}" not found`);
  }

  return exportCleanData(locale, group.gameMode || 'online', {
    exportScope: 'single',
    singleGroup: groupName,
  });
}

/**
 * Get available groups for export dropdown
 * @param locale - Target locale
 * @returns Promise<Array> - List of groups with tile counts
 */
export async function getAvailableGroupsForExport(
  locale = 'en'
): Promise<{ name: string; label: string; tileCount: number }[]> {
  const allGroups = await getCustomGroups({ locale });
  const customGroups = allGroups.filter((group) => !group.isDefault);

  // Get tile counts for each group
  const groupsWithCounts = await Promise.all(
    customGroups.map(async (group) => {
      const tiles = await getTiles({ group_id: group.id });
      return {
        name: group.name,
        label: group.label || group.name,
        tileCount: tiles.length,
      };
    })
  );

  return groupsWithCounts;
}

/**
 * Auto-detect format and import data
 * @param importData - Raw import data string
 * @param mappedGroups - Legacy mapped groups (unused in new format)
 * @param options - Import options
 * @returns Promise<ImportResult> - Result of import operation
 */
export async function autoImportData(
  importData: string,
  _mappedGroups: any,
  options: {
    locale?: string;
    mergeStrategy?: 'skip' | 'overwrite' | 'rename';
  } = {}
): Promise<ImportResult> {
  const { locale = 'en' } = options;

  try {
    // Try to parse as JSON (clean format)
    const parsedData = JSON.parse(importData);
    if (parsedData.version && parsedData.groups && parsedData.customTiles) {
      // Clean format detected
      return await importCleanData(importData, locale);
    }
  } catch {
    // Not JSON, might be legacy format
  }

  // For now, assume it's clean format and let importCleanData handle the error
  return await importCleanData(importData, locale);
}
