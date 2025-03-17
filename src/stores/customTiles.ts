import i18next from 'i18next';
import db from './store';
import { CustomTile } from '@/types/customTiles';
import { CustomTileFilters, CustomTileGroups, PaginatedResult } from '@/types/dexieTypes';
import { Collection, Table } from 'dexie';

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

export const getTiles = async (
  filters: CustomTileFilters = {}
): Promise<CustomTile[] | PaginatedResult<CustomTile>> => {
  const { page = 1, limit = 50, paginated = false } = filters;
  const possibleFilters = ['locale', 'gameMode', 'group', 'intensity', 'tag', 'isCustom', 'action'];

  try {
    let query: Collection<CustomTile, number | undefined> = (
      customTiles as Table<CustomTile, number>
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

    // If pagination is not requested, return all items as an array
    if (!paginated) {
      return await query.toArray();
    }

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
    console.error('Error in getTiles:', error);
    // Return empty results on error
    if (!paginated) {
      return [];
    }
    return {
      items: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }
};

export const getCustomTileGroups = async (
  locale = 'en',
  gameMode = 'online',
  tags: string[] | null = null
): Promise<CustomTileGroups> => {
  // Get unique groups with count of items in each group
  let query = customTiles
    .where('locale')
    .equals(locale)
    .and((tile) => tile.gameMode === gameMode);

  if (tags) {
    query = query.and((tile) => tile.tags.some((tag) => tags.includes(tag)));
  }

  const allTiles = await query.toArray();

  return allTiles.reduce<CustomTileGroups>((groups, tile) => {
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
  }, {});
};

export const getActiveTiles = (gameMode: string | null = null): Promise<CustomTile[]> => {
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
