/**
 * Coordinates one sync cycle: read the cloud snapshot once, run every entity
 * merge against it, then publish once if anything changed.
 *
 * The document itself belongs to `remoteUserData`; nothing here knows its field
 * names, and nothing below here writes to it.
 */
import type { SyncOptions, SyncResult } from '@/types/sync';
import type { RemoteUserData } from './remoteUserData';
import { collectLocalUserData, readRemoteUserData, writeRemoteUserData } from './remoteUserData';
import { cleanupDuplicateTiles } from './localCleanup';

import { CustomGroupExtensionsSync } from './customGroupExtensionsSync';
import { CustomGroupsSync } from './customGroupsSync';
import { CustomTilesSync } from './customTilesSync';
import { DisabledDefaultsSync } from './disabledDefaultsSync';
import { GameBoardsSync } from './gameBoardsSync';
import { SettingsSync } from './settingsSync';
import { SyncBase } from './base';

const OPERATION_NAMES = [
  'Custom Tiles',
  'Custom Groups',
  'Group Extensions',
  'Disabled Defaults',
  'Game Boards',
  'Settings',
];

export class SyncOrchestrator extends SyncBase {
  static async syncFromFirebase(options: SyncOptions = {}): Promise<boolean> {
    try {
      const user = this.getAuthenticatedUser();
      const remote = await readRemoteUserData(user.uid);

      // No cloud document yet: this device's snapshot becomes the baseline.
      if (!remote) {
        return await this.publish(user.uid, remote);
      }

      // Clean up any duplicate tiles first
      await cleanupDuplicateTiles();

      // Run all sync operations in parallel for better performance
      const results = await Promise.allSettled([
        this.syncCustomTiles(remote, options),
        this.syncCustomGroups(remote, options),
        this.syncGroupExtensions(remote),
        this.syncDisabledDefaults(remote),
        this.syncGameBoards(remote),
        this.syncSettings(remote),
      ]);

      let totalSuccess = true;
      let changed = false;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (!result.value.success) {
            totalSuccess = false;
            console.error(`❌ ${OPERATION_NAMES[index]} sync failed:`, result.value.errors);
          }
          changed = changed || Boolean(result.value.changed);
        } else {
          totalSuccess = false;
          console.error(`❌ ${OPERATION_NAMES[index]} sync rejected:`, result.reason);
        }
      });

      // One write per cycle, after every merge has settled — a mid-merge push
      // published a half-merged document and echoed back through the listener.
      if (changed && !(await this.publish(user.uid, remote))) {
        totalSuccess = false;
      }

      return totalSuccess;
    } catch (error) {
      console.error('Error in sync orchestrator:', error);
      return false;
    }
  }

  private static async publish(uid: string, remote?: RemoteUserData | null): Promise<boolean> {
    try {
      await writeRemoteUserData(uid, await collectLocalUserData(), remote);
      return true;
    } catch (error) {
      console.error('Error publishing user data:', error);
      return false;
    }
  }

  private static async syncCustomTiles(
    remote: RemoteUserData,
    options: SyncOptions
  ): Promise<SyncResult> {
    if (remote.customTiles === undefined) return this.createSuccessResult(0);

    const tiles = remote.customTiles;
    // Disabled defaults live in their own field; one here means corrupt data.
    const invalidTiles = tiles.filter((tile: any) => tile.isCustom === 0);
    if (invalidTiles.length > 0) {
      console.warn(
        `⚠️ Found ${invalidTiles.length} default tiles in customTiles field - data corruption detected`
      );
    }

    return await CustomTilesSync.syncFromFirebase(tiles, options);
  }

  private static async syncCustomGroups(
    remote: RemoteUserData,
    options: SyncOptions
  ): Promise<SyncResult> {
    if (remote.customGroups === undefined) return this.createSuccessResult(0);
    return await CustomGroupsSync.syncFromFirebase(remote.customGroups, options);
  }

  private static async syncGroupExtensions(remote: RemoteUserData): Promise<SyncResult> {
    if (remote.groupExtensions === undefined) return this.createSuccessResult(0);
    return await CustomGroupExtensionsSync.syncFromFirebase(remote.groupExtensions);
  }

  private static async syncDisabledDefaults(remote: RemoteUserData): Promise<SyncResult> {
    if (remote.disabledDefaults === undefined) return this.createSuccessResult(0);
    return await DisabledDefaultsSync.syncFromFirebase(remote.disabledDefaults);
  }

  private static async syncGameBoards(remote: RemoteUserData): Promise<SyncResult> {
    if (remote.gameBoards === undefined) return this.createSuccessResult(0);
    return await GameBoardsSync.syncFromFirebase(remote.gameBoards);
  }

  private static async syncSettings(remote: RemoteUserData): Promise<SyncResult> {
    if (remote.settings === undefined) return this.createSuccessResult(0);
    return await SettingsSync.syncFromFirebase(remote.settings);
  }
}
