import { createSyncMiddleware } from '@/services/syncMiddleware';
import Dexie, { type EntityTable } from 'dexie';
import { CustomTilePull, DisabledDefault } from '@/types/customTiles';
import { DBGameBoard } from '@/types/gameBoard';
import { CustomGroupPull } from '@/types/customGroups';
import {
  DBLocalPlayerSession,
  DBLocalPlayerMove,
  DBLocalPlayerStats,
  GlobalPlayerStats,
} from '@/types/localPlayerDB';

class BlitzedOutDatabase extends Dexie {
  customTiles!: EntityTable<CustomTilePull, 'id'>;
  gameBoard!: EntityTable<DBGameBoard, 'id'>;
  customGroups!: EntityTable<CustomGroupPull, 'id'>;
  disabledDefaults!: EntityTable<DisabledDefault, 'key'>;
  localPlayerSessions!: EntityTable<DBLocalPlayerSession, 'id'>;
  localPlayerMoves!: EntityTable<DBLocalPlayerMove, 'id'>;
  localPlayerStats!: EntityTable<DBLocalPlayerStats, 'id'>;
  globalPlayerStats!: EntityTable<GlobalPlayerStats, 'id'>;

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

    // Version 2: Add global player stats table for statistics dashboard
    this.version(2).stores({
      customTiles:
        '++id, group_id, [group_id+intensity+action], intensity, action, isEnabled, tags, isCustom',
      gameBoard: '++id, title, tiles, tags, gameMode, isActive',
      customGroups:
        '++id, name, label, locale, gameMode, isDefault, createdAt, [name+locale+gameMode]',
      localPlayerSessions: '++id, sessionId, roomId, isActive, createdAt, updatedAt',
      localPlayerMoves: '++id, sessionId, playerId, timestamp, sequence',
      localPlayerStats: '++id, sessionId, playerId, lastActive',
      globalPlayerStats: '++id, ownerId, lastActive',
    });

    // Version 3:
    //  - Content-pack provenance: index `packId` on tiles + groups; new
    //    `packSubscriptions` table for subscribed packs.
    //  - Disabled defaults become first-class records in their own table,
    //    keyed by the content tuple with a tombstone flag + updatedAt so
    //    re-enables propagate across devices and survive default re-seeds.
    this.version(3)
      .stores({
        customTiles:
          '++id, group_id, [group_id+intensity+action], intensity, action, isEnabled, tags, isCustom, packId',
        gameBoard: '++id, title, tiles, tags, gameMode, isActive',
        customGroups:
          '++id, name, label, locale, gameMode, isDefault, createdAt, [name+locale+gameMode], packId',
        disabledDefaults: '&key, group_id, intensity, action, updatedAt',
        packSubscriptions: '++id, packId, packVersion, subscribedAt, updatedAt',
        localPlayerSessions: '++id, sessionId, roomId, isActive, createdAt, updatedAt',
        localPlayerMoves: '++id, sessionId, playerId, timestamp, sequence',
        localPlayerStats: '++id, sessionId, playerId, lastActive',
        globalPlayerStats: '++id, ownerId, lastActive',
      })
      .upgrade(async (tx) => {
        // Seed the new table from existing disabled default rows. Don't touch the
        // rows themselves — they're already `isEnabled: 0` (correct locally), and
        // writing them would restamp their `updatedAt` via the updating hook.
        const now = Date.now();
        const disabledRows = await tx
          .table('customTiles')
          .filter((t: CustomTilePull) => t.isCustom === 0 && Number(t.isEnabled) === 0)
          .toArray();

        const records: DisabledDefault[] = disabledRows.map((t: CustomTilePull) => ({
          key: `${t.group_id}|${t.intensity}|${t.action}`,
          group_id: t.group_id,
          intensity: t.intensity,
          action: t.action,
          active: true,
          updatedAt: now,
        }));

        if (records.length > 0) {
          await tx.table('disabledDefaults').bulkPut(records);
        }
      });

    // Version 4: Copy-only content packs. Drop the `packSubscriptions` table —
    // the subscribe/update model is removed; imports are now one-time copies.
    // Keep the `packId` indexes on tiles/groups (still used for attribution +
    // re-import dedupe).
    this.version(4).stores({
      packSubscriptions: null,
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
      'disabledDefaults',
      'localPlayerSessions',
      'localPlayerMoves',
      'localPlayerStats',
      'globalPlayerStats',
    ],
  })
);

export default db;
