import { getCustomGroups, addCustomGroup, updateCustomGroup } from '@/stores/customGroups';
import { getTiles, addCustomTile, updateCustomTile } from '@/stores/customTiles';
import { createDeterministicGroupId } from './migration/groupIdMigration';
import {
  SUPPORTED_LANGUAGES,
  GAME_MODES,
  type SupportedLanguage,
  type GameMode,
} from './migration/constants';
import {
  generateGroupContentHash,
  generateTileContentHash,
  generateDisabledDefaultContentHash,
  generateExtensionContentHash,
} from './contentHashing';
import { appendIntensities } from './intensityMerge';
import {
  ExportData,
  ExportGroup,
  ExportGroupExtension,
  ExportTile,
  ExportDisabledDefault,
  ExportOptions,
  ImportOptions,
  ImportResult,
  ConflictAnalysis,
} from '@/types/importExport';
import type { CustomGroupPull, CustomGroupBase, AnatomyRequirement } from '@/types/customGroups';
import type { CustomTile } from '@/types/customTiles';

// 2.1.0 added data.groupExtensions (append-only intensity deltas for default
// groups). 2.0.0 payloads remain importable; older readers ignore the array.
export const EXPORT_FORMAT_VERSION = '2.1.0';
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
    importedIntensities: 0,
    importedDisabledDefaults: 0,
    skippedItems: 0,
    errors: [],
    warnings: [],
  };

  // Build group mappings once for the entire import operation. Locale/mode
  // pairs come from every section — a payload may carry only tiles or
  // extensions targeting default groups, with no customGroups entries.
  const sections = [
    ...importData.data.customGroups,
    ...importData.data.customTiles,
    ...(importData.data.groupExtensions ?? []),
  ];
  const locales = [...new Set(sections.map((s) => s.locale))];
  const gameModes = [...new Set(sections.map((s) => s.gameMode))];

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
    ...(group.anatomyRequirement ? { anatomyRequirement: group.anatomyRequirement } : {}),
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

      if (existingGroup?.isDefault) {
        // Never let an import replace a default group's record — that would
        // strip its isDefault flag and rebuild its intensity ladder. Tiles
        // targeting the group still import; ladder additions travel via
        // groupExtensions.
        ctx.result.skippedItems++;
        ctx.result.warnings.push(
          `Skipped group "${importedGroup.name}": default groups cannot be replaced by imports`
        );
        continue;
      }

      if (existingGroup) {
        const existingHash = await generateGroupContentHash(existingGroup);

        if (existingHash === importedGroup.contentHash) {
          ctx.result.skippedItems++;
          ctx.result.warnings.push(`Skipped identical group: ${importedGroup.name}`);
          continue;
        }

        // Update existing group
        await updateCustomGroup(existingGroup.id, createGroupData(importedGroup, ctx));
        ctx.result.warnings.push(`Updated existing group: ${importedGroup.name}`);
        continue;
      }

      // Add new group
      const newGroupId = await addCustomGroup(createGroupData(importedGroup, ctx));
      ctx.result.importedGroups++;

      // Update context maps for subsequent tile imports
      if (newGroupId) {
        // Create a minimal group object for mapping
        const newGroupData = {
          ...createGroupData(importedGroup, ctx),
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

async function processGroupExtensions(ctx: ImportContext): Promise<void> {
  for (const extension of ctx.importData.data.groupExtensions ?? []) {
    try {
      let group = ctx.groupMap.get(extension.groupName);

      if (!group) {
        // Same deterministic-id resolution the tile importer uses for
        // default groups outside the payload's customGroups entries.
        const calculatedGroupId = createDeterministicGroupId(
          extension.groupName,
          extension.locale,
          extension.gameMode
        );
        const allGroups = await getCustomGroups({
          locale: extension.locale,
          gameMode: extension.gameMode,
        });
        const defaultGroup = allGroups.find((g) => g.id === calculatedGroupId);
        if (defaultGroup) {
          group = defaultGroup;
          ctx.groupMap.set(extension.groupName, defaultGroup);
          ctx.groupIdMap.set(extension.groupName, defaultGroup.id);
        }
      }

      if (!group) {
        ctx.result.warnings.push(
          `Skipped extension for missing group: ${extension.groupName} (${extension.locale}/${extension.gameMode})`
        );
        continue;
      }

      if (!group.isDefault) {
        ctx.result.warnings.push(
          `Skipped extension for non-default group "${extension.groupName}": custom groups travel as full definitions`
        );
        continue;
      }

      const { merged, added, skipped } = appendIntensities(
        group.intensities,
        extension.addedIntensities,
        group.name
      );

      for (const skip of skipped) {
        if (skip.reason === 'duplicate') {
          // Expected on re-import; not worth a warning.
          ctx.result.skippedItems++;
        } else {
          ctx.result.warnings.push(
            `Skipped intensity ${skip.value} for ${extension.groupName}: ${skip.reason}`
          );
        }
      }

      if (added.length === 0) continue;

      await updateCustomGroup(group.id, { intensities: merged });
      ctx.result.importedIntensities += added.length;
      // Refresh the map so tiles at the new levels pass intensity validation.
      ctx.groupMap.set(extension.groupName, { ...group, intensities: merged });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.result.errors.push(
        `Failed to import extension for ${extension.groupName}: ${message}`
      );
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
            await updateCustomTile(existingTile.id, createTileData(importedTile, groupId, ctx));
            ctx.result.warnings.push(`Updated existing tile: ${importedTile.action}`);
            continue;
          }
        }

        // Queue for batch insert
        tilesToAdd.push({
          data: createTileData(importedTile, groupId, ctx),
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
        // Find the locale from the corresponding imported group, fallback to 'en'
        const importedGroup = ctx.importData.data.customGroups.find(
          (g) => g.name === disabledTile.groupName && g.gameMode === disabledTile.gameMode
        );
        const groupLocale = importedGroup?.locale || 'en';

        // Calculate deterministic ID for default groups using correct locale
        const calculatedGroupId = createDeterministicGroupId(
          disabledTile.groupName,
          groupLocale,
          disabledTile.gameMode
        );

        // Check if this calculated ID exists in our system
        const allGroups = await getCustomGroups({
          locale: groupLocale,
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
function createGroupData(importedGroup: ExportGroup, ctx?: ImportContext): CustomGroupBase {
  const prov = ctx?.options.packProvenance;
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
    ...(importedGroup.anatomyRequirement
      ? { anatomyRequirement: importedGroup.anatomyRequirement as AnatomyRequirement }
      : {}),
    isDefault: false,
    locale: importedGroup.locale,
    gameMode: importedGroup.gameMode,
    ...(prov ? { packId: prov.packId } : {}),
  };
}

function createTileData(importedTile: ExportTile, groupId: string, ctx?: ImportContext) {
  const prov = ctx?.options.packProvenance;
  return {
    group_id: groupId,
    intensity: importedTile.intensity,
    action: importedTile.action,
    tags: importedTile.tags,
    isEnabled: importedTile.isEnabled ? 1 : 0,
    isCustom: 1,
    ...(prov ? { packId: prov.packId, packName: prov.packName } : {}),
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
    const {
      includeDisabledDefaults = false,
      singleGroupName,
      groupNames,
      locales,
      gameModes,
    } = options;

    // Validate filter arrays
    const validatedLocales = locales?.filter((locale) => SUPPORTED_LANGUAGES.includes(locale));
    const validatedGameModes = gameModes?.filter((gameMode) => GAME_MODES.includes(gameMode));

    progressCallback?.('Analyzing exportable data', 0, 100);

    // Build filters for custom groups query
    const groupFilters: any = { isDefault: false };

    // Apply locale filter if provided and has valid values
    if (validatedLocales && validatedLocales.length > 0) {
      // Note: Dexie doesn't support IN queries directly, so we'll filter after fetching
      // or we need to make multiple queries and combine results
      // For now, we'll fetch all and filter in memory for simplicity
    }

    if (validatedGameModes && validatedGameModes.length > 0) {
      // Same approach for gameMode
    }

    // Query 1: Get custom groups with potential filtering
    let customGroups = await getCustomGroups(groupFilters);

    // Apply locale/gameMode filtering in memory if needed
    if (validatedLocales && validatedLocales.length > 0) {
      customGroups = customGroups.filter(
        (group) => group.locale && validatedLocales.includes(group.locale as SupportedLanguage)
      );
    }
    if (validatedGameModes && validatedGameModes.length > 0) {
      customGroups = customGroups.filter(
        (group) => group.gameMode && validatedGameModes.includes(group.gameMode as GameMode)
      );
    }

    // Query 2: Get ALL custom tiles (isCustom = true) - filter will be applied later based on group filtering
    let allCustomTiles = await getTiles({ isCustom: 1 });

    // Query 3: Get ALL disabled default tiles (isCustom = false, isEnabled = false) - filter will be applied later
    let allDisabledDefaults = includeDisabledDefaults
      ? await getTiles({ isCustom: 0, isEnabled: 0 })
      : [];

    // Get all groups that have exportable content (union of group IDs from all queries)
    const customGroupIds = new Set(customGroups.map((g) => g.id));

    // If we have locale/gameMode filters, we need to also get relevant default groups that match the filters
    // to ensure we include tiles from default groups that match the criteria
    let allGroups = await getCustomGroups({});

    // Apply locale/gameMode filtering to all groups as well
    if (validatedLocales && validatedLocales.length > 0) {
      allGroups = allGroups.filter(
        (group) => group.locale && validatedLocales.includes(group.locale as SupportedLanguage)
      );
    }
    if (validatedGameModes && validatedGameModes.length > 0) {
      allGroups = allGroups.filter(
        (group) => group.gameMode && validatedGameModes.includes(group.gameMode as GameMode)
      );
    }

    // Get all group IDs that match our filters (both custom and default)
    const filteredGroupIds = new Set(allGroups.map((g) => g.id));

    // Filter tiles to only include those from groups that match our locale/gameMode filters
    if (
      (validatedLocales && validatedLocales.length > 0) ||
      (validatedGameModes && validatedGameModes.length > 0)
    ) {
      allCustomTiles = allCustomTiles.filter(
        (tile) => tile.group_id && filteredGroupIds.has(tile.group_id)
      );
      allDisabledDefaults = allDisabledDefaults.filter(
        (tile) => tile.group_id && filteredGroupIds.has(tile.group_id)
      );
    }

    const tilesGroupIds = new Set(allCustomTiles.map((t) => t.group_id).filter(Boolean));
    const disabledGroupIds = new Set(allDisabledDefaults.map((t) => t.group_id).filter(Boolean));

    // Default groups the user extended with custom intensity levels are
    // exportable even when they own no custom tiles yet.
    const extensionGroupIds = new Set(
      allGroups
        .filter((g) => g.isDefault && g.intensities.some((i) => !i.isDefault))
        .map((g) => g.id)
    );

    const allRelevantGroupIds = new Set([
      ...customGroupIds,
      ...tilesGroupIds,
      ...disabledGroupIds,
      ...extensionGroupIds,
    ]);

    const relevantGroups = allGroups.filter((g) => allRelevantGroupIds.has(g.id));

    // Restrict to a selected set of groups: `groupNames` (multi-select, content
    // packs) takes precedence, then legacy `singleGroupName`, else all. An
    // explicit `[]` means "select nothing"; only an omitted `groupNames` falls
    // through to singleGroupName / all relevant groups.
    const groupsToExport =
      groupNames !== undefined
        ? relevantGroups.filter((g) => groupNames.includes(g.name))
        : singleGroupName
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

    // Selected default groups export as append-only extensions: just their
    // custom (non-default) intensity levels. Default ladders and default
    // tiles never leave the app.
    const exportExtensions: ExportGroupExtension[] = [];
    for (const group of groupsToExport.filter((g) => g.isDefault)) {
      const addedIntensities = group.intensities
        .filter((i) => !i.isDefault)
        .map((i) => ({ value: i.value, label: i.label }));
      if (addedIntensities.length === 0) continue;
      exportExtensions.push({
        groupName: group.name,
        groupLabel: group.label || group.name,
        locale: group.locale,
        gameMode: group.gameMode,
        addedIntensities,
        contentHash: await generateExtensionContentHash({
          groupName: group.name,
          gameMode: group.gameMode,
          addedIntensities,
        }),
      });
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
        ...(exportExtensions.length > 0 ? { groupExtensions: exportExtensions } : {}),
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
      packProvenance: options.packProvenance,
    };

    const ctx = await buildImportContext(importData, fullOptions);

    const result: ConflictAnalysis = {
      groupConflicts: [],
      tileConflicts: [],
      disabledConflicts: [],
    };

    // Group conflicts: an imported group whose name already exists locally.
    for (const imported of importData.data.customGroups) {
      const existing = ctx.groupMap.get(imported.name);
      if (!existing) continue;
      const existingHash = await generateGroupContentHash(existing);
      result.groupConflicts.push({
        existing: await createExportGroup(existing),
        imported,
        conflictType: existingHash === imported.contentHash ? 'identical' : 'nameMatch',
      });
    }

    // Tile conflicts: an imported tile whose (action, intensity, group) already
    // exists locally. `contentMatch` flags a local edit — the existing content
    // differs from the imported one — so the UI can warn before overwriting.
    for (const imported of importData.data.customTiles) {
      let groupId = ctx.groupIdMap.get(imported.groupName);
      if (!groupId) {
        groupId = createDeterministicGroupId(
          imported.groupName,
          imported.locale,
          imported.gameMode
        );
      }
      const group = ctx.groupMap.get(imported.groupName);
      const existing = ctx.existingTileMap.get(
        `${imported.action}_${imported.intensity}_${groupId}`
      );
      if (!existing || !group) continue;
      const existingHash = await generateTileContentHash(existing, group.name);
      result.tileConflicts.push({
        existing: await createExportTile(existing, group),
        imported,
        conflictType: existingHash === imported.contentHash ? 'identical' : 'contentMatch',
      });
    }

    return result;
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
      packProvenance: options.packProvenance,
    };

    progressCallback?.('Preparing import', 0, 100);
    const ctx = await buildImportContext(importData, fullOptions);

    progressCallback?.('Importing groups', 25, 100);
    await processGroupImport(ctx);

    // Must run before tiles: tiles may target the appended intensity levels.
    progressCallback?.('Extending default groups', 50, 100);
    await processGroupExtensions(ctx);

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
