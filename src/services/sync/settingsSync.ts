import { SyncBase } from './base';
import type { SyncResult } from '@/types/sync';
/**
 * Settings synchronization logic
 */
import { useSettingsStore } from '@/stores/settingsStore';

export class SettingsSync extends SyncBase {
  /**
   * Sync settings from Firebase
   */
  static async syncFromFirebase(firebaseSettings: Record<string, any>): Promise<SyncResult> {
    if (!firebaseSettings || Object.keys(firebaseSettings).length === 0) {
      return this.createSuccessResult(0);
    }

    try {
      const { updateSettings } = useSettingsStore.getState();

      // Filter out any undefined values and localPlayers (which should stay local-only)
      const cleanSettings = Object.fromEntries(
        Object.entries(firebaseSettings).filter(
          ([key, value]) => value !== undefined && key !== 'localPlayers'
        )
      );

      if (Object.keys(cleanSettings).length > 0) {
        updateSettings(cleanSettings);
        return this.createSuccessResult(Object.keys(cleanSettings).length);
      }

      return this.createSuccessResult(0);
    } catch (error) {
      return this.handleSyncError('settings sync', error);
    }
  }
}
