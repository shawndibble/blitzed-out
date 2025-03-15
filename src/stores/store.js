import { createSyncMiddleware } from '@/services/syncMiddleware';
import Dexie from 'dexie';

const db = new Dexie('blitzedOut');

db.version(2).stores({
  customTiles: '++id, group, intensity, action, isEnabled, tags, gameMode, isCustom, locale',
  gameBoard: '++id, title, tiles, tags, gameMode, isActive',
});

db.use(
  createSyncMiddleware({
    tables: ['customTiles', 'gameBoard'],
  })
);

export default db;
