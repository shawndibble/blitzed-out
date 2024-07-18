import db from './store';

const { customTiles } = db;

export const importCustomTiles = async (record) => {
  const recordData = record.map((tile) => ({ ...tile, isEnabled: 1 }));
  return await customTiles.bulkAdd(recordData);
};

export const getCustomTiles = () => {
  return customTiles.toArray();
};

export const getActiveTiles = () => {
  return customTiles.where('isEnabled').equals(1).toArray();
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
