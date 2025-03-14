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
  const {
    group,
    intensity,
    tag,
    locale,
    gameMode,
    page = 1,
    limit = 50,
    paginated = false,
    isCustom,
  } = filters;

  try {
    // Start with the base collection
    let query = customTiles;
    let hasWhereClause = false;

    // Apply filters in a more structured way
    if (locale) {
      query = query.where('locale').equals(locale);
      hasWhereClause = true;
    }

    if (gameMode) {
      if (hasWhereClause) {
        query = query.and((tile) => tile.gameMode === gameMode);
      } else {
        query = query.where('gameMode').equals(gameMode);
        hasWhereClause = true;
      }
    }

    if (group) {
      if (hasWhereClause) {
        query = query.and((tile) => tile.group === group);
      } else {
        query = query.where('group').equals(group);
        hasWhereClause = true;
      }
    }

    if (intensity !== undefined && intensity !== '') {
      if (hasWhereClause) {
        query = query.and((tile) => Number(tile.intensity) === Number(intensity));
      } else {
        query = query.where('intensity').equals(Number(intensity));
        hasWhereClause = true;
      }
    }

    if (isCustom !== undefined) {
      if (hasWhereClause) {
        query = query.and((tile) => tile.isCustom === isCustom);
      } else {
        query = query.where('isCustom').equals(isCustom);
        hasWhereClause = true;
      }
    }
    // If pagination is not requested, return all items as an array
    if (!paginated) {
      const items = await query.toArray();
      return tag ? items.filter((item) => item.tags?.includes(tag)) : items;
    }

    // Get total count for pagination
    const count = await query.count();

    // Apply pagination
    const offset = (page - 1) * limit;
    const items = await query.offset(offset).limit(limit).toArray();

    // Filter by tag if needed (can't be done in the query)
    const filteredItems = tag ? items.filter((item) => item.tags?.includes(tag)) : items;

    return {
      items: filteredItems,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  } catch (error) {
    console.error('Error in getCustomTiles:', error);
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

export const getCustomTileGroups = async (locale = 'en', gameMode = 'online') => {
  // Get unique groups with count of items in each group
  const allTiles = await customTiles
    .where('locale')
    .equals(locale)
    .and((tile) => tile.gameMode === gameMode)
    .toArray();

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
  let tiles = customTiles.where('isEnabled').equals(1);

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

export const deleteCustomTile = async (id) => {
  return await customTiles.delete(id);
};
