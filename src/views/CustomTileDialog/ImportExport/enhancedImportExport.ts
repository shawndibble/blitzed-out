import { CustomTile } from '@/types/customTiles';
import { CustomGroup } from '@/types/customGroups';
import { getCustomGroups, addCustomGroup, getCustomGroupByName } from '@/stores/customGroups';
import { validateCustomGroup } from '@/services/validationService';

/**
 * Enhanced import/export functionality that supports both custom groups and tiles
 */

// Version identifier for export format
const EXPORT_FORMAT_VERSION = '2.0.0';

export interface EnhancedExportData {
  version: string;
  exportedAt: string;
  locale: string;
  gameMode: string;
  customGroups: CustomGroup[];
  customTiles: CustomTile[];
}

export interface ImportResult {
  success: boolean;
  importedGroups: number;
  importedTiles: number;
  errors: string[];
  warnings: string[];
}

/**
 * Export custom groups and tiles in the new enhanced format
 */
export async function exportEnhancedData(locale = 'en', gameMode = 'online'): Promise<string> {
  try {
    // Get all custom groups for this locale/gameMode
    const customGroups = await getCustomGroups({ locale, gameMode });

    // Get all custom tiles (we'll export all since they can be filtered on import)
    const customTiles = await import('@/stores/customTiles').then((module) =>
      module.getTiles({ isCustom: 1 })
    );

    const exportData: EnhancedExportData = {
      version: EXPORT_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      locale,
      gameMode,
      customGroups,
      customTiles,
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting enhanced data:', error);
    throw new Error(`Export failed: ${error}`);
  }
}

/**
 * Import custom groups and tiles from enhanced format
 */
export async function importEnhancedData(
  importDataString: string,
  options: {
    locale?: string;
    gameMode?: string;
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
    let importData: EnhancedExportData;
    try {
      importData = JSON.parse(importDataString);
    } catch {
      result.errors.push('Invalid JSON format');
      return result;
    }

    // Validate the format
    if (!importData.version || !importData.customGroups || !importData.customTiles) {
      result.errors.push('Invalid export format');
      return result;
    }

    // Version compatibility check
    if (importData.version !== EXPORT_FORMAT_VERSION) {
      result.warnings.push(
        `Format version mismatch: expected ${EXPORT_FORMAT_VERSION}, got ${importData.version}`
      );
    }

    const targetLocale = options.locale || importData.locale || 'en';
    const targetGameMode = options.gameMode || importData.gameMode || 'online';
    const mergeStrategy = options.mergeStrategy || 'skip';

    // Import custom groups first
    for (const group of importData.customGroups) {
      try {
        // Check if group already exists
        const existingGroup = await getCustomGroupByName(group.name, targetLocale, targetGameMode);

        if (existingGroup) {
          switch (mergeStrategy) {
            case 'skip':
              result.warnings.push(`Skipped existing group: ${group.name}`);
              continue;
            case 'overwrite':
              // Update existing group
              await import('@/stores/customGroups').then((module) =>
                module.updateCustomGroup(existingGroup.id, {
                  ...group,
                  locale: targetLocale,
                  gameMode: targetGameMode,
                })
              );
              result.warnings.push(`Updated existing group: ${group.name}`);
              break;
            case 'rename': {
              // Create with a new name
              let newName = `${group.name}_imported`;
              let counter = 1;
              while (await getCustomGroupByName(newName, targetLocale, targetGameMode)) {
                newName = `${group.name}_imported_${counter}`;
                counter++;
              }
              group.name = newName;
              result.warnings.push(`Renamed group from ${group.name} to ${newName}`);
              break;
            }
          }
        }

        // Validate the group before importing
        const validation = await validateCustomGroup({
          ...group,
          locale: targetLocale,
          gameMode: targetGameMode,
        });

        if (!validation.isValid) {
          result.errors.push(`Invalid group ${group.name}: ${validation.errors.join(', ')}`);
          continue;
        }

        // Import the group
        const groupId = await addCustomGroup({
          ...group,
          locale: targetLocale,
          gameMode: targetGameMode,
        });

        if (groupId) {
          result.importedGroups++;
        }
      } catch (error) {
        result.errors.push(`Error importing group ${group.name}: ${error}`);
      }
    }

    // Import custom tiles
    const { addCustomTile, getTiles } = await import('@/stores/customTiles');
    const existingTiles = await getTiles();

    for (const tile of importData.customTiles) {
      try {
        // Check if tile already exists
        const existingTile = existingTiles.find(
          (existing) =>
            existing.group === tile.group &&
            existing.intensity === tile.intensity &&
            existing.action === tile.action &&
            existing.gameMode === tile.gameMode
        );

        if (existingTile && mergeStrategy === 'skip') {
          result.warnings.push(`Skipped existing tile: ${tile.action}`);
          continue;
        }

        // Validate that the referenced group exists
        const referencedGroup = await getCustomGroupByName(
          tile.group,
          targetLocale,
          targetGameMode
        );
        if (!referencedGroup) {
          result.errors.push(`Tile references non-existent group: ${tile.group}`);
          continue;
        }

        // Validate that the intensity exists in the group
        const validIntensities = referencedGroup.intensities.map((i) => i.value);
        if (!validIntensities.includes(tile.intensity)) {
          result.errors.push(`Tile intensity ${tile.intensity} not valid for group ${tile.group}`);
          continue;
        }

        // Import the tile
        await addCustomTile({
          ...tile,
          gameMode: targetGameMode,
        });

        result.importedTiles++;
      } catch (error) {
        result.errors.push(`Error importing tile: ${error}`);
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
    const { getTiles, addCustomTile } = await import('@/stores/customTiles');

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
          const { updateCustomTile } = await import('@/stores/customTiles');
          await updateCustomTile(tile.id, tile);
        }
      } catch (error) {
        result.errors.push(`Error updating tile: ${error}`);
      }
    }

    result.success = result.errors.length === 0;
    result.warnings.push(
      'Imported using legacy format. Consider exporting in new format for better compatibility.'
    );

    return result;
  } catch (error) {
    result.errors.push(`Legacy import failed: ${error}`);
    return result;
  }
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

  // Try to parse as JSON (enhanced format)
  try {
    const parsedData = JSON.parse(trimmedData);
    if (parsedData.version && parsedData.customGroups !== undefined) {
      return importEnhancedData(trimmedData, options);
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
    const data: EnhancedExportData = JSON.parse(exportDataString);

    const groupCount = data.customGroups.length;
    const tileCount = data.customTiles.length;
    const exportDate = new Date(data.exportedAt).toLocaleDateString();

    let summary = `Export Summary:\n`;
    summary += `• Format Version: ${data.version}\n`;
    summary += `• Exported: ${exportDate}\n`;
    summary += `• Locale: ${data.locale}\n`;
    summary += `• Game Mode: ${data.gameMode}\n`;
    summary += `• Custom Groups: ${groupCount}\n`;
    summary += `• Custom Tiles: ${tileCount}\n`;

    if (groupCount > 0) {
      summary += `\nCustom Groups:\n`;
      data.customGroups.forEach((group) => {
        summary += `• ${group.label} (${group.intensities.length} intensity levels)\n`;
      });
    }

    return summary;
  } catch {
    return 'Unable to parse export data';
  }
}
