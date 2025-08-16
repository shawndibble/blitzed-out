import i18next from 'i18next';
import db from './store';
import { CustomTile, CustomTilePull } from '@/types/customTiles';
import { CustomTileFilters, PaginatedResult } from '@/types/dexieTypes';
import { Collection, Table } from 'dexie';
import { retryOnCursorError } from '@/utils/dbRecovery';

const { customTiles } = db;

// Index the customTiles table by locale, gameMode, and isCustom for faster queries
customTiles.hook(
  'creating',
  function (this: any, _primKey: number | undefined, obj: CustomTile, _transaction: any) {
    if (obj.locale === undefined) obj.locale = 'en';
    if (obj.gameMode === undefined) obj.gameMode = 'online';
    if (obj.isCustom === undefined) obj.isCustom = 1;
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
  const possibleFilters = ['locale', 'gameMode', 'group', 'intensity', 'tag', 'isCustom', 'action'];
  let query: Collection<CustomTilePull, number | undefined> = (
    customTiles as Table<CustomTilePull, number>
  ).toCollection();

  const filtersArray = Object.entries(filters).filter(([key]) => possibleFilters.includes(key));

  filtersArray.forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (key === 'tag') {
      query = query.filter((tile) => tile.tags.includes(value as string));
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
    const migrationInProgress = localStorage.getItem('blitzed-out-migration-in-progress');
    if (migrationInProgress) {
      const migrationData = JSON.parse(migrationInProgress);
      const migrationAge = Date.now() - new Date(migrationData.startedAt).getTime();

      // If migration is recent (less than 30 seconds), wait for it to complete
      if (migrationAge < 30000) {
        let waitCount = 0;
        const maxWait = 60; // Maximum 3 seconds wait (60 * 50ms)

        while (localStorage.getItem('blitzed-out-migration-in-progress') && waitCount < maxWait) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          waitCount++;
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
 * Helper function to create a base query for tiles by locale and gameMode
 */
const createBaseTileQuery = (locale = 'en', gameMode = 'online') => {
  return customTiles
    .where('locale')
    .equals(locale)
    .and((tile) => tile.gameMode === gameMode);
};

/**
 * Get tile counts and intensity distributions by group (without labels)
 * This should be merged with group definitions from customGroups table
 */
export const getTileCountsByGroup = async (
  locale = 'en',
  gameMode = 'online',
  tags: string[] | string | null = null
): Promise<Record<string, { count: number; intensities: Record<number, number> }>> => {
  // Get tiles with count of items in each group
  let query = createBaseTileQuery(locale, gameMode);

  if (tags) {
    query = query.and((tile) => tile.tags.some((tag) => tags.includes(tag)));
  }

  const allTiles = await query.toArray();

  return allTiles.reduce<Record<string, { count: number; intensities: Record<number, number> }>>(
    (groups, tile) => {
      const group = tile.group;
      if (!groups[group]) {
        groups[group] = {
          count: 0,
          intensities: {},
        };
      }
      groups[group].count++;

      const intensity = Number(tile.intensity);
      if (!groups[group].intensities[intensity]) {
        groups[group].intensities[intensity] = 0;
      }
      groups[group].intensities[intensity]++;

      return groups;
    },
    {}
  );
};

export const getActiveTiles = (gameMode: string | null = null): Promise<CustomTilePull[]> => {
  const currentLocale = i18next.resolvedLanguage || i18next.language || 'en';

  let tiles = customTiles
    .where('locale')
    .equals(currentLocale)
    .and((tile) => tile.isEnabled === 1);

  if (gameMode) {
    tiles = tiles.and((tile) => tile.gameMode === gameMode);
  }

  return tiles.toArray();
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
  if (!tile) throw new Error(`Custom tile with id ${id} not found`);

  return await customTiles.update(id, {
    isEnabled: !tile.isEnabled ? 1 : 0,
  });
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
 * Helper function to create a query for tiles by group, locale, and gameMode
 */
const createTilesByGroupQuery = (groupName: string, locale = 'en', gameMode = 'online') => {
  return createBaseTileQuery(locale, gameMode).and((tile) => tile.group === groupName);
};

/**
 * Count custom tiles that belong to a specific group
 */
export const countTilesByGroup = async (
  groupName: string,
  locale = 'en',
  gameMode = 'online'
): Promise<number> => {
  try {
    return await createTilesByGroupQuery(groupName, locale, gameMode).count();
  } catch (error) {
    console.error('Error counting tiles by group:', error);
    return 0;
  }
};

/**
 * Delete all custom tiles that belong to a specific group
 */
export const deleteCustomTilesByGroup = async (
  groupName: string,
  locale = 'en',
  gameMode = 'online'
): Promise<number> => {
  try {
    return await createTilesByGroupQuery(groupName, locale, gameMode).delete();
  } catch (error) {
    console.error('Error deleting tiles by group:', error);
    return 0;
  }
};
