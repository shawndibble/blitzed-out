import { isDexieDataComplete } from '@/services/dataCompletenessChecker';
import i18n from '@/i18n';

export interface MigrationHealthReport {
  isHealthy: boolean;
  requiresRecovery: boolean;
  lastValidation: Date;
  failureCount: number;
  details: {
    migrationStatus: 'completed' | 'failed' | 'incomplete';
    dataComplete: boolean;
    locale: string;
    gameMode: string;
    errorMessage?: string;
  };
}

interface MigrationHealthState {
  [localeGameMode: string]: {
    failureCount: number;
    lastValidation: string; // ISO string for JSON serialization
    consecutiveFailures: number;
  };
}

const HEALTH_CHECK_KEY = 'blitzed-out-migration-health';
const MAX_RETRY_ATTEMPTS = 3;
const MIN_VALIDATION_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Get stored health state from localStorage
 */
const getHealthState = (): MigrationHealthState => {
  try {
    const stored = localStorage.getItem(HEALTH_CHECK_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Failed to load migration health state:', error);
    return {};
  }
};

/**
 * Update health state in localStorage
 */
const updateHealthState = (
  locale: string,
  gameMode: string,
  update: Partial<MigrationHealthState[string]>
): void => {
  try {
    const key = `${locale}-${gameMode}`;
    const state = getHealthState();

    state[key] = {
      ...{
        failureCount: 0,
        lastValidation: new Date().toISOString(),
        consecutiveFailures: 0,
      },
      ...state[key],
      ...update,
    };

    localStorage.setItem(HEALTH_CHECK_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to update migration health state:', error);
  }
};

/**
 * Check if migration is healthy for the given locale and game mode
 * This performs a comprehensive check of migration status and data integrity
 */
export const checkMigrationHealth = async (
  locale?: string,
  gameMode: string = 'online'
): Promise<MigrationHealthReport> => {
  const targetLocale = locale || i18n.resolvedLanguage || i18n.language || 'en';
  const key = `${targetLocale}-${gameMode}`;
  const healthState = getHealthState();
  const storedState = healthState[key] || {
    failureCount: 0,
    lastValidation: new Date(0).toISOString(),
    consecutiveFailures: 0,
  };

  // Ensure lastValidation is a Date object for calculations
  const currentState = {
    ...storedState,
    lastValidation: new Date(storedState.lastValidation),
  };

  const report: MigrationHealthReport = {
    isHealthy: false,
    requiresRecovery: false,
    lastValidation: currentState.lastValidation,
    failureCount: currentState.failureCount,
    details: {
      migrationStatus: 'incomplete',
      dataComplete: false,
      locale: targetLocale,
      gameMode,
    },
  };

  try {
    // Skip validation if we just validated recently (unless we have failures)
    const timeSinceLastValidation = Date.now() - currentState.lastValidation.getTime();
    if (
      timeSinceLastValidation < MIN_VALIDATION_INTERVAL &&
      currentState.consecutiveFailures === 0
    ) {
      // Return cached result if we validated recently and had no failures
      report.isHealthy = true;
      report.details.migrationStatus = 'completed';
      report.details.dataComplete = true;
      return report;
    }

    // Check if data is complete in Dexie
    const dataComplete = await isDexieDataComplete(targetLocale, gameMode);
    report.details.dataComplete = dataComplete;

    if (dataComplete) {
      // Data is complete, migration is healthy
      report.isHealthy = true;
      report.details.migrationStatus = 'completed';

      // Reset failure counters on success
      updateHealthState(targetLocale, gameMode, {
        consecutiveFailures: 0,
        lastValidation: new Date().toISOString(),
      });
    } else {
      // Data is incomplete, check migration status
      const migrationStatus = checkMigrationStatusFromStorage();
      report.details.migrationStatus = migrationStatus;

      // Increment failure count
      const newFailureCount = currentState.failureCount + 1;
      const newConsecutiveFailures = currentState.consecutiveFailures + 1;

      updateHealthState(targetLocale, gameMode, {
        failureCount: newFailureCount,
        consecutiveFailures: newConsecutiveFailures,
        lastValidation: new Date().toISOString(),
      });

      report.failureCount = newFailureCount;
      report.requiresRecovery = newConsecutiveFailures >= MAX_RETRY_ATTEMPTS;

      if (report.requiresRecovery) {
        report.details.errorMessage = `Migration failed ${newConsecutiveFailures} consecutive times. Data incomplete for ${targetLocale}/${gameMode}.`;
      }
    }

    return report;
  } catch (error) {
    console.error('Migration health check failed:', error);

    // Increment failure count
    const newFailureCount = currentState.failureCount + 1;
    const newConsecutiveFailures = currentState.consecutiveFailures + 1;

    updateHealthState(targetLocale, gameMode, {
      failureCount: newFailureCount,
      consecutiveFailures: newConsecutiveFailures,
      lastValidation: new Date().toISOString(),
    });

    report.failureCount = newFailureCount;
    report.requiresRecovery = newConsecutiveFailures >= MAX_RETRY_ATTEMPTS;
    report.details.migrationStatus = 'failed';
    report.details.errorMessage = `Health check failed: ${error instanceof Error ? error.message : String(error)}`;

    return report;
  }
};

/**
 * Check migration status from localStorage
 */
const checkMigrationStatusFromStorage = (): 'completed' | 'failed' | 'incomplete' => {
  try {
    // Check main migration status
    const mainStatus = localStorage.getItem('blitzed-out-action-groups-migration');
    if (mainStatus) {
      const parsed = JSON.parse(mainStatus);
      if (parsed.completed && parsed.version === '2.1.1') {
        return 'completed';
      }
    }

    // Check background migration status
    const bgStatus = localStorage.getItem('blitzed-out-background-migration');
    if (bgStatus) {
      const parsed = JSON.parse(bgStatus);
      if (parsed.completedLanguages && parsed.completedLanguages.length > 0) {
        return 'completed';
      }
    }

    return 'incomplete';
  } catch (error) {
    console.warn('Failed to check migration status from storage:', error);
    return 'incomplete';
  }
};

/**
 * Attempt to recover from a failed migration
 * This clears migration locks and status, forcing a fresh migration attempt
 */
export const recoverFromFailedMigration = async (
  locale?: string,
  gameMode: string = 'online'
): Promise<boolean> => {
  const targetLocale = locale || i18n.resolvedLanguage || i18n.language || 'en';

  try {
    // Clear migration locks and status to force fresh migration
    const keysToRemove = [
      'blitzed-out-migration-in-progress',
      'blitzed-out-current-language-migration',
      'blitzed-out-background-migration-in-progress',
    ];

    let hasErrors = false;
    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove ${key}:`, error);
        hasErrors = true;
      }
    });

    // Reset health state for this locale/gameMode
    try {
      updateHealthState(targetLocale, gameMode, {
        failureCount: 0,
        consecutiveFailures: 0,
        lastValidation: new Date(0).toISOString(), // Force revalidation
      });
    } catch (error) {
      console.warn('Failed to update health state:', error);
      hasErrors = true;
    }

    if (hasErrors) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Migration recovery failed:', error);
    return false;
  }
};

/**
 * Force a complete migration reset (nuclear option)
 * This removes all migration status and forces a complete re-migration
 */
export const forceCompleteMigrationReset = (): boolean => {
  try {
    const keysToRemove = [
      'blitzed-out-action-groups-migration',
      'blitzed-out-background-migration',
      'blitzed-out-migration-in-progress',
      'blitzed-out-current-language-migration',
      'blitzed-out-background-migration-in-progress',
      HEALTH_CHECK_KEY,
    ];

    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove ${key}:`, error);
      }
    });

    return true;
  } catch (error) {
    console.error('Complete migration reset failed:', error);
    return false;
  }
};

/**
 * Get a summary of migration health across all locales and game modes
 */
export const getMigrationHealthSummary = async (): Promise<string> => {
  try {
    const locales = ['en', 'es', 'fr', 'zh', 'hi'];
    const gameModes = ['online', 'local'];

    let summary = 'Migration Health Summary:\n';
    let totalChecked = 0;
    let totalHealthy = 0;
    let totalRequireRecovery = 0;

    for (const locale of locales) {
      for (const gameMode of gameModes) {
        try {
          const report = await checkMigrationHealth(locale, gameMode);
          totalChecked++;

          if (report.isHealthy) {
            totalHealthy++;
          }

          if (report.requiresRecovery) {
            totalRequireRecovery++;
            summary += `❌ ${locale}/${gameMode}: REQUIRES RECOVERY (${report.failureCount} failures)\n`;
          } else if (!report.isHealthy) {
            summary += `⚠️  ${locale}/${gameMode}: UNHEALTHY (${report.failureCount} failures)\n`;
          }
        } catch (error) {
          totalChecked++;
          summary += `💥 ${locale}/${gameMode}: CHECK FAILED - ${error}\n`;
        }
      }
    }

    summary += `\nOverall: ${totalHealthy}/${totalChecked} healthy`;
    if (totalRequireRecovery > 0) {
      summary += `, ${totalRequireRecovery} require recovery`;
    }

    return summary;
  } catch (error) {
    return `Error generating migration health summary: ${error}`;
  }
};
