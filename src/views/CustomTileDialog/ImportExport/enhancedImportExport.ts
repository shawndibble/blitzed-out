import { CustomGroupIntensity, CustomGroupPull } from '@/types/customGroups';
import {
  getCustomGroups,
  addCustomGroup,
  getCustomGroupByName,
  updateCustomGroup,
} from '@/stores/customGroups';
import { getTiles, addCustomTile, updateCustomTile } from '@/stores/customTiles';
import { validateCustomGroup } from '@/services/validationService';

/**
 * Clean import/export functionality with locale-inspired format
 */

// Version identifier for export format
const EXPORT_FORMAT_VERSION = '2.0.0';

// Constants for better maintainability
const JSON_INDENT_SPACES = 2;
const NONE_INTENSITY_VALUE = 0;

// Custom tile with optional tags
export interface CleanCustomTile {
  action: string;
  tags?: string[];
}

// Clean export data structure
export interface CleanExportData {
  version: string;
  locale: string;
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
 * Export custom groups and tiles in clean v2.0 format (locale-inspired)
 * @param locale - Target locale for export ('en', 'es', 'fr')
 * @param options - Export configuration options
 * @param options.singleGroup - Name of specific group to export (only for 'single' scope)
 * @param options.exportScope - Scope of export: 'all' (everything), 'single' (one group), 'default' (custom tiles from default groups)
 * @returns Promise<string> - JSON string of exported data
 * @throws Error if export fails or validation errors occur
 */
export async function exportCleanData(
  locale = 'en',
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
      const group = await getCustomGroupByName(options.singleGroup, locale);
      customGroups = group && !group.isDefault ? [group] : [];
    } else if (options.exportScope === 'default') {
      // Only export default groups (no custom groups, but their tiles)
      customGroups = [];
    } else {
      // Get all custom groups for this locale (exclude defaults)
      const allGroups = await getCustomGroups({ locale });
      customGroups = allGroups.filter((group) => !group.isDefault);
    }

    // Get all groups to determine which are default vs custom
    const allGroupsForLocale = await getCustomGroups({ locale });
    const defaultGroupNames = new Set(
      allGroupsForLocale.filter((group) => group.isDefault).map((group) => group.name)
    );

    // Get ALL custom tiles for this locale
    const allCustomTiles = await getTiles({ isCustom: 1 });
    const relevantTiles = allCustomTiles.filter((tile) => {
      const matchesLocale = !tile.locale || tile.locale === locale;

      // If exporting single group, only include tiles from that group
      if (options.exportScope === 'single' && options.singleGroup) {
        return matchesLocale && tile.group === options.singleGroup;
      }

      // If exporting default scope, only include tiles from default groups
      if (options.exportScope === 'default') {
        // Check if the tile's group is a default group
        return matchesLocale && defaultGroupNames.has(tile.group);
      }

      // Otherwise include all custom tiles for this locale
      return matchesLocale;
    });

    // Build the clean export format
    const groups: CleanExportData['groups'] = {};

    // Export custom groups with their structure
    for (const group of customGroups) {
      // Convert intensities to simple string array starting with "None"
      const intensityLabels = group.intensities
        .sort((a, b) => a.value - b.value)
        .map((intensity) => intensity.label);

      // Ensure "None" is at index 0 (intensity value 0)
      const noneIntensity = group.intensities.find((i) => i.value === NONE_INTENSITY_VALUE);
      const filteredLabels = intensityLabels.filter((label) => label !== noneIntensity?.label);
      const orderedLabels = noneIntensity
        ? [noneIntensity.label, ...filteredLabels]
        : intensityLabels;

      groups[group.name] = {
        label: group.label,
        type: group.type || 'sex',
        intensities: orderedLabels,
      };
    }

    // Export custom tiles grouped by group name and intensity value
    const customTiles: CleanExportData['customTiles'] = {};

    for (const tile of relevantTiles) {
      if (!customTiles[tile.group]) {
        customTiles[tile.group] = {};
      }
      if (!customTiles[tile.group][tile.intensity]) {
        customTiles[tile.group][tile.intensity] = [];
      }

      // Include tags if they exist, otherwise just export as string
      if (tile.tags && tile.tags.length > 0) {
        customTiles[tile.group][tile.intensity].push({
          action: tile.action,
          tags: tile.tags,
        });
      } else {
        customTiles[tile.group][tile.intensity].push(tile.action);
      }
    }

    // Sort groups alphabetically for better readability
    const sortedGroups: CleanExportData['groups'] = {};
    Object.keys(groups)
      .sort()
      .forEach((key) => {
        sortedGroups[key] = groups[key];
      });

    // Sort custom tiles by group name and intensity for better organization
    const sortedCustomTiles: CleanExportData['customTiles'] = {};
    Object.keys(customTiles)
      .sort()
      .forEach((groupName) => {
        sortedCustomTiles[groupName] = {};
        // Sort intensity levels numerically
        Object.keys(customTiles[groupName])
          .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10))
          .forEach((intensity) => {
            sortedCustomTiles[groupName][Number.parseInt(intensity, 10)] =
              customTiles[groupName][Number.parseInt(intensity, 10)];
          });
      });

    const exportData: CleanExportData = {
      version: EXPORT_FORMAT_VERSION,
      locale,
      groups: sortedGroups,
      customTiles: sortedCustomTiles,
    };

    // Use custom JSON formatting for better readability
    return JSON.stringify(
      exportData,
      (_key, value) => {
        // Keep arrays compact for tile actions to save space
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
          return value;
        }
        return value;
      },
      JSON_INDENT_SPACES
    );
  } catch (error) {
    console.error('Error exporting clean data:', error);
    throw new Error(`Export failed: ${error}`);
  }
}

/**
 * Import custom groups and tiles from clean v2.0 format
 * @param importDataString - JSON string containing export data
 * @param options - Import configuration options
 * @param options.locale - Target locale for import
 * @param options.mergeStrategy - How to handle conflicts: 'skip', 'overwrite', or 'rename'
 * @returns Promise<ImportResult> - Result object containing success status, counts, errors, and warnings
 */
export async function importCleanData(
  importDataString: string,
  options: {
    locale?: string;
    mergeStrategy?: 'skip' | 'overwrite' | 'rename';
  } = {}
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    importedGroups: 0,
    importedTiles: 0,
    errors: [],
    warnings: [],
  };

  try {
    // Parse the import data
    let importData: CleanExportData;
    try {
      importData = JSON.parse(importDataString);
    } catch {
      result.errors.push('Invalid JSON format');
      return result;
    }

    // Validate the format
    if (!importData.version || !importData.groups || !importData.customTiles) {
      result.errors.push('Invalid export format - missing version, groups, or customTiles');
      return result;
    }

    // Version compatibility check
    if (importData.version !== EXPORT_FORMAT_VERSION) {
      result.warnings.push(
        `Format version mismatch: expected ${EXPORT_FORMAT_VERSION}, got ${importData.version}`
      );
    }

    const targetLocale = options.locale || importData.locale || 'en';
    const mergeStrategy = options.mergeStrategy || 'skip';

    // Step 1: Import custom groups (if they don't exist)
    for (const [groupName, groupData] of Object.entries(importData.groups)) {
      try {
        // Check if group already exists
        const existingGroup = await getCustomGroupByName(groupName, targetLocale);
        let finalGroupName = groupName;

        if (existingGroup) {
          switch (mergeStrategy) {
            case 'skip':
              result.warnings.push(`Skipped existing group: ${groupName}`);
              continue;
            case 'overwrite':
              // Will update the existing group
              result.warnings.push(`Will update existing group: ${groupName}`);
              break;
            case 'rename': {
              // Create with a new name
              let counter = 1;
              finalGroupName = `${groupName}_imported`;
              while (await getCustomGroupByName(finalGroupName, targetLocale)) {
                finalGroupName = `${groupName}_imported_${counter}`;
                counter++;
              }
              result.warnings.push(`Renamed group from ${groupName} to ${finalGroupName}`);
              break;
            }
          }
        }

        // Convert intensities array back to CustomGroupIntensity objects
        const intensities: CustomGroupIntensity[] = groupData.intensities.map((label, index) => ({
          id: `intensity-${index}`,
          label: label,
          value: index, // Start from 0 for "None"
          isDefault: index === NONE_INTENSITY_VALUE, // Mark "None" as default
        }));

        // Create the group object
        const customGroup = {
          name: finalGroupName,
          label: groupData.label,
          intensities: intensities,
          type: groupData.type as any,
          locale: targetLocale,
          isDefault: false,
        };

        // Validate the group before importing
        const validation = await validateCustomGroup(customGroup);
        if (!validation.isValid) {
          result.errors.push(`Invalid group ${finalGroupName}: ${validation.errors.join(', ')}`);
          continue;
        }

        // Import or update the group
        if (existingGroup && mergeStrategy === 'overwrite') {
          await updateCustomGroup(existingGroup.id, customGroup);
        } else {
          await addCustomGroup(customGroup);
        }

        result.importedGroups++;
      } catch (error) {
        result.errors.push(`Error importing group ${groupName}: ${error}`);
      }
    }

    // Step 2: Import custom tiles from customTiles section
    for (const [groupName, tilesData] of Object.entries(importData.customTiles)) {
      try {
        // Verify the group exists (could be custom or default)
        const group = await getCustomGroupByName(groupName, targetLocale);
        if (!group) {
          result.warnings.push(`Group ${groupName} not found for custom tiles, skipping tiles`);
          continue;
        }

        // Import tiles for each intensity
        for (const [intensityStr, actions] of Object.entries(tilesData)) {
          const intensity = Number.parseInt(intensityStr, 10);

          // Verify intensity is valid for this group
          const validIntensity = group.intensities.find((i) => i.value === intensity);
          if (!validIntensity) {
            result.warnings.push(
              `Intensity ${intensity} not valid for group ${groupName}, skipping tiles`
            );
            continue;
          }

          for (const tileData of actions) {
            try {
              // Parse tile data - can be string or object with action and tags
              let action: string;
              let tags: string[] = [];

              if (typeof tileData === 'string') {
                action = tileData;
              } else if (tileData && typeof tileData === 'object' && 'action' in tileData) {
                action = tileData.action;
                tags = tileData.tags || [];
              } else {
                result.warnings.push(`Invalid tile data format in group ${groupName}, skipping`);
                continue;
              }

              // Check if tile already exists
              const existingTiles = await getTiles();
              const existingTile = existingTiles.find(
                (existing) =>
                  existing.group === groupName &&
                  existing.intensity === intensity &&
                  existing.action === action &&
                  (!existing.locale || existing.locale === targetLocale)
              );

              if (existingTile && mergeStrategy === 'skip') {
                result.warnings.push(`Skipped existing tile: ${action.substring(0, 50)}...`);
                continue;
              }

              // Import the tile
              await addCustomTile({
                group: groupName,
                intensity: intensity,
                action: action,
                tags: tags,
                isCustom: 1,
                locale: targetLocale,
              });

              result.importedTiles++;
            } catch (error) {
              result.errors.push(
                `Error importing tile "${typeof tileData === 'string' ? tileData.substring(0, 30) : 'object'}...": ${error}`
              );
            }
          }
        }
      } catch (error) {
        result.errors.push(`Error importing tiles for group ${groupName}: ${error}`);
      }
    }

    result.success = result.errors.length === 0;
    return result;
  } catch (error) {
    result.errors.push(`Import failed: ${error}`);
    return result;
  }
}

/**
 * Legacy import support - converts old format to new format
 */
export async function importLegacyData(
  legacyDataString: string,
  mappedGroups: any,
  _locale = 'en',
  _gameMode = 'online'
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    importedGroups: 0,
    importedTiles: 0,
    errors: [],
    warnings: [],
  };

  try {
    // Use the existing getUniqueImportRecords for legacy format
    const { default: getUniqueImportRecords } = await import('./getUniqueImportRecords');

    const existingTiles = await getTiles();
    const { newUniqueRecords, changedTagRecords } = getUniqueImportRecords(
      legacyDataString,
      existingTiles,
      mappedGroups
    );

    // Import new tiles
    for (const tile of newUniqueRecords) {
      try {
        await addCustomTile(tile);
        result.importedTiles++;
      } catch (error) {
        result.errors.push(`Error importing tile: ${error}`);
      }
    }

    // Update tiles with changed tags
    for (const tile of changedTagRecords) {
      try {
        if (tile.id) {
          await updateCustomTile(tile.id, tile);
        }
      } catch (error) {
        result.errors.push(`Error updating tile: ${error}`);
      }
    }

    result.success = result.errors.length === 0;
    result.warnings.push(
      'Imported using legacy format. Consider exporting in clean v2.0 format for better compatibility.'
    );

    return result;
  } catch (error) {
    result.errors.push(`Legacy import failed: ${error}`);
    return result;
  }
}

/**
 * Export a single group in clean v2.0 format
 */
export async function exportGroupData(groupName: string, locale = 'en'): Promise<string> {
  return exportCleanData(locale, {
    singleGroup: groupName,
    exportScope: 'single',
  });
}

/**
 * Auto-detect import format and use appropriate import method
 */
export async function autoImportData(
  importDataString: string,
  mappedGroups: any,
  options: {
    locale?: string;
    gameMode?: string;
    mergeStrategy?: 'skip' | 'overwrite' | 'rename';
  } = {}
): Promise<ImportResult> {
  const trimmedData = importDataString.trim();

  // Try to parse as JSON
  try {
    const parsedData = JSON.parse(trimmedData);

    // Check for clean v2.0 format (has groups object)
    if (parsedData.version && parsedData.groups) {
      return importCleanData(trimmedData, options);
    }

    // Check for old enhanced format (has customGroups array) - should not exist after our changes
    if (parsedData.version && parsedData.customGroups !== undefined) {
      return {
        success: false,
        importedGroups: 0,
        importedTiles: 0,
        errors: ['Old enhanced format no longer supported. Please use clean v2.0 format.'],
        warnings: [],
      };
    }
  } catch {
    // Not JSON, probably legacy format
  }

  // Fall back to legacy import
  return importLegacyData(
    trimmedData,
    mappedGroups,
    options.locale || 'en',
    options.gameMode || 'online'
  );
}

/**
 * Generate a human-readable summary of export data
 */
export function generateExportSummary(exportDataString: string): string {
  try {
    const data: CleanExportData = JSON.parse(exportDataString);

    const groupNames = Object.keys(data.groups);
    const groupCount = groupNames.length;

    // Count total tiles across all custom tiles
    let totalTileCount = 0;
    for (const groupTiles of Object.values(data.customTiles)) {
      for (const intensityTiles of Object.values(groupTiles)) {
        totalTileCount += intensityTiles.length;
      }
    }

    let summary = `Export Summary:\n`;
    summary += `• Format Version: ${data.version}\n`;
    summary += `• Locale: ${data.locale}\n`;
    summary += `• Custom Groups: ${groupCount}\n`;
    summary += `• Total Custom Tiles: ${totalTileCount}\n`;

    if (groupCount > 0) {
      summary += `\nCustom Groups:\n`;
      groupNames.forEach((groupName) => {
        const group = data.groups[groupName];
        const groupTiles = data.customTiles[groupName] || {};
        const groupTileCount = Object.values(groupTiles).reduce(
          (sum, tiles) => sum + tiles.length,
          0
        );
        summary += `• ${group.label} (${group.intensities.length} intensities, ${groupTileCount} tiles)\n`;
      });
    }

    return summary;
  } catch {
    return 'Unable to parse export data';
  }
}

/**
 * Get list of available custom groups for export selection
 */
export async function getAvailableGroupsForExport(
  locale = 'en'
): Promise<{ name: string; label: string; tileCount: number }[]> {
  try {
    // Get all custom groups (exclude defaults)
    const customGroups = await getCustomGroups({ locale });
    const nonDefaultGroups = customGroups.filter((group) => !group.isDefault);

    // Get tile counts for each group
    const allCustomTiles = await getTiles({ isCustom: 1 });

    return nonDefaultGroups.map((group) => {
      const groupTiles = allCustomTiles.filter(
        (tile) => tile.group === group.name && (!tile.locale || tile.locale === locale)
      );

      return {
        name: group.name,
        label: group.label,
        tileCount: groupTiles.length,
      };
    });
  } catch (error) {
    console.error('Error getting available groups for export:', error);
    return [];
  }
}
