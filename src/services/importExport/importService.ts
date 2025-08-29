/**
 * Import service with optimized batch operations and memory management
 * Handles large datasets efficiently with progress tracking
 */

import {
  CleanExportData,
  ImportOptions,
  ImportResult,
  ImportContext,
  ImportProgress,
  ValidationResult,
} from './types';
import {
  buildGroupMappingContext,
  detectTileConflicts,
  batchInsertGroups,
  batchInsertTiles,
  optimizeDatabase,
} from './databaseOperations';
import { validateCustomGroup } from '@/services/validationService';
import { CustomGroupIntensity } from '@/types/customGroups';
import { CustomTileBase } from '@/types/customTiles';

/**
 * Main import function with batch operations and progress tracking
 * Optimized for performance with large datasets
 */
export async function importData(
  jsonData: string,
  targetLocale = 'en',
  targetGameMode = 'online',
  options: ImportOptions = {}
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    importedGroups: 0,
    importedTiles: 0,
    skippedGroups: 0,
    skippedTiles: 0,
    errors: [],
    warnings: [],
  };

  // Set default options
  const importOptions: ImportOptions = {
    mergeStrategy: 'skip',
    batchSize: 100,
    ...options,
    locale: targetLocale,
    gameMode: targetGameMode,
  };

  try {
    // Phase 1: Parse and validate
    reportProgress(importOptions, {
      phase: 'parsing',
      current: 0,
      total: 1,
      message: 'Parsing import data...',
    });

    const parsedData = parseImportData(jsonData, result);
    if (!parsedData) return result;

    // Phase 2: Validate data structure
    reportProgress(importOptions, {
      phase: 'validating',
      current: 0,
      total: 1,
      message: 'Validating data structure...',
    });

    const validation = await validateImportData(parsedData, targetLocale, targetGameMode);
    result.errors.push(...validation.errors);
    result.warnings.push(...validation.warnings);

    if (!validation.isValid) {
      return result;
    }

    // Phase 3: Build import context with group mappings
    const context: ImportContext = {
      locale: targetLocale,
      gameMode: targetGameMode,
      groupMappings: await buildGroupMappingContext(targetLocale, targetGameMode),
      existingTileActions: new Set(),
      options: importOptions,
      stats: {
        groupsProcessed: 0,
        tilesProcessed: 0,
        errors: 0,
        warnings: 0,
      },
    };

    // Phase 4: Import groups
    await importGroups(parsedData, context, result);

    // Phase 5: Rebuild context after group imports
    context.groupMappings = await buildGroupMappingContext(targetLocale, targetGameMode);

    // Phase 6: Import tiles with batching
    await importTiles(parsedData, context, result);

    // Phase 7: Optimize database after large import
    if (result.importedTiles > 1000) {
      await optimizeDatabase();
    }

    result.success = result.errors.length === 0;

    reportProgress(importOptions, {
      phase: 'complete',
      current: 1,
      total: 1,
      message: `Import complete: ${result.importedGroups} groups, ${result.importedTiles} tiles`,
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result.errors.push(`Import failed: ${message}`);
    return result;
  }
}

/**
 * Parse import data with error handling
 */
function parseImportData(jsonData: string, result: ImportResult): CleanExportData | null {
  try {
    const parsed = JSON.parse(jsonData);

    // Validate required fields
    if (!parsed.version) {
      result.errors.push('Missing version information');
      return null;
    }

    if (!parsed.groups || !parsed.customTiles) {
      result.errors.push('Invalid export format: missing groups or customTiles');
      return null;
    }

    return parsed as CleanExportData;
  } catch {
    result.errors.push('Invalid JSON format');
    return null;
  }
}

/**
 * Validate import data structure and detect conflicts
 */
async function validateImportData(
  data: CleanExportData,
  _locale: string,
  _gameMode: string
): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    conflicts: [],
  };

  // Validate groups structure
  for (const [groupName, groupData] of Object.entries(data.groups)) {
    if (!groupData.label || !groupData.intensities || !Array.isArray(groupData.intensities)) {
      result.errors.push(`Invalid group structure: ${groupName}`);
      result.isValid = false;
    }
  }

  // Validate tiles structure
  for (const [groupName, intensityData] of Object.entries(data.customTiles)) {
    if (!data.groups[groupName]) {
      result.warnings.push(`Tiles reference unknown group: ${groupName}`);
    }

    for (const [intensityStr, tiles] of Object.entries(intensityData)) {
      const intensity = parseInt(intensityStr, 10);
      if (isNaN(intensity)) {
        result.errors.push(`Invalid intensity value in group ${groupName}: ${intensityStr}`);
        result.isValid = false;
      }

      if (!Array.isArray(tiles)) {
        result.errors.push(`Invalid tiles array in group ${groupName}, intensity ${intensity}`);
        result.isValid = false;
      }
    }
  }

  return result;
}

/**
 * Import groups with batch operations
 */
async function importGroups(
  data: CleanExportData,
  context: ImportContext,
  result: ImportResult
): Promise<void> {
  const groupsToImport = [];
  const totalGroups = Object.keys(data.groups).length;
  let currentGroup = 0;

  for (const [groupName, groupData] of Object.entries(data.groups)) {
    currentGroup++;

    reportProgress(context.options, {
      phase: 'groups',
      current: currentGroup,
      total: totalGroups,
      message: `Processing group ${groupName}`,
    });

    const existingGroup = context.groupMappings.get(groupName);

    // Skip default groups
    if (existingGroup?.isDefault) {
      result.warnings.push(`Skipped default group: ${groupName}`);
      result.skippedGroups++;
      continue;
    }

    // Handle existing custom groups based on merge strategy
    if (existingGroup && context.options.mergeStrategy === 'skip') {
      result.warnings.push(`Skipped existing group: ${groupName}`);
      result.skippedGroups++;
      continue;
    }

    // Convert intensities for the group
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
      locale: context.locale,
      gameMode: context.gameMode,
    };

    // Validate group
    const validation = await validateCustomGroup(newGroup, existingGroup?.groupId);
    if (!validation.isValid) {
      result.errors.push(`Group ${groupName}: ${validation.errors.join(', ')}`);
      continue;
    }

    groupsToImport.push(newGroup);
  }

  // Batch insert groups
  if (groupsToImport.length > 0) {
    const insertResult = await batchInsertGroups(groupsToImport);
    result.importedGroups += insertResult.inserted;

    for (const failedGroup of insertResult.failed) {
      result.errors.push(`Failed to import group: ${failedGroup}`);
    }
  }
}

/**
 * Import tiles with batch operations and conflict detection
 */
async function importTiles(
  data: CleanExportData,
  context: ImportContext,
  result: ImportResult
): Promise<void> {
  const tilesToImport: CustomTileBase[] = [];
  let totalTiles = 0;

  // Count total tiles for progress tracking
  for (const intensityData of Object.values(data.customTiles)) {
    for (const tiles of Object.values(intensityData)) {
      totalTiles += tiles.length;
    }
  }

  let currentTile = 0;

  for (const [groupName, intensityData] of Object.entries(data.customTiles)) {
    const groupMapping = context.groupMappings.get(groupName);

    if (!groupMapping) {
      result.warnings.push(`Skipped tiles for missing group: ${groupName}`);
      continue;
    }

    // Prepare tiles for conflict detection
    const groupTiles: Array<{ action: string; intensity: number }> = [];

    for (const [intensityStr, tiles] of Object.entries(intensityData)) {
      const intensity = parseInt(intensityStr, 10);

      for (const tileData of tiles) {
        const action = typeof tileData === 'string' ? tileData : tileData.action;
        groupTiles.push({ action, intensity });
      }
    }

    // Detect conflicts for this group
    const conflicts = await detectTileConflicts(groupMapping.groupId, groupTiles);

    // Process tiles for this group
    for (const [intensityStr, tiles] of Object.entries(intensityData)) {
      const intensity = parseInt(intensityStr, 10);

      // Validate intensity exists in group
      if (!groupMapping.intensities.has(intensity)) {
        result.warnings.push(
          `Skipped tiles for invalid intensity ${intensity} in group ${groupName}`
        );
        continue;
      }

      for (const tileData of tiles) {
        currentTile++;

        reportProgress(context.options, {
          phase: 'tiles',
          current: currentTile,
          total: totalTiles,
          message: `Processing tile ${currentTile}/${totalTiles}`,
        });

        const action = typeof tileData === 'string' ? tileData : tileData.action;
        const tags = typeof tileData === 'string' ? [] : tileData.tags || [];

        // Check for conflicts
        const tileId = `${intensity}:${action}`;
        if (conflicts.has(tileId)) {
          if (context.options.mergeStrategy === 'skip') {
            result.skippedTiles++;
            continue;
          } else if (context.options.mergeStrategy === 'rename') {
            // Add suffix to make unique
            const newAction = `${action} (imported)`;
            tilesToImport.push({
              group_id: groupMapping.groupId,
              intensity,
              action: newAction,
              tags,
              isEnabled: 1,
              isCustom: 1,
            });
          }
          // 'overwrite' would require deletion first, not implemented here
        } else {
          tilesToImport.push({
            group_id: groupMapping.groupId,
            intensity,
            action,
            tags,
            isEnabled: 1,
            isCustom: 1,
          });
        }
      }
    }
  }

  // Batch insert tiles
  if (tilesToImport.length > 0) {
    const insertResult = await batchInsertTiles(tilesToImport, context.options.batchSize || 100);
    result.importedTiles += insertResult.inserted;
    result.skippedTiles += insertResult.failed;

    if (insertResult.failed > 0) {
      result.warnings.push(`Failed to import ${insertResult.failed} tiles`);
    }
  }
}

/**
 * Report progress to callback if provided
 */
function reportProgress(options: ImportOptions, progress: ImportProgress): void {
  if (options.progressCallback) {
    options.progressCallback(progress);
  }

  // Also log for debugging
  console.info(`Import ${progress.phase}: ${progress.message}`);
}
