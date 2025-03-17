import { createSyncMiddleware } from '@/services/syncMiddleware';
import Dexie from 'dexie';
import { CustomTile } from '@/types/customTiles';
import { GameBoard } from '@/types/gameBoard';

class BlitzedOutDatabase extends Dexie {
  customTiles!: Dexie.Table<CustomTile, number>;
  gameBoard!: Dexie.Table<GameBoard, number>;

  constructor() {
    super('blitzedOut');
    
    this.version(2).stores({
      customTiles: '++id, group, intensity, action, isEnabled, tags, gameMode, isCustom, locale',
      gameBoard: '++id, title, tiles, tags, gameMode, isActive',
    });
  }
}

const db = new BlitzedOutDatabase();

db.use(
  createSyncMiddleware({
    tables: ['customTiles', 'gameBoard'],
  })
);

export default db;
