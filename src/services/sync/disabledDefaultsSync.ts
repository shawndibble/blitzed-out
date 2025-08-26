/**
 * Disabled defaults synchronization logic
 */
import { SyncBase } from './base';
import { resetDisabledDefaults, applyDisabledDefaults } from '../syncService';
import type { SyncResult } from '@/types/sync';

export class DisabledDefaultsSync extends SyncBase {
  /**
   * Sync disabled defaults from Firebase
   */
  static async syncFromFirebase(disabledDefaults: any[]): Promise<SyncResult> {
    try {
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
