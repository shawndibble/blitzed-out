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

    // Version 5: Add local player tables for single-device multiplayer
    this.version(5).stores({
      customTiles: '++id, group, intensity, action, isEnabled, tags, gameMode, isCustom, locale',
      gameBoard: '++id, title, tiles, tags, gameMode, isActive',
      customGroups:
        '++id, name, label, locale, gameMode, isDefault, createdAt, [name+locale+gameMode]',
      localPlayerSessions: '++id, sessionId, roomId, isActive, createdAt, updatedAt',
      localPlayerMoves: '++id, sessionId, playerId, timestamp, sequence',
      localPlayerStats: '++id, sessionId, playerId, lastActive',
    });

    // Version 6: Add group_id foreign key to tiles for normalized relationship
    this.version(6)
      .stores({
        customTiles:
          '++id, group, group_id, intensity, action, isEnabled, tags, gameMode, isCustom, locale',
        gameBoard: '++id, title, tiles, tags, gameMode, isActive',
        customGroups:
          '++id, name, label, locale, gameMode, isDefault, createdAt, [name+locale+gameMode]',
        localPlayerSessions: '++id, sessionId, roomId, isActive, createdAt, updatedAt',
        localPlayerMoves: '++id, sessionId, playerId, timestamp, sequence',
        localPlayerStats: '++id, sessionId, playerId, lastActive',
      })
      .upgrade(async (trans) => {
        console.log('Starting migration to version 6: Adding group_id field to tiles');

        // Get all tiles and groups for migration
        const tiles = await trans.table('customTiles').toArray();
        const groups = await trans.table('customGroups').toArray();

        console.log(`Migrating ${tiles.length} tiles with ${groups.length} groups`);

        // Create lookup map of group name + gameMode + locale -> group id
        const groupMap = new Map<string, string>();
        groups.forEach((group: any) => {
          const key = `${group.name}|${group.gameMode}|${group.locale}`;
          groupMap.set(key, group.id);
        });

        // Update each tile with group_id
        let updatedCount = 0;
        let orphanedCount = 0;

        for (const tile of tiles) {
          const key = `${tile.group}|${tile.gameMode}|${tile.locale}`;
          const groupId = groupMap.get(key);

          if (groupId) {
            await trans.table('customTiles').update(tile.id, {
              group_id: groupId,
            });
            updatedCount++;
          } else {
            console.warn(
              `Orphaned tile found: ${tile.id} with group "${tile.group}" in ${tile.gameMode}/${tile.locale}`
            );
            orphanedCount++;
          }
        }

        console.log(
          `Migration complete: ${updatedCount} tiles updated, ${orphanedCount} orphaned tiles found`
        );
      });

    // Version 17: Improve group_id indexing for better query performance
    this.version(17).stores({
      customTiles:
        '++id, group, group_id, [group_id+intensity+action+gameMode+locale], intensity, action, isEnabled, tags, gameMode, isCustom, locale',
      gameBoard: '++id, title, tiles, tags, gameMode, isActive',
      customGroups:
        '++id, name, label, locale, gameMode, isDefault, createdAt, [name+locale+gameMode]',
      localPlayerSessions: '++id, sessionId, roomId, isActive, createdAt, updatedAt',
      localPlayerMoves: '++id, sessionId, playerId, timestamp, sequence',
      localPlayerStats: '++id, sessionId, playerId, lastActive',
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
