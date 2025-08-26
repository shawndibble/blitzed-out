/**
 * Group ID Migration Service
 *
 * Migrates tiles from string-based group matching to foreign key group_id relationships
 * for improved data consistency, performance, and sync reliability.
 *
 * CRITICAL: Handles deterministic IDs for default groups to ensure consistency across devices
 */

import db from '@/stores/store';
import { updateCustomTile } from '@/stores/customTiles';
import { getCustomGroups } from '@/stores/customGroups';

/**
 * Creates a deterministic group ID for default groups
 * This ensures default groups have the same ID across all devices for sync consistency
 */
export function createDeterministicGroupId(
  groupName: string,
  locale: string,
  gameMode: string
): string {
  // Create a consistent hash-like ID based on group properties
  // Format: default-{locale}-{gameMode}-{groupName}
  // This ensures all devices generate the same ID for default groups
  const baseId = `default-${locale}-${gameMode}-${groupName}`;

  // Create a simple hash to keep IDs reasonably short but still unique
  let hash = 0;
  for (let i = 0; i < baseId.length; i++) {
    const char = baseId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to a positive hex string with prefix
  const hashStr = Math.abs(hash).toString(16).padStart(8, '0');
  return `default_${locale}_${gameMode}_${groupName}_${hashStr}`.slice(0, 50);
}

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  orphanedCount: number;
  skippedCount: number;
  errors: Array<{
    tileId: number;
    error: string;
  }>;
}

export interface AuditResult {
  totalTiles: number;
  tilesWithGroupId: number;
  tilesMissingGroupId: number;
  inconsistentMappings: Array<{
    group: string;
    groupIds: string[];
    count: number;
  }>;
  orphanedTiles: Array<{
    id: number;
    group: string;
    locale: string;
    gameMode: string;
  }>;
}

/**
 * Audits the current state of group_id usage in tiles
 */
export async function auditGroupIdUsage(): Promise<AuditResult> {
  console.log('Starting group ID audit...');

  try {
    // Get all tiles
    const allTiles = await db.customTiles.toArray();
    const totalTiles = allTiles.length;

    // Count tiles with/without group_id
    const tilesWithGroupId = allTiles.filter(
      (tile) => tile.group_id && tile.group_id.trim()
    ).length;
    const tilesMissingGroupId = totalTiles - tilesWithGroupId;

    // Find inconsistent mappings (same group name with different group_ids)
    const groupMappings: Record<string, Set<string>> = {};
    allTiles.forEach((tile) => {
      if (tile.group && tile.group_id && tile.group_id.trim()) {
        const key = `${tile.group}|${tile.locale || 'en'}|${tile.gameMode || 'online'}`;
        if (!groupMappings[key]) {
          groupMappings[key] = new Set();
        }
        groupMappings[key].add(tile.group_id);
      }
    });

    const inconsistentMappings = Object.entries(groupMappings)
      .filter(([, groupIds]) => groupIds.size > 1)
      .map(([key, groupIds]) => {
        const [group] = key.split('|');
        const count = allTiles.filter(
          (tile) => tile.group === group && groupIds.has(tile.group_id || '')
        ).length;
        return {
          group,
          groupIds: Array.from(groupIds),
          count,
        };
      });

    // Find orphaned tiles (tiles without matching groups)
    const allGroups = await db.customGroups.toArray();
    const validGroupIds = new Set(allGroups.map((group) => group.id));

    const orphanedTiles = allTiles
      .filter((tile) => tile.group_id && tile.group_id.trim() && !validGroupIds.has(tile.group_id))
      .map((tile) => ({
        id: tile.id!,
        group: tile.group,
        locale: tile.locale || 'en',
        gameMode: tile.gameMode || 'online',
      }));

    const result: AuditResult = {
      totalTiles,
      tilesWithGroupId,
      tilesMissingGroupId,
      inconsistentMappings,
      orphanedTiles,
    };

    console.log('Group ID audit complete:', result);
    return result;
  } catch (error) {
    console.error('Error during group ID audit:', error);
    throw error;
  }
}

/**
 * Resolves a group_id for a tile based on group name, locale, and gameMode
 * CRITICAL: For default groups, generates deterministic IDs to ensure sync consistency
 */
export async function resolveGroupId(
  groupName: string,
  locale: string = 'en',
  gameMode: string = 'online',
  isDefault: boolean = false
): Promise<string | null> {
  try {
    // For default groups, first try to find existing group with deterministic ID
    if (isDefault) {
      const deterministicId = createDeterministicGroupId(groupName, locale, gameMode);

      // Check if a group with this deterministic ID already exists
      const existingById = await db.customGroups.where('id').equals(deterministicId).first();
      if (existingById) {
        return deterministicId;
      }

      // Check if a default group with this name exists (might need ID migration)
      const defaultGroups = await getCustomGroups({
        name: groupName,
        locale,
        gameMode,
        isDefault: true,
      });

      if (defaultGroups.length > 0) {
        // If found but has wrong ID, we should migrate it to use the deterministic ID
        const group = defaultGroups[0];
        if (group.id !== deterministicId) {
          console.log(
            `Migrating default group "${groupName}" from ID ${group.id} to deterministic ID ${deterministicId}`
          );
          // This would require a separate migration function to update the group ID
          // For now, return the deterministic ID that should be used
        }
        return deterministicId;
      }

      // If no default group exists, return the deterministic ID that should be created
      return deterministicId;
    }

    // For custom (user-created) groups, use existing logic
    // First try exact match
    const exactMatches = await getCustomGroups({
      name: groupName,
      locale,
      gameMode,
    });

    if (exactMatches.length > 0) {
      return exactMatches[0].id;
    }

    // Try without gameMode specificity (fallback to any gameMode)
    const localeMatches = await getCustomGroups({
      name: groupName,
      locale,
    });

    if (localeMatches.length > 0) {
      return localeMatches[0].id;
    }

    // Try without locale specificity (fallback to any locale)
    const nameMatches = await getCustomGroups({
      name: groupName,
    });

    if (nameMatches.length > 0) {
      // Prefer groups with matching locale or gameMode if available
      const bestMatch =
        nameMatches.find((group) => group.locale === locale || group.gameMode === gameMode) ||
        nameMatches[0];

      return bestMatch.id;
    }

    return null;
  } catch (error) {
    console.error(`Error resolving group ID for "${groupName}":`, error);
    return null;
  }
}

/**
 * Migrates default groups to use deterministic IDs for cross-device consistency
 */
export async function migrateDefaultGroupIds(): Promise<{
  migratedCount: number;
  errors: Array<{ groupId: string; error: string }>;
}> {
  console.log('Starting default group ID migration...');

  const result = {
    migratedCount: 0,
    errors: [] as Array<{ groupId: string; error: string }>,
  };

  try {
    // Get all default groups
    const defaultGroups = await getCustomGroups({ isDefault: true });

    for (const group of defaultGroups) {
      try {
        const expectedId = createDeterministicGroupId(
          group.name,
          group.locale || 'en',
          group.gameMode || 'online'
        );

        if (group.id !== expectedId) {
          console.log(`Migrating default group "${group.name}" from ${group.id} to ${expectedId}`);

          // Check if the target ID already exists
          const existingWithTargetId = await db.customGroups.where('id').equals(expectedId).first();
          if (existingWithTargetId) {
            console.warn(
              `Target ID ${expectedId} already exists, skipping migration for group ${group.id}`
            );
            continue;
          }

          // Update all tiles that reference the old group ID
          const tilesToUpdate = await db.customTiles.where('group_id').equals(group.id).toArray();
          for (const tile of tilesToUpdate) {
            await updateCustomTile(tile.id!, { group_id: expectedId });
          }

          // Delete the old group and create with new ID
          await db.customGroups.delete(group.id);
          await db.customGroups.add({
            ...group,
            id: expectedId,
            updatedAt: new Date(),
          });

          result.migratedCount++;
        }
      } catch (error) {
        console.error(`Error migrating default group ${group.id}:`, error);
        result.errors.push({
          groupId: group.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    console.log(
      `Default group ID migration complete: ${result.migratedCount} groups migrated, ${result.errors.length} errors`
    );
    return result;
  } catch (error) {
    console.error('Default group ID migration failed:', error);
    result.errors.push({
      groupId: 'unknown',
      error: error instanceof Error ? error.message : String(error),
    });
    return result;
  }
}

/**
 * Migrates all tiles to use group_id instead of string-based group matching
 */
export async function migrateGroupIds(
  options: {
    dryRun?: boolean;
    batchSize?: number;
  } = {}
): Promise<MigrationResult> {
  const { dryRun = false, batchSize = 100 } = options;

  console.log(`Starting group ID migration${dryRun ? ' (DRY RUN)' : ''}...`);

  const result: MigrationResult = {
    success: false,
    migratedCount: 0,
    orphanedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  try {
    // Get all tiles missing group_id
    const tilesToMigrate = await db.customTiles
      .filter((tile) => !tile.group_id || !tile.group_id.trim())
      .toArray();

    console.log(`Found ${tilesToMigrate.length} tiles to migrate`);

    // Process in batches to avoid overwhelming the database
    for (let i = 0; i < tilesToMigrate.length; i += batchSize) {
      const batch = tilesToMigrate.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (tile) => {
          try {
            // Determine if this is a default tile (isCustom = 0)
            const isDefault = tile.isCustom === 0;

            const groupId = await resolveGroupId(
              tile.group,
              tile.locale || 'en',
              tile.gameMode || 'online',
              isDefault // Pass isDefault flag for deterministic ID handling
            );

            if (groupId) {
              if (!dryRun) {
                await updateCustomTile(tile.id!, {
                  group_id: groupId,
                  // Keep the group name for backward compatibility
                  group: tile.group,
                });
              }
              result.migratedCount++;
            } else {
              console.warn(
                `Could not resolve group ID for tile ${tile.id} with group "${tile.group}" (isDefault: ${isDefault})`
              );
              result.orphanedCount++;
            }
          } catch (error) {
            console.error(`Error migrating tile ${tile.id}:`, error);
            result.errors.push({
              tileId: tile.id!,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        })
      );

      // Log progress
      if ((i + batchSize) % (batchSize * 5) === 0 || i + batchSize >= tilesToMigrate.length) {
        console.log(
          `Migration progress: ${Math.min(i + batchSize, tilesToMigrate.length)}/${tilesToMigrate.length} tiles processed`
        );
      }
    }

    // Validate migration results
    if (!dryRun) {
      const auditResults = await auditGroupIdUsage();
      const remainingTiles = auditResults.tilesMissingGroupId;

      if (remainingTiles > 0) {
        console.warn(`Migration completed but ${remainingTiles} tiles still missing group_id`);
      } else {
        console.log('Migration validation passed: All tiles now have group_id');
      }

      result.skippedCount = remainingTiles;
    }

    result.success = result.errors.length === 0;

    console.log(`Group ID migration ${dryRun ? 'simulation' : ''} complete:`, {
      migrated: result.migratedCount,
      orphaned: result.orphanedCount,
      errors: result.errors.length,
      skipped: result.skippedCount,
    });

    return result;
  } catch (error) {
    console.error('Group ID migration failed:', error);
    result.errors.push({
      tileId: -1,
      error: error instanceof Error ? error.message : String(error),
    });
    return result;
  }
}

/**
 * Validates that all tiles have valid group_id references
 */
export async function validateGroupIdIntegrity(): Promise<{
  isValid: boolean;
  issues: Array<{
    type: 'missing_group_id' | 'invalid_group_id' | 'orphaned_group';
    tileId?: number;
    groupId?: string;
    message: string;
  }>;
}> {
  console.log('Validating group ID integrity...');

  const issues: Array<{
    type: 'missing_group_id' | 'invalid_group_id' | 'orphaned_group';
    tileId?: number;
    groupId?: string;
    message: string;
  }> = [];

  try {
    // Get all tiles and groups
    const allTiles = await db.customTiles.toArray();
    const allGroups = await db.customGroups.toArray();
    const validGroupIds = new Set(allGroups.map((group) => group.id));

    // Check each tile
    for (const tile of allTiles) {
      // Check for missing group_id
      if (!tile.group_id || !tile.group_id.trim()) {
        issues.push({
          type: 'missing_group_id',
          tileId: tile.id,
          message: `Tile ${tile.id} (${tile.group}) missing group_id`,
        });
        continue;
      }

      // Check for invalid group_id reference
      if (!validGroupIds.has(tile.group_id)) {
        issues.push({
          type: 'invalid_group_id',
          tileId: tile.id,
          groupId: tile.group_id,
          message: `Tile ${tile.id} has invalid group_id: ${tile.group_id}`,
        });
      }
    }

    // Check for orphaned groups (groups with no tiles)
    const tilesGroupIds = new Set(
      allTiles.filter((tile) => tile.group_id && tile.group_id.trim()).map((tile) => tile.group_id!)
    );

    for (const group of allGroups) {
      if (!group.isDefault && !tilesGroupIds.has(group.id)) {
        issues.push({
          type: 'orphaned_group',
          groupId: group.id,
          message: `Group ${group.id} (${group.name}) has no associated tiles`,
        });
      }
    }

    const isValid = issues.length === 0;

    console.log(
      `Group ID integrity validation ${isValid ? 'passed' : 'failed'} with ${issues.length} issues`
    );

    return { isValid, issues };
  } catch (error) {
    console.error('Error during group ID integrity validation:', error);
    return {
      isValid: false,
      issues: [
        {
          type: 'invalid_group_id',
          message: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}

/**
 * Utility function to run all migration steps in sequence
 */
export async function runFullGroupIdMigration(
  options: {
    dryRun?: boolean;
    skipAudit?: boolean;
  } = {}
): Promise<{
  auditResult?: AuditResult;
  defaultGroupMigrationResult: Awaited<ReturnType<typeof migrateDefaultGroupIds>>;
  migrationResult: MigrationResult;
  validationResult: Awaited<ReturnType<typeof validateGroupIdIntegrity>>;
}> {
  const { dryRun = false, skipAudit = false } = options;

  console.log('Running full group ID migration...');

  // Step 1: Audit current state (optional)
  let auditResult: AuditResult | undefined;
  if (!skipAudit) {
    auditResult = await auditGroupIdUsage();
  }

  // Step 2: Migrate default groups to deterministic IDs first
  const defaultGroupMigrationResult = await migrateDefaultGroupIds();

  // Step 3: Run tile migration (includes both default and custom tiles)
  const migrationResult = await migrateGroupIds({ dryRun });

  // Step 4: Validate results
  const validationResult = await validateGroupIdIntegrity();

  console.log('Full group ID migration complete:', {
    defaultGroupsMigrated: defaultGroupMigrationResult.migratedCount,
    tilesMigrated: migrationResult.migratedCount,
    orphanedTiles: migrationResult.orphanedCount,
    validationPassed: validationResult.isValid,
  });

  return {
    auditResult,
    defaultGroupMigrationResult,
    migrationResult,
    validationResult,
  };
}
