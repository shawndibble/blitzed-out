/**
 * Disabled defaults synchronization logic
 */
import { SyncBase } from './base';
import { resetDisabledDefaults, applyDisabledDefaults } from '../syncService';
import { getTiles } from '@/stores/customTiles';
import type { SyncResult } from '@/types/sync';

const disabledKey = (tile: { group_id?: string; intensity: number; action: string }): string =>
  `${tile.group_id}|${tile.intensity}|${tile.action}`;

export class DisabledDefaultsSync extends SyncBase {
  /**
   * Returns true when the local disabled-default set already matches the remote
   * one, so we can skip the reset+apply churn (and its echo push) entirely.
   */
  private static async matchesLocal(disabledDefaults: any[]): Promise<boolean> {
    const localDisabled = await getTiles({ isCustom: 0, isEnabled: 0 });
    if (localDisabled.length !== disabledDefaults.length) return false;
    const localKeys = new Set(localDisabled.map(disabledKey));
    return disabledDefaults.every((tile) => localKeys.has(disabledKey(tile)));
  }

  /**
   * Sync disabled defaults from Firebase
   */
  static async syncFromFirebase(disabledDefaults: any[]): Promise<SyncResult> {
    try {
      // No-op when nothing would change — avoids rewriting isEnabled flags on
      // every sync run for users who have disabled default tiles.
      if (await this.matchesLocal(disabledDefaults)) {
        return this.createSuccessResult(0);
      }

      if (!disabledDefaults || disabledDefaults.length === 0) {
        // Still reset any existing disabled defaults to clean state
        await resetDisabledDefaults();
        return this.createSuccessResult(0);
      }

      // Add validation to prevent applying excessive disabled defaults
      const MAX_REASONABLE_DISABLED_DEFAULTS = 100;
      if (disabledDefaults.length > MAX_REASONABLE_DISABLED_DEFAULTS) {
        console.warn(
          `⚠️ Firebase contains ${disabledDefaults.length} disabled defaults, which seems excessive.`
        );
        console.warn('Skipping disabled defaults sync to prevent data corruption.');

        // Don't apply the disabled defaults but don't fail the sync either
        return this.createSuccessResult(0);
      }

      await resetDisabledDefaults();

      // Add sync delay
      await this.addSyncDelay();

      await applyDisabledDefaults(disabledDefaults);

      return this.createSuccessResult(disabledDefaults.length);
    } catch (error) {
      return this.handleSyncError('disabled defaults sync', error);
    }
  }
}
