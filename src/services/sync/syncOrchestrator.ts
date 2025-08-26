import type { SyncOptions, SyncResult } from '@/types/sync';
import { cleanupDuplicateTiles, syncAllDataToFirebase } from '../syncService';

import { CustomGroupsSync } from './customGroupsSync';
/**
 * Main sync orchestrator - coordinates all sync operations
 */
import { CustomTilesSync } from './customTilesSync';
import { DisabledDefaultsSync } from './disabledDefaultsSync';
import { GameBoardsSync } from './gameBoardsSync';
import { SettingsSync } from './settingsSync';
import { SyncBase } from './base';

export class SyncOrchestrator extends SyncBase {
  /**
   * Main sync function - refactored from the original syncDataFromFirebase
   */
  static async syncFromFirebase(options: SyncOptions = {}): Promise<boolean> {
    try {
      const user = this.getAuthenticatedUser();
      const userDoc = await this.getUserDocument(user.uid);

      if (!userDoc.exists()) {
        return await syncAllDataToFirebase();
      }

      const userData = userDoc.data();

      // Clean up any duplicate tiles first
      await cleanupDuplicateTiles();

      // Run all sync operations in parallel for better performance
      const syncOperations = [
        this.syncCustomTiles(userData, options),
        this.syncCustomGroups(userData, options),
        this.syncDisabledDefaults(userData),
        this.syncGameBoards(userData),
        this.syncSettings(userData),
      ];

      const results = await Promise.allSettled(syncOperations);

      // Check if all operations succeeded
      let totalSuccess = true;

      results.forEach((result, index) => {
        const operationNames = [
          'Custom Tiles',
          'Custom Groups',
          'Disabled Defaults',
          'Game Boards',
          'Settings',
        ];

        if (result.status === 'fulfilled') {
          const syncResult = result.value;
          if (!syncResult.success) {
            totalSuccess = false;
            console.error(`❌ ${operationNames[index]} sync failed:`, syncResult.errors);
          }
        } else {
          totalSuccess = false;
          console.error(`❌ ${operationNames[index]} sync rejected:`, result.reason);
        }
      });

      return totalSuccess;
    } catch (error) {
      console.error('Error in sync orchestrator:', error);
      return false;
    }
  }

  /**
   * Sync custom tiles with error handling
   */
  private static async syncCustomTiles(userData: any, options: SyncOptions): Promise<SyncResult> {
    if (userData.customTiles !== undefined) {
      const tiles = userData.customTiles || [];

      // Check if any are actually disabled defaults (this shouldn't happen)
      const invalidTiles = tiles.filter((tile: any) => tile.isCustom === 0);
      if (invalidTiles.length > 0) {
        console.warn(
          `⚠️ Found ${invalidTiles.length} default tiles in customTiles field - data corruption detected`
        );
      }

      return await CustomTilesSync.syncFromFirebase(tiles, options);
    }
    return this.createSuccessResult(0);
  }

  /**
   * Sync custom groups with error handling
   */
  private static async syncCustomGroups(userData: any, options: SyncOptions): Promise<SyncResult> {
    if (userData.customGroups !== undefined) {
      return await CustomGroupsSync.syncFromFirebase(userData.customGroups || [], options);
    }
    return this.createSuccessResult(0);
  }

  /**
   * Sync disabled defaults with error handling
   */
  private static async syncDisabledDefaults(userData: any): Promise<SyncResult> {
    if (userData.disabledDefaults !== undefined) {
      return await DisabledDefaultsSync.syncFromFirebase(userData.disabledDefaults || []);
    }
    return this.createSuccessResult(0);
  }

  /**
   * Sync game boards with error handling
   */
  private static async syncGameBoards(userData: any): Promise<SyncResult> {
    if (userData.gameBoards !== undefined) {
      return await GameBoardsSync.syncFromFirebase(userData.gameBoards);
    }
    return this.createSuccessResult(0);
  }

  /**
   * Sync settings with error handling
   */
  private static async syncSettings(userData: any): Promise<SyncResult> {
    if (userData.settings !== undefined) {
      return await SettingsSync.syncFromFirebase(userData.settings || {});
    }
    return this.createSuccessResult(0);
  }
}
