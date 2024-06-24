import Dexie from 'dexie';

export const db = new Dexie('blitzedOut');
db.version(1).stores({
  customTiles: '++id, group, intensity, action, isEnabled, tags',
});

export const importCustomTiles = async (record) => {
  const recordData = record.map((tile) => ({ ...tile, isEnabled: 1 }));
  return await db.customTiles.bulkAdd(recordData);
};

export const getCustomTiles = () => {
  return db.customTiles.toArray();
};

export const getActiveTiles = () => {
  return db.customTiles.where('isEnabled').equals(1).toArray();
};

export const addCustomTile = async (record) => {
  return await db.customTiles.add({
    ...record,
    isEnabled: 1,
  });
};

export const updateCustomTile = async (id, record) => {
  return await db.customTiles.update(id, record);
};

export const toggleCustomTile = async (id) => {
  const tile = await db.customTiles.get(id);
  return await db.customTiles.update(id, {
    isEnabled: !tile.isEnabled ? 1 : 0,
  });
};

export const deleteCustomTile = async (id) => {
  return await db.customTiles.delete(id);
};
