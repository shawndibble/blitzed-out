import { createSyncMiddleware } from '@/services/syncMiddleware';
import Dexie, { type EntityTable } from 'dexie';
import { CustomTilePull } from '@/types/customTiles';
import { DBGameBoard } from '@/types/gameBoard';
import { CustomGroupPull } from '@/types/customGroups';

class BlitzedOutDatabase extends Dexie {
  customTiles!: EntityTable<CustomTilePull, 'id'>;
  gameBoard!: EntityTable<DBGameBoard, 'id'>;
  customGroups!: EntityTable<CustomGroupPull, 'id'>;

  constructor() {
    super('blitzedOut');

    // Version 2: Original schema
    this.version(2).stores({
      customTiles: '++id, group, intensity, action, isEnabled, tags, gameMode, isCustom, locale',
      gameBoard: '++id, title, tiles, tags, gameMode, isActive',
    });

    // Version 3: Add custom groups table
    this.version(3).stores({
      customTiles: '++id, group, intensity, action, isEnabled, tags, gameMode, isCustom, locale',
      gameBoard: '++id, title, tiles, tags, gameMode, isActive',
      customGroups: '++id, name, label, locale, gameMode, isDefault, createdAt',
    });

    // Version 4: Add unique constraint on custom groups
    this.version(4)
      .stores({
        customTiles: '++id, group, intensity, action, isEnabled, tags, gameMode, isCustom, locale',
        gameBoard: '++id, title, tiles, tags, gameMode, isActive',
        customGroups:
          '++id, name, label, locale, gameMode, isDefault, createdAt, [name+locale+gameMode]',
      })
      .upgrade(async (trans) => {
        // Remove duplicates during upgrade
        const groups = await trans.table('customGroups').toArray();
        const seen = new Set<string>();

        for (const group of groups) {
          const key = `${group.name}-${group.locale}-${group.gameMode}`;
          if (seen.has(key)) {
            // Delete duplicate
            await trans.table('customGroups').delete(group.id);
          } else {
            seen.add(key);
          }
        }
      });
  }
}

const db = new BlitzedOutDatabase();

db.use(
  createSyncMiddleware({
    tables: ['customTiles', 'gameBoard', 'customGroups'],
  })
);

export default db;
