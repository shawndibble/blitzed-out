import Dexie from 'dexie';

const db = new Dexie('blitzedOut');

db.version(2).stores({
  customTiles:
    '++id, group, intensity, action, isEnabled, tags, gameMode, isCustom, locale',
  gameBoard: '++id, name, tiles, tags, gameMode',
});

export default db;
