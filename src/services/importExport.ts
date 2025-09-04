import { getCustomGroups, addCustomGroup, updateCustomGroup } from '@/stores/customGroups';
import { getTiles, addCustomTile, updateCustomTile } from '@/stores/customTiles';
import { createDeterministicGroupId } from './migration/groupIdMigration';
import {
  generateGroupContentHash,
  generateTileContentHash,
  generateDisabledDefaultContentHash,
} from './contentHashing';
import {
  ExportData,
  ExportGroup,
  ExportTile,
  ExportDisabledDefault,
  ExportOptions,
  ImportOptions,
  ImportResult,
  ConflictAnalysis,
} from '@/types/importExport';
import type { CustomGroupPull, CustomGroupBase } from '@/types/customGroups';
import type { CustomTile } from '@/types/customTiles';

const EXPORT_FORMAT_VERSION = '2.0.0';
const BATCH_SIZE = 100;

// Enhanced types for better performance and maintainability
interface ImportContext {
  groupMap: Map<string, CustomGroupPull>; // groupName -> group
  groupIdMap: Map<string, string>; // groupName -> groupId
  existingTileMap: Map<string, CustomTile>; // action+intensity+groupId -> tile
  result: ImportResult;
  importData: ExportData;
  options: ImportOptions;
}

interface ProgressCallback {
  (phase: string, current: number, total: number): void;
}

class ImportExportError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'ImportExportError';
  }
}

async function buildImportContext(
  importData: ExportData,
  options: ImportOptions
): Promise<ImportContext> {
  const result: ImportResult = {
    success: false,
    importedGroups: 0,
    importedTiles: 0,
    importedDisabledDefaults: 0,
    skippedItems: 0,
    errors: [],
    warnings: [],
  };

  // Build group mappings once for the entire import operation
  const locales = [...new Set(importData.data.customGroups.map((g) => g.locale))];
  const gameModes = [...new Set(importData.data.customGroups.map((g) => g.gameMode))];

  const allExistingGroups: CustomGroupPull[] = [];
  for (const locale of locales) {
    for (const gameMode of gameModes) {
      const groups = await getCustomGroups({ locale, gameMode });
      allExistingGroups.push(...groups);
    }
  }

  const groupMap = new Map(allExistingGroups.map((g) => [g.name, g]));
  const groupIdMap = new Map(allExistingGroups.map((g) => [g.name, g.id]));

  // Pre-load existing tiles for conflict detection
  const existingTileMap = new Map<string, CustomTile>();
  for (const group of allExistingGroups) {
    const tiles = await getTiles({ group_id: group.id });
    for (const tile of tiles) {
      const key = `${tile.action}_${tile.intensity}_${group.id}`;
      existingTileMap.set(key, tile);
    }
  }

  return { groupMap, groupIdMap, existingTileMap, result, importData, options };
}

// Export utilities
async function createExportGroup(group: CustomGroupPull): Promise<ExportGroup> {
  const contentHash = await generateGroupContentHash(group);

  return {
    name: group.name,
    label: group.label,
    gameMode: group.gameMode,
    locale: group.locale,
    type: group.type,
    intensities: group.intensities.map((i) => ({
      value: i.value,
      label: i.label,
    })),
    contentHash,
  };
}

async function createExportTile(tile: CustomTile, group: CustomGroupPull): Promise<ExportTile> {
  const contentHash = await generateTileContentHash(tile, group.name);

  return {
    action: tile.action,
    groupName: group.name,
    intensity: tile.intensity,
    tags: tile.tags || [],
    gameMode: group.gameMode,
    locale: group.locale,
    isEnabled: tile.isEnabled !== 0,
    contentHash,
  };
}

async function createExportDisabled(
  tile: CustomTile,
  group: CustomGroupPull
): Promise<ExportDisabledDefault> {
  const contentHash = await generateDisabledDefaultContentHash(
    tile.action,
    group.name,
    tile.intensity,
    group.gameMode
  );

  return {
    action: tile.action,
    groupName: group.name,
    intensity: tile.intensity,
    gameMode: group.gameMode,
    contentHash,
  };
}

// Import processing
async function processGroupImport(ctx: ImportContext): Promise<void> {
  for (const importedGroup of ctx.importData.data.customGroups) {
    try {
      const existingGroup = ctx.groupMap.get(importedGroup.name);

      if (existingGroup) {
        const existingHash = await generateGroupContentHash(existingGroup);

        if (existingHash === importedGroup.contentHash) {
          ctx.result.skippedItems++;
          ctx.result.warnings.push(`Skipped identical group: ${importedGroup.name}`);
          continue;
        }

        // Update existing group
        await updateCustomGroup(existingGroup.id, createGroupData(importedGroup));
        ctx.result.warnings.push(`Updated existing group: ${importedGroup.name}`);
        continue;
      }

      // Add new group
      const newGroupId = await addCustomGroup(createGroupData(importedGroup));
      ctx.result.importedGroups++;

      // Update context maps for subsequent tile imports
      if (newGroupId) {
        // Create a minimal group object for mapping
        const newGroupData = {
          ...createGroupData(importedGroup),
          id: newGroupId,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as CustomGroupPull;

        ctx.groupMap.set(importedGroup.name, newGroupData);
        ctx.groupIdMap.set(importedGroup.name, newGroupId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.result.errors.push(`Failed to import group ${importedGroup.name}: ${message}`);
    }
  }
}

async function processTileImport(ctx: ImportContext): Promise<void> {
  // Batch tile imports for better performance
  const tileBatches: ExportTile[][] = [];
  for (let i = 0; i < ctx.importData.data.customTiles.length; i += BATCH_SIZE) {
    tileBatches.push(ctx.importData.data.customTiles.slice(i, i + BATCH_SIZE));
  }

  for (const batch of tileBatches) {
    const tilesToAdd: Array<{ data: any; tile: ExportTile }> = [];

    for (const importedTile of batch) {
      try {
        let groupId = ctx.groupIdMap.get(importedTile.groupName);
        let group = ctx.groupMap.get(importedTile.groupName);

        // If group not found, try to calculate the ID for default groups
        if (!groupId || !group) {
          // Calculate deterministic ID for default groups
          const calculatedGroupId = createDeterministicGroupId(
            importedTile.groupName,
            importedTile.locale,
            importedTile.gameMode
          );

          // Check if this calculated ID exists in our system
          const allGroups = await getCustomGroups({
            locale: importedTile.locale,
            gameMode: importedTile.gameMode,
          });
          const defaultGroup = allGroups.find((g) => g.id === calculatedGroupId);

          if (defaultGroup) {
            groupId = calculatedGroupId;
            group = defaultGroup;
            // Add to maps for future lookups in this import session
            ctx.groupIdMap.set(importedTile.groupName, groupId);
            ctx.groupMap.set(importedTile.groupName, group);
          } else {
            ctx.result.warnings.push(
              `Skipped tile for missing group: ${importedTile.groupName} (${importedTile.locale}/${importedTile.gameMode})`
            );
            continue;
          }
        }

        // Validate intensity exists in group
        if (!group.intensities.some((i) => i.value === importedTile.intensity)) {
          ctx.result.warnings.push(
            `Skipped tile with invalid intensity ${importedTile.intensity} for group ${importedTile.groupName}`
          );
          continue;
        }

        const tileKey = `${importedTile.action}_${importedTile.intensity}_${groupId}`;
        const existingTile = ctx.existingTileMap.get(tileKey);

        if (existingTile) {
          const existingHash = await generateTileContentHash(existingTile, group.name);

          if (existingHash === importedTile.contentHash) {
            ctx.result.skippedItems++;
            ctx.result.warnings.push(`Skipped identical tile: ${importedTile.action}`);
            continue;
          }

          // Update existing tile
          if (existingTile.id !== undefined) {
            await updateCustomTile(existingTile.id, createTileData(importedTile, groupId));
            ctx.result.warnings.push(`Updated existing tile: ${importedTile.action}`);
            continue;
          }
        }

        // Queue for batch insert
        tilesToAdd.push({
          data: createTileData(importedTile, groupId),
          tile: importedTile,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.result.errors.push(`Failed to import tile ${importedTile.action}: ${message}`);
      }
    }

    // Batch insert new tiles
    for (const { data, tile } of tilesToAdd) {
      try {
        await addCustomTile(data);
        ctx.result.importedTiles++;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.result.errors.push(`Failed to add tile ${tile.action}: ${message}`);
      }
    }
  }
}

async function processDisabledDefaultImport(ctx: ImportContext): Promise<void> {
  // Process disabled default tiles by setting them to disabled in the database
  for (const disabledTile of ctx.importData.data.disabledDefaultTiles) {
    try {
      let groupId = ctx.groupIdMap.get(disabledTile.groupName);

      // If group not found, try to calculate the ID for default groups
      if (!groupId) {
        // Calculate deterministic ID for default groups
        const calculatedGroupId = createDeterministicGroupId(
          disabledTile.groupName,
          'en', // Default to 'en' if not provided in disabledTile
          disabledTile.gameMode
        );

        // Check if this calculated ID exists in our system
        const allGroups = await getCustomGroups({
          locale: 'en', // Default to 'en' if not provided
          gameMode: disabledTile.gameMode,
        });
        const defaultGroup = allGroups.find((g) => g.id === calculatedGroupId);

        if (defaultGroup) {
          groupId = calculatedGroupId;
          // Add to map for future lookups in this import session
          ctx.groupIdMap.set(disabledTile.groupName, groupId);
          ctx.groupMap.set(disabledTile.groupName, defaultGroup);
        } else {
          ctx.result.warnings.push(
            `Skipped disabled default for missing group: ${disabledTile.groupName}`
          );
          continue;
        }
      }

      // Find existing default tile and disable it
      const existingTiles = await getTiles({
        group_id: groupId,
        isCustom: 0,
        intensity: disabledTile.intensity,
        action: disabledTile.action,
      });

      if (existingTiles.length > 0) {
        const tileToUpdate = existingTiles[0];
        if (tileToUpdate.id !== undefined) {
          await updateCustomTile(tileToUpdate.id, {
            ...tileToUpdate,
            isEnabled: 0,
          });
          ctx.result.importedDisabledDefaults++;
        }
      } else {
        ctx.result.warnings.push(
          `Default tile not found to disable: ${disabledTile.action} (${disabledTile.groupName})`
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.result.errors.push(`Failed to disable default tile ${disabledTile.action}: ${message}`);
    }
  }
}

// Utility functions
function createGroupData(importedGroup: ExportGroup): CustomGroupBase {
  return {
    name: importedGroup.name,
    label: importedGroup.label,
    intensities: importedGroup.intensities.map((intensity, _index) => ({
      id: `${importedGroup.name}-${intensity.value}`,
      label: intensity.label,
      value: intensity.value,
      isDefault: false,
    })),
    type: importedGroup.type as 'solo' | 'consumption' | 'foreplay' | 'sex' | undefined,
    isDefault: false,
    locale: importedGroup.locale,
    gameMode: importedGroup.gameMode,
  };
}

function createTileData(importedTile: ExportTile, groupId: string) {
  return {
    group_id: groupId,
    intensity: importedTile.intensity,
    action: importedTile.action,
    tags: importedTile.tags,
    isEnabled: importedTile.isEnabled ? 1 : 0,
    isCustom: 1,
  };
}

function isValidImportData(data: any): data is ExportData {
  return (
    data &&
    typeof data === 'object' &&
    data.formatVersion &&
    data.data &&
    Array.isArray(data.data.customGroups) &&
    Array.isArray(data.data.customTiles)
  );
}

// Public API
export async function exportAllData(
  options: Partial<ExportOptions> = {},
  progressCallback?: ProgressCallback
): Promise<string> {
  try {
    const { includeDisabledDefaults = false, singleGroupName } = options;

    // Note: We export ALL user data regardless of locale/gameMode

    progressCallback?.('Analyzing exportable data', 0, 100);

    // Query 1: Get ALL custom groups (regardless of locale/gameMode)
    const customGroups = await getCustomGroups({ isDefault: false });

    // Query 2: Get ALL custom tiles (isCustom = true) - regardless of locale/gameMode - includes tiles in both custom and default groups
    const allCustomTiles = await getTiles({ isCustom: 1 });

    // Query 3: Get ALL disabled default tiles (isCustom = false, isEnabled = false) - regardless of locale/gameMode
    const allDisabledDefaults = includeDisabledDefaults
      ? await getTiles({ isCustom: 0, isEnabled: 0 })
      : [];

    // Get all groups that have exportable content (union of group IDs from all queries)
    const customGroupIds = new Set(customGroups.map((g) => g.id));
    const tilesGroupIds = new Set(allCustomTiles.map((t) => t.group_id).filter(Boolean));
    const disabledGroupIds = new Set(allDisabledDefaults.map((t) => t.group_id).filter(Boolean));

    const allRelevantGroupIds = new Set([...customGroupIds, ...tilesGroupIds, ...disabledGroupIds]);

    // Get ALL groups (both custom and default) that have exportable content - regardless of locale/gameMode
    const allGroups = await getCustomGroups({});
    const relevantGroups = allGroups.filter((g) => allRelevantGroupIds.has(g.id));

    // Filter by single group if specified
    const groupsToExport = singleGroupName
      ? relevantGroups.filter((g) => g.name === singleGroupName)
      : relevantGroups;

    const groupMap = new Map(groupsToExport.map((g) => [g.id, g]));
    const exportGroupIds = new Set(groupsToExport.map((g) => g.id));

    progressCallback?.('Processing groups', 20, 100);

    // Process groups for export - only custom groups
    const exportGroups: ExportGroup[] = [];
    for (const group of groupsToExport.filter((g) => !g.isDefault)) {
      exportGroups.push(await createExportGroup(group));
    }

    progressCallback?.('Processing custom tiles', 50, 100);

    // Process custom tiles - only those belonging to groups we're exporting
    const exportTiles: ExportTile[] = [];
    const customTilesToExport = allCustomTiles.filter(
      (t) => t.group_id && exportGroupIds.has(t.group_id)
    );

    for (const tile of customTilesToExport) {
      const group = groupMap.get(tile.group_id!);
      if (group) {
        exportTiles.push(await createExportTile(tile, group));
      }
    }

    progressCallback?.('Processing disabled defaults', 80, 100);

    // Process disabled default tiles - only those belonging to groups we're exporting
    const exportDisabled: ExportDisabledDefault[] = [];
    const disabledTilesToExport = allDisabledDefaults.filter(
      (t) => t.group_id && exportGroupIds.has(t.group_id)
    );

    for (const tile of disabledTilesToExport) {
      const group = groupMap.get(tile.group_id!);
      if (group) {
        exportDisabled.push(await createExportDisabled(tile, group));
      }
    }

    const exportData: ExportData = {
      formatVersion: EXPORT_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        customGroups: exportGroups,
        customTiles: exportTiles,
        disabledDefaultTiles: exportDisabled,
      },
    };

    progressCallback?.('Finalizing export', 100, 100);
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    throw new ImportExportError('Export failed', error);
  }
}

export async function analyzeImportConflicts(
  rawData: string | ExportData,
  options: Partial<ImportOptions> = {}
): Promise<ConflictAnalysis> {
  try {
    let importData: ExportData;

    if (typeof rawData === 'string') {
      importData = JSON.parse(rawData);
    } else {
      importData = rawData;
    }

    if (!isValidImportData(importData)) {
      throw new ImportExportError('Invalid import data format');
    }

    const fullOptions: ImportOptions = {
      validateContent: options.validateContent ?? true,
      preserveDisabledDefaults: options.preserveDisabledDefaults ?? false,
    };

    await buildImportContext(importData, fullOptions);

    return {
      groupConflicts: [],
      tileConflicts: [],
      disabledConflicts: [],
    };
  } catch (error) {
    throw new ImportExportError('Conflict analysis failed', error);
  }
}

export async function importData(
  rawData: string | ExportData,
  options: Partial<ImportOptions> = {},
  progressCallback?: ProgressCallback
): Promise<ImportResult> {
  try {
    let importData: ExportData;

    if (typeof rawData === 'string') {
      importData = JSON.parse(rawData);
    } else {
      importData = rawData;
    }

    if (!isValidImportData(importData)) {
      throw new ImportExportError('Invalid import data format');
    }

    const fullOptions: ImportOptions = {
      validateContent: options.validateContent ?? true,
      preserveDisabledDefaults: options.preserveDisabledDefaults ?? false,
    };

    progressCallback?.('Preparing import', 0, 100);
    const ctx = await buildImportContext(importData, fullOptions);

    progressCallback?.('Importing groups', 25, 100);
    await processGroupImport(ctx);

    progressCallback?.('Importing tiles', 75, 100);
    await processTileImport(ctx);

    if (fullOptions.preserveDisabledDefaults && importData.data.disabledDefaultTiles.length > 0) {
      progressCallback?.('Importing disabled defaults', 85, 100);
      await processDisabledDefaultImport(ctx);
    }

    ctx.result.success = ctx.result.errors.length === 0;
    progressCallback?.('Import complete', 100, 100);

    return ctx.result;
  } catch (error) {
    throw new ImportExportError('Import failed', error);
  }
}

export async function importFromJson(
  jsonString: string,
  options: Partial<ImportOptions> = {}
): Promise<ImportResult> {
  return importData(jsonString, options);
}
