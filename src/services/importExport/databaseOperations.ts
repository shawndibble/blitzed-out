/**
 * Optimized database operations for import/export functionality
 * Focuses on batch operations, efficient queries, and proper indexing
 */

import db from '@/stores/store';
import { CustomGroupPull } from '@/types/customGroups';
import { CustomTilePull } from '@/types/customTiles';
import { GroupMapping } from './types';

/**
 * Batch fetch groups with efficient querying
 * Uses compound index [name+locale+gameMode] for optimal performance
 */
export async function batchFetchGroups(
  locale: string,
  gameMode: string,
  groupNames?: string[]
): Promise<CustomGroupPull[]> {
  // Use compound index for efficient filtering
  let query = db.customGroups
    .where('[name+locale+gameMode]')
    .between(
      [groupNames ? groupNames[0] : '', locale, gameMode],
      [groupNames ? groupNames[groupNames.length - 1] + '\uffff' : '\uffff', locale, gameMode]
    );

  if (groupNames && groupNames.length > 0) {
    // Filter by specific group names if provided
    const groups = await query.toArray();
    return groups.filter((g) => groupNames.includes(g.name));
  }

  return query.toArray();
}

/**
 * Batch fetch tiles with efficient filtering
 * Uses indexes to minimize memory usage and query time
 */
export async function batchFetchTiles(
  groupIds: string[],
  options: {
    intensity?: number;
    isCustom?: number;
    limit?: number;
    offset?: number;
  } = {}
): Promise<CustomTilePull[]> {
  if (groupIds.length === 0) return [];

  // Build efficient query using indexes
  let collection = db.customTiles.where('group_id').anyOf(groupIds);

  // Apply additional filters at database level
  if (options.intensity !== undefined) {
    collection = collection.filter((tile) => tile.intensity === options.intensity);
  }

  if (options.isCustom !== undefined) {
    collection = collection.filter((tile) => tile.isCustom === options.isCustom);
  }

  // Apply pagination for large datasets
  if (options.offset !== undefined) {
    collection = collection.offset(options.offset);
  }

  if (options.limit !== undefined) {
    collection = collection.limit(options.limit);
  }

  return collection.toArray();
}

/**
 * Build group mapping context for efficient tile processing
 * Creates a single mapping that can be reused for all tiles
 */
export async function buildGroupMappingContext(
  locale: string,
  gameMode: string
): Promise<Map<string, GroupMapping>> {
  const groups = await batchFetchGroups(locale, gameMode);
  const mappings = new Map<string, GroupMapping>();

  for (const group of groups) {
    const intensityMap = new Map(group.intensities.map((i) => [i.value, i]));

    mappings.set(group.name, {
      groupId: group.id,
      groupName: group.name,
      intensities: intensityMap,
      isDefault: group.isDefault || false,
    });
  }

  return mappings;
}

/**
 * Efficient conflict detection using database-level operations
 * Only loads necessary data for comparison
 */
export async function detectTileConflicts(
  groupId: string,
  tiles: Array<{ action: string; intensity: number }>
): Promise<Set<string>> {
  if (tiles.length === 0) return new Set();

  // Note: Each tile has unique identifier: intensity:action within a group

  // Use compound index for efficient lookup
  const existingTiles = await db.customTiles
    .where('[group_id+intensity+action]')
    .anyOf(tiles.map((t) => [groupId, t.intensity, t.action]))
    .toArray();

  // Return set of existing tile identifiers
  return new Set(existingTiles.map((t) => `${t.intensity}:${t.action}`));
}

/**
 * Batch insert groups with transaction support
 * Ensures consistency and optimal performance
 */
export async function batchInsertGroups(
  groups: Omit<CustomGroupPull, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<{ inserted: number; failed: string[] }> {
  const inserted: string[] = [];
  const failed: string[] = [];

  await db.transaction('rw', db.customGroups, async () => {
    for (const group of groups) {
      try {
        const id = await db.customGroups.add(group as any);
        inserted.push(id);
      } catch {
        failed.push(group.name);
      }
    }
  });

  return {
    inserted: inserted.length,
    failed,
  };
}

/**
 * Batch insert tiles with chunking for large datasets
 * Processes tiles in chunks to prevent memory issues
 */
export async function batchInsertTiles(
  tiles: Omit<CustomTilePull, 'id'>[],
  chunkSize = 100
): Promise<{ inserted: number; failed: number }> {
  let totalInserted = 0;
  let totalFailed = 0;

  // Process tiles in chunks to prevent memory overload
  for (let i = 0; i < tiles.length; i += chunkSize) {
    const chunk = tiles.slice(i, i + chunkSize);

    await db.transaction('rw', db.customTiles, async () => {
      try {
        const insertedCount = await db.customTiles.bulkAdd(chunk as any[]);
        totalInserted += insertedCount;
      } catch {
        // Try individual inserts on bulk failure
        for (const tile of chunk) {
          try {
            await db.customTiles.add(tile as any);
            totalInserted++;
          } catch {
            totalFailed++;
          }
        }
      }
    });
  }

  return {
    inserted: totalInserted,
    failed: totalFailed,
  };
}

/**
 * Stream tiles for export with pagination
 * Prevents loading entire dataset into memory
 */
export async function* streamTilesForExport(
  groupIds: string[],
  batchSize = 100
): AsyncGenerator<CustomTilePull[], void, unknown> {
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const batch = await batchFetchTiles(groupIds, {
      isCustom: 1,
      limit: batchSize,
      offset,
    });

    if (batch.length > 0) {
      yield batch;
      offset += batch.length;
      hasMore = batch.length === batchSize;
    } else {
      hasMore = false;
    }
  }
}

/**
 * Get tile statistics without loading all data
 * Uses database aggregation for efficiency
 */
export async function getTileStatistics(
  groupIds: string[]
): Promise<{ total: number; byGroup: Map<string, number> }> {
  const byGroup = new Map<string, number>();
  let total = 0;

  for (const groupId of groupIds) {
    const count = await db.customTiles.where('group_id').equals(groupId).count();

    byGroup.set(groupId, count);
    total += count;
  }

  return { total, byGroup };
}

/**
 * Clear cache and optimize database after large operations
 */
export async function optimizeDatabase(): Promise<void> {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  // Clear any internal Dexie caches
  // Note: Dexie doesn't expose direct cache clearing,
  // but closing and reopening can help
  await db.close();
  await db.open();
}

/**
 * Create database indexes for optimal performance
 * Should be called during initialization
 */
export async function ensureOptimalIndexes(): Promise<void> {
  // Indexes are defined in the schema (store.ts)
  // This function can be used for future index optimization
  // or runtime index analysis

  // Check if indexes are being used effectively for large datasets
  const tileCount = await db.customTiles.count();

  if (tileCount > 10000) {
    console.info('Large dataset detected. Ensure indexes are optimized for:');
    console.info('- customTiles: group_id, [group_id+intensity+action]');
    console.info('- customGroups: [name+locale+gameMode]');
  }
}
