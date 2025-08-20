/**
 * Sync Recovery Service
 *
 * Detects and recovers from sync service data loss bug.
 * Runs on app startup to identify users with corrupted local databases
 * and trigger recovery through migration system.
 */

import { forceFreshMigration } from '@/services/migrationService';
import { getCustomGroups } from '@/stores/customGroups';
import { getTiles } from '@/stores/customTiles';
import { safeLocalStorage } from '@/services/migration/errorHandling';
import { MIGRATION_VERSION } from '@/services/migration/constants';
import { logger } from '@/utils/logger';

// Recovery tracking
const RECOVERY_STATUS_KEY = 'blitzed-out-sync-recovery-status';
const RECOVERY_VERSION = MIGRATION_VERSION;
const MIN_DEFAULT_TILE_COUNT = 50; // Should have hundreds of default actions

interface RecoveryStatus {
  version: string;
  recoveryPerformed: boolean;
  detectedCorruption: boolean;
  recoveryTimestamp: number;
}

/**
 * Main recovery function - call this on app startup
 */
export async function runSyncRecovery(): Promise<boolean> {
  try {
    // Check if recovery already performed for this version
    const recoveryStatus = getRecoveryStatus();
    if (recoveryStatus?.recoveryPerformed && recoveryStatus?.version === RECOVERY_VERSION) {
      return false; // Recovery already done
    }

    // Detect corruption
    const isCorrupted = await detectDatabaseCorruption();

    if (isCorrupted) {
      // Force fresh migration to rebuild everything
      await forceFreshMigration();

      // Mark recovery as completed
      markRecoveryCompleted(true);
      return true;
    } else {
      // Mark recovery as checked (no corruption found)
      markRecoveryCompleted(false);
      return false;
    }
  } catch (error) {
    logger.error('[Sync Recovery] Error during recovery:', error);
    return false;
  }
}

/**
 * Detect if local database is corrupted by sync bug
 */
async function detectDatabaseCorruption(): Promise<boolean> {
  try {
    // Check 1: No default groups exist (major red flag)
    const defaultGroups = await getCustomGroups({ isDefault: true });
    const hasDefaultGroups = defaultGroups.length > 0;

    // Check 2: Very few total actions (likely only custom ones remain)
    const allTiles = await getTiles({});
    const totalTileCount = allTiles.length;

    // Check 3: No enabled default actions (everything was nuked)
    const enabledDefaults = await getTiles({ isCustom: 0, isEnabled: 1 });
    const hasEnabledDefaults = enabledDefaults.length > 0;

    // Corruption indicators
    const corruptionIndicators = {
      noDefaultGroups: !hasDefaultGroups,
      fewTotalActions: totalTileCount < MIN_DEFAULT_TILE_COUNT,
      noEnabledDefaults: !hasEnabledDefaults,
    };

    const corruptionScore = Object.values(corruptionIndicators).filter(Boolean).length;

    // Analysis for debugging in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('[Sync Recovery] Corruption analysis:', {
        defaultGroups: defaultGroups.length,
        totalTiles: totalTileCount,
        enabledDefaults: enabledDefaults.length,
        indicators: corruptionIndicators,
        score: corruptionScore,
      });
    }

    // If 2 or more indicators, likely corrupted
    return corruptionScore >= 2;
  } catch (error) {
    logger.error('[Sync Recovery] Error detecting corruption:', error);
    return false; // Don't trigger recovery if we can't detect properly
  }
}

/**
 * Get recovery status from localStorage
 */
function getRecoveryStatus(): RecoveryStatus | null {
  try {
    return safeLocalStorage.getJSON<RecoveryStatus>(RECOVERY_STATUS_KEY);
  } catch {
    return null;
  }
}

/**
 * Mark recovery as completed
 */
function markRecoveryCompleted(detectedCorruption: boolean): void {
  const status: RecoveryStatus = {
    version: RECOVERY_VERSION,
    recoveryPerformed: true,
    detectedCorruption,
    recoveryTimestamp: Date.now(),
  };

  safeLocalStorage.setJSON(RECOVERY_STATUS_KEY, status);
}

/**
 * Reset recovery status (for testing)
 */
export function resetRecoveryStatus(): void {
  safeLocalStorage.removeItem(RECOVERY_STATUS_KEY);
}

/**
 * Check if user was affected by the sync bug
 */
export function wasUserAffectedBySync(): boolean {
  const status = getRecoveryStatus();
  return status?.detectedCorruption === true;
}

/**
 * Force recovery for testing
 */
export async function forceRecovery(): Promise<boolean> {
  resetRecoveryStatus();
  return await runSyncRecovery();
}
