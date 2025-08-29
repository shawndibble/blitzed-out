import i18next from 'i18next';
import db from './store';
import { CustomTile, CustomTilePull } from '@/types/customTiles';
import { CustomTileFilters, PaginatedResult } from '@/types/dexieTypes';
import { Collection, Table } from 'dexie';
import { retryOnCursorError } from '@/utils/dbRecovery';
import { MIGRATION_IN_PROGRESS_KEY, MIGRATION_TIMEOUT } from '@/services/migration/constants';

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
  }
);

export const importCustomTiles = async (
  record: Partial<CustomTile>[]
): Promise<number | undefined> => {
  const recordData = record.map((tile) => ({ ...tile, isEnabled: 1 }));
  return await customTiles.bulkAdd(recordData as CustomTile[]);
};

// Helper function to create and filter the query
const createFilteredQuery = (filters: Partial<CustomTileFilters>) => {
  const possibleFilters = [
    'locale',
    'gameMode',
    'group',
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
    } else if (key === 'group') {
      // Map 'group' filter to 'group_id' field
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

export const getTiles = async (
  filters: Omit<CustomTileFilters, 'page' | 'limit' | 'paginated'> = {}
): Promise<CustomTilePull[]> => {
  try {
    // Check if migration is in progress and wait if necessary
    if (typeof window !== 'undefined') {
      const migrationInProgress = localStorage.getItem(MIGRATION_IN_PROGRESS_KEY);
      if (migrationInProgress) {
        try {
          const migrationData = JSON.parse(migrationInProgress);
          const migrationAge = Date.now() - new Date(migrationData.startedAt).getTime();

          // If migration is recent (less than timeout), wait for it to complete
          if (migrationAge < MIGRATION_TIMEOUT) {
            let waitCount = 0;
            const maxWait = Math.ceil(MIGRATION_TIMEOUT / 50); // Maximum wait based on timeout (600 iterations for 30s)

            while (localStorage.getItem(MIGRATION_IN_PROGRESS_KEY) && waitCount < maxWait) {
              await new Promise((resolve) => setTimeout(resolve, 50));
              waitCount++;
            }
          }
        } catch {
          // Ignore JSON parse errors and continue
        }
      }
    }

    return await retryOnCursorError(
      db,
      async () => {
        const query = createFilteredQuery(filters);
        return await query.toArray();
      },
      (message: string, error?: Error) => {
        console.error(`Error in getTiles: ${message}`, error);
      }
    );
  } catch (error) {
    console.error('Final error in getTiles:', error);
    return [];
  }
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

/**
 * Get tile counts and intensity distributions by group (without labels)
 * This should be merged with group definitions from customGroups table
 * Optimized: filters by relevant group IDs first instead of loading all tiles
 */
export const getTileCountsByGroup = async (
  locale = 'en',
  gameMode = 'online',
  tags: string[] | string | null = null
): Promise<Record<string, { count: number; intensities: Record<number, number> }>> => {
  try {
    // Step 1: Get relevant group IDs first (much smaller dataset - ~15-20 groups vs 4000+ tiles)
    const { getCustomGroups } = await import('./customGroups');
    const relevantGroups = await getCustomGroups({ locale, gameMode });
    const groupIds = new Set(relevantGroups.map((group) => group.id));

    if (groupIds.size === 0) {
      return {};
    }

    // Step 2: Only get tiles that belong to these specific groups
    let relevantTiles: any[] = [];
    for (const groupId of groupIds) {
      const tilesInGroup = await customTiles.where('group_id').equals(groupId).toArray();
      relevantTiles.push(...tilesInGroup);
    }

    // Step 3: Apply tag filtering if specified
    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : [tags];
      relevantTiles = relevantTiles.filter((tile) =>
        tile.tags.some((tag: string) => tagsArray.includes(tag))
      );
    }

    // Step 4: Build the counts using group IDs as keys
    return relevantTiles.reduce<
      Record<string, { count: number; intensities: Record<number, number> }>
    >((groups, tile) => {
      const groupKey = tile.group_id;
      if (!groups[groupKey]) {
        groups[groupKey] = {
          count: 0,
          intensities: {},
        };
      }
      groups[groupKey].count++;

      const intensity = Number(tile.intensity);
      if (!groups[groupKey].intensities[intensity]) {
        groups[groupKey].intensities[intensity] = 0;
      }
      groups[groupKey].intensities[intensity]++;

      return groups;
    }, {});
  } catch (error) {
    console.error('Error in getTileCountsByGroup:', error);
    return {};
  }
};

export const getActiveTiles = async (
  gameMode: string | null = null,
  locale: string | null = null
): Promise<CustomTilePull[]> => {
  const currentLocale = locale || i18next.resolvedLanguage || i18next.language || 'en';

  // Get all enabled tiles first
  const allEnabledTiles = await customTiles.where('isEnabled').equals(1).toArray();

  // If we need to filter by gameMode or locale, we need to join with groups
  if (gameMode || locale) {
    const { getCustomGroups } = await import('./customGroups');
    const groupsQuery: any = {};
    if (gameMode) groupsQuery.gameMode = gameMode;
    if (locale) groupsQuery.locale = currentLocale;

    const matchingGroups = await getCustomGroups(groupsQuery);
    const groupIds = new Set(matchingGroups.map((group) => group.id));

    return allEnabledTiles.filter((tile) => tile.group_id && groupIds.has(tile.group_id));
  }

  return allEnabledTiles;
};

export const addCustomTile = async (record: Partial<CustomTile>): Promise<number | undefined> => {
  return await customTiles.add({
    ...record,
    isEnabled: 1,
  } as CustomTile);
};

export const updateCustomTile = async (
  id: number,
  record: Partial<CustomTile>
): Promise<number> => {
  return await customTiles.update(id, record);
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
 * Count custom tiles that belong to a specific group
 * @deprecated Use countTilesByGroupId instead for better performance
 */
export const countTilesByGroup = async (
  groupName: string,
  locale = 'en',
  gameMode = 'online'
): Promise<number> => {
  try {
    // Since we need to work with group names, look up the group first
    const { getCustomGroupByName } = await import('./customGroups');
    const group = await getCustomGroupByName(groupName, locale, gameMode);
    if (!group) return 0;

    return await countTilesByGroupId(group.id, locale, gameMode);
  } catch (error) {
    console.error('Error counting tiles by group:', error);
    return 0;
  }
};

/**
 * Delete all custom tiles that belong to a specific group
 * @deprecated Use deleteCustomTilesByGroupId instead for better performance
 */
export const deleteCustomTilesByGroup = async (
  groupName: string,
  locale = 'en',
  gameMode = 'online'
): Promise<number> => {
  try {
    // Since we need to work with group names, look up the group first
    const { getCustomGroupByName } = await import('./customGroups');
    const group = await getCustomGroupByName(groupName, locale, gameMode);
    if (!group) return 0;

    return await deleteCustomTilesByGroupId(group.id, locale, gameMode);
  } catch (error) {
    console.error('Error deleting tiles by group:', error);
    return 0;
  }
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

/**
 * NEW: Delete tiles by group ID (normalized approach with cascading)
 */
export const deleteCustomTilesByGroupId = async (
  groupId: string,
  _locale = 'en',
  _gameMode = 'online'
): Promise<number> => {
  try {
    return await customTiles.where('group_id').equals(groupId).delete();
  } catch (error) {
    console.error('Error deleting tiles by group ID:', error);
    return 0;
  }
};

/**
 * NEW: Get tiles with group information joined (efficient normalized query)
 * Returns tiles with their associated group data
 */
export const getTilesWithGroups = async (
  filters: Omit<CustomTileFilters, 'page' | 'limit' | 'paginated'> = {}
): Promise<Array<CustomTilePull & { groupData?: any }>> => {
  try {
    const { getCustomGroups } = await import('./customGroups');

    // Get tiles using existing filtering
    const tiles = await getTiles(filters);

    // Get all relevant groups for this locale/gameMode
    const groups = await getCustomGroups({
      locale: filters.locale,
      gameMode: filters.gameMode,
    });

    // Create group lookup map
    const groupMap = new Map(groups.map((g) => [g.id, g]));

    // Join tiles with their group data
    return tiles.map((tile) => ({
      ...tile,
      groupData: tile.group_id ? groupMap.get(tile.group_id) : null,
    }));
  } catch (error) {
    console.error('Error in getTilesWithGroups:', error);
    return [];
  }
};
