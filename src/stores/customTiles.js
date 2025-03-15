import i18n from '@/i18n';
import db from './store';

const { customTiles } = db;

// Index the customTiles table by locale, gameMode, and isCustom for faster queries
customTiles.hook('creating', function (primKey, obj) {
  if (obj.locale === undefined) obj.locale = 'en';
  if (obj.gameMode === undefined) obj.gameMode = 'online';
  if (obj.isCustom === undefined) obj.isCustom = 1;
  return undefined;
});

export const importCustomTiles = async (record) => {
  const recordData = record.map((tile) => ({ ...tile, isEnabled: 1 }));
  return await customTiles.bulkAdd(recordData);
};

export const getTiles = async (filters = {}) => {
  const { page = 1, limit = 50, paginated = false } = filters;
  const possibleFilters = ['locale', 'gameMode', 'group', 'intensity', 'tag', 'isCustom', 'action'];

  try {
    let query = customTiles;
    let useAnd = false;
    const filtersArray = Object.entries(filters).filter(([key]) => possibleFilters.includes(key));

    filtersArray.forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return; // Skip empty or null values (ignores filters with no value)

      // Special handling for tag filter since it's an array field
      if (key === 'tag') {
        if (!useAnd) {
          query = query.filter((tile) => tile.tags.includes(value));
          useAnd = true;
        } else {
          query = query.and((tile) => tile.tags.includes(value));
        }
      } else {
        // Normal handling for other filters
        if (!useAnd) {
          query = query.where(key).equals(value);
          useAnd = true;
        } else {
          query = query.and((tile) => tile[key] === value);
        }
      }
    });

    // If pagination is not requested, return all items as an array
    if (!paginated) {
      const items = await query.toArray();
      return items;
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

export const getCustomTileGroups = async (locale = 'en', gameMode = 'online', tags = null) => {
  // Get unique groups with count of items in each group
  let query = customTiles
    .where('locale')
    .equals(locale)
    .and((tile) => tile.gameMode === gameMode);

  if (tags) {
    query = query.and((tile) => tile.tags.some((tag) => tags.includes(tag)));
  }

  const allTiles = await query.toArray();

  return allTiles.reduce((groups, tile) => {
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

export const getActiveTiles = (gameMode = null) => {
  const currentLocale = i18n.resolvedLanguage || i18n.language || 'en';

  let tiles = customTiles
    .where('locale')
    .equals(currentLocale)
    .and((tile) => tile.isEnabled === 1);

  if (gameMode) {
    tiles = tiles.and((tile) => tile.gameMode === gameMode);
  }

  return tiles.toArray();
};

export const addCustomTile = async (record) => {
  return await customTiles.add({
    ...record,
    isEnabled: 1,
  });
};

export const updateCustomTile = async (id, record) => {
  return await customTiles.update(id, record);
};

export const toggleCustomTile = async (id) => {
  const tile = await customTiles.get(id);
  return await customTiles.update(id, {
    isEnabled: !tile.isEnabled ? 1 : 0,
  });
};

export async function deleteAllIsCustomTiles() {
  try {
    await db.customTiles.where('isCustom').equals(1).delete();
    return true;
  } catch (error) {
    console.error('Error deleting custom tiles:', error);
    return false;
  }
}

export const deleteCustomTile = async (id) => {
  return await customTiles.delete(id);
};
