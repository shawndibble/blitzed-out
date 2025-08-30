import { createSyncMiddleware } from '@/services/syncMiddleware';
import Dexie, { type EntityTable } from 'dexie';
import { CustomTilePull } from '@/types/customTiles';
import { DBGameBoard } from '@/types/gameBoard';
import { CustomGroupPull } from '@/types/customGroups';
import { DBLocalPlayerSession, DBLocalPlayerMove, DBLocalPlayerStats } from '@/types/localPlayerDB';

class BlitzedOutDatabase extends Dexie {
  customTiles!: EntityTable<CustomTilePull, 'id'>;
  gameBoard!: EntityTable<DBGameBoard, 'id'>;
  customGroups!: EntityTable<CustomGroupPull, 'id'>;
  localPlayerSessions!: EntityTable<DBLocalPlayerSession, 'id'>;
  localPlayerMoves!: EntityTable<DBLocalPlayerMove, 'id'>;
  localPlayerStats!: EntityTable<DBLocalPlayerStats, 'id'>;

  constructor() {
    super('blitzedOut');

    // Version 1: Modern normalized schema with group_id relationships
    this.version(1).stores({
      customTiles:
        '++id, group_id, [group_id+intensity+action], intensity, action, isEnabled, tags, isCustom',
      gameBoard: '++id, title, tiles, tags, gameMode, isActive',
      customGroups:
        '++id, name, label, locale, gameMode, isDefault, createdAt, [name+locale+gameMode]',
      localPlayerSessions: '++id, sessionId, roomId, isActive, createdAt, updatedAt',
      localPlayerMoves: '++id, sessionId, playerId, timestamp, sequence',
      localPlayerStats: '++id, sessionId, playerId, lastActive',
    });

    // Version 2: Force database reset to clear transaction conflicts
    this.version(2)
      .stores({
        customTiles:
          '++id, group_id, [group_id+intensity+action], intensity, action, isEnabled, tags, isCustom',
        gameBoard: '++id, title, tiles, tags, gameMode, isActive',
        customGroups:
          '++id, name, label, locale, gameMode, isDefault, createdAt, [name+locale+gameMode]',
        localPlayerSessions: '++id, sessionId, roomId, isActive, createdAt, updatedAt',
        localPlayerMoves: '++id, sessionId, playerId, timestamp, sequence',
        localPlayerStats: '++id, sessionId, playerId, lastActive',
      })
      .upgrade(async (_tx) => {
        // Clear migration status to prevent conflicts
        try {
          localStorage.removeItem('blitzed-out-migration-in-progress');
          localStorage.removeItem('blitzed-out-current-language-migration');
          localStorage.removeItem('blitzed-out-background-migration-in-progress');
        } catch {
          // Ignore errors during migration status cleanup
        }

        // The upgrade will automatically handle the schema transition
      });
  }
}

const db = new BlitzedOutDatabase();

db.use(
  createSyncMiddleware({
    tables: [
      'customTiles',
      'gameBoard',
      'customGroups',
      'localPlayerSessions',
      'localPlayerMoves',
      'localPlayerStats',
    ],
  })
);

export default db;
