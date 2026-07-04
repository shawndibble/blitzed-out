import i18next from 'i18next';
import db from './store';
import { CustomTile, CustomTilePull } from '@/types/customTiles';
import { CustomTileFilters, PaginatedResult } from '@/types/dexieTypes';
import { Collection, Table } from 'dexie';
import { retryOnCursorError } from '@/utils/dbRecovery';
import { waitForContentReady } from '@/services/migration/contentReadiness';
import { normalizePlaceholders } from '@/services/placeholderAliasService';

const { customTiles } = db;

// Index the customTiles table by isCustom for faster queries
customTiles.hook(
  'creating',
  function (this: any, _primKey: number | undefined, obj: CustomTile, _transaction: any) {
    // Set default values
    if (obj.isCustom === undefined) obj.isCustom = 1;

    // For sync operations, group_id is required. For initial setup and default tile imports,
    // we allow tiles without group_id temporarily but log a warning for monitoring
    if (!obj.group_id || !obj.group_id.trim()) {
      // Only enforce group_id for custom tiles (isCustom: 1) during sync operations
      // Default tiles from JSON imports (isCustom: 0) can be imported without group_id initially
      if (obj.isCustom === 1) {
        console.warn(
          `Custom tile missing group_id (sync may fail): ${obj.action} (group_id: ${obj.group_id})`
        );
      }
    }

    // Stamp last-writer-wins timestamp. Sync inserts carry the remote timestamp;
    // preserve it so the just-pulled tile doesn't look newer than the source.
    if ((obj as any).updatedAt === undefined) (obj as any).updatedAt = Date.now();
  }
);

// Bump the last-writer-wins timestamp on every update, unless the caller
// (the sync engine applying a remote change) supplied an explicit timestamp.
customTiles.hook('updating', function (this: any, modifications: any) {
  if (modifications && !('updatedAt' in modifications)) {
    return { updatedAt: Date.now() };
  }
});

/**
 * Storage invariant: tile actions hold canonical English placeholder tokens
 * only (see placeholderAliasService). Enforced at every Dexie write path —
 * dialogs, pack import, file import, bulk paste import, cloud sync — and
 * idempotent on already-canonical text. Exported so identity-sensitive flows
 * (sync matching, import dedup) can canonicalize the incoming side before
 * comparing against stored (canonical) tiles.
 */
export const canonicalizeTileAction = <T extends Partial<CustomTile>>(record: T): T => {
  if (typeof record.action !== 'string' || !record.action) return record;
  const locale = i18next.resolvedLanguage || i18next.language || 'en';
  return { ...record, action: normalizePlaceholders(record.action, locale) };
};

export const importCustomTiles = async (
  record: Partial<CustomTile>[]
): Promise<number | undefined> => {
  // Strip any incoming id: customTiles uses a local ++id autoincrement, so a foreign
  // id (from another device's import) would collide arbitrarily. Let Dexie assign fresh
  // local ids — same pattern the sync engine uses (removeId + add).
  const recordData = record.map(({ id: _id, ...tile }) => ({
    ...canonicalizeTileAction(tile),
    isEnabled: 1,
  }));
  return await customTiles.bulkAdd(recordData as CustomTile[]);
};

// Helper function to create and filter the query
const createFilteredQuery = (filters: Partial<CustomTileFilters>) => {
  const possibleFilters = [
    'locale',
    'gameMode',
    'group',
    'group_id', // Add group_id as a valid filter
    'intensity',
    'tag',
    'isCustom',
    'isEnabled',
    'action',
  ];
  let query: Collection<CustomTilePull, number | undefined> = (
    customTiles as Table<CustomTilePull, number>
  ).toCollection();

  const filtersArray = Object.entries(filters).filter(([key]) => possibleFilters.includes(key));

  filtersArray.forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (key === 'tag') {
      query = query.filter((tile) => tile.tags.includes(value as string));
    } else if (key === 'group' || key === 'group_id') {
      // Map both 'group' and 'group_id' filters to 'group_id' field
      query = query.filter((tile) => tile.group_id === value);
    } else if (key === 'intensity') {
      // Convert intensity filter to number for proper comparison
      const intensityNum = Number(value);
      query = query.filter((tile) => {
        return tile.intensity === intensityNum;
      });
    } else {
      query = query.filter((tile) => tile[key as keyof CustomTile] === value);
    }
  });

  return query;
};

/**
 * Unguarded query core. Seeding internals (migration importOperations) MUST
 * use this instead of getTiles: the public guard awaits content readiness,
 * and a migration awaiting itself would deadlock (previously a latent 30s
 * lock-spin inside the seeding 'rw' transaction).
 */
export const getTilesUnguarded = async (
  filters: Omit<CustomTileFilters, 'page' | 'limit' | 'paginated'> = {}
): Promise<CustomTilePull[]> => {
  try {
    return await retryOnCursorError(
      db,
      async () => {
        const query = createFilteredQuery(filters);
        return await query.toArray();
      },
      (message: string, error?: Error) => {
        console.error(`Error in getTilesUnguarded: ${message}`, error);
      }
    );
  } catch (error) {
    console.error('Final error in getTilesUnguarded:', error);
    return [];
  }
};

/**
 * UI-facing tile query. Waits for content readiness but never initiates
 * seeding (trigger: false): sync paths — a first-login cloud pull — must not
 * start seeding, and liveQuery callers fast-path synchronously once seeded.
 */
export const getTiles = async (
  filters: Omit<CustomTileFilters, 'page' | 'limit' | 'paginated'> = {}
): Promise<CustomTilePull[]> => {
  await waitForContentReady(filters.locale, { trigger: false });
  return getTilesUnguarded(filters);
};

export const getPaginatedTiles = async (
  filters: CustomTileFilters
): Promise<PaginatedResult<CustomTilePull>> => {
  const { page = 1, limit = 50 } = filters;

  try {
    const query = createFilteredQuery(filters);

    // Get total count for pagination
    const count = await query.count();

    // Apply pagination
    const offset = (page - 1) * limit;
    const items = await query.offset(offset).limit(limit).toArray();

    return {
      items: items,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  } catch (error) {
    console.error('Error in getPaginatedTiles:', error);
    return {
      items: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }
};

export const addCustomTile = async (record: Partial<CustomTile>): Promise<number | undefined> => {
  return await customTiles.add({
    ...canonicalizeTileAction(record),
    isEnabled: 1,
  } as CustomTile);
};

export const updateCustomTile = async (
  id: number,
  record: Partial<CustomTile>
): Promise<number> => {
  return await customTiles.update(id, canonicalizeTileAction(record));
};

export const toggleCustomTile = async (id: number): Promise<number> => {
  const tile = await customTiles.get(id);

  if (!tile) {
    throw new Error(`Custom tile with id ${id} not found`);
  }

  const newEnabledState = !tile.isEnabled ? 1 : 0;

  const result = await customTiles.update(id, {
    isEnabled: newEnabledState,
  });

  return result;
};

export async function deleteAllIsCustomTiles(): Promise<boolean> {
  try {
    await db.customTiles.where('isCustom').equals(1).delete();
    return true;
  } catch (error) {
    console.error('Error deleting custom tiles:', error);
    return false;
  }
}

export const deleteCustomTile = async (id: number): Promise<void> => {
  await customTiles.delete(id);
};

/**
 * NEW: Get tiles by group ID (normalized approach)
 * This uses the new group_id foreign key for better performance
 */
export const getTilesByGroupId = async (
  groupId: string,
  _locale = 'en',
  _gameMode = 'online'
): Promise<CustomTilePull[]> => {
  try {
    return await retryOnCursorError(
      db,
      async () => {
        return await customTiles.where('group_id').equals(groupId).toArray();
      },
      (message: string, error?: Error) => {
        console.error(`Error in getTilesByGroupId: ${message}`, error);
      }
    );
  } catch (error) {
    console.error('Final error in getTilesByGroupId:', error);
    return [];
  }
};
/**
 * NEW: Get tiles by multiple group IDs efficiently
 * This is the proper way to find tiles for multiple groups without locale/gameMode filtering
 */
export const getTilesByGroupIds = async (groupIds: string[]): Promise<CustomTilePull[]> => {
  try {
    if (groupIds.length === 0) {
      return [];
    }

    return await retryOnCursorError(
      db,
      async () => {
        // Use Dexie's anyOf for efficient multiple group ID lookup
        return await customTiles.where('group_id').anyOf(groupIds).toArray();
      },
      (message: string, error?: Error) => {
        console.error(`Error in getTilesByGroupIds: ${message}`, error);
      }
    );
  } catch (error) {
    console.error('Final error in getTilesByGroupIds:', error);
    return [];
  }
};

/**
 * NEW: Count tiles by group ID (normalized approach)
 */
export const countTilesByGroupId = async (
  groupId: string,
  _locale = 'en',
  _gameMode = 'online'
): Promise<number> => {
  try {
    return await customTiles.where('group_id').equals(groupId).count();
  } catch (error) {
    console.error('Error counting tiles by group ID:', error);
    return 0;
  }
};
