/**
 * Migration Debug Helper
 *
 * This utility provides debugging functions for the migration health system.
 * Use these functions in the browser console to inspect and test migration health.
 */

import {
  checkMigrationHealth,
  recoverFromFailedMigration,
  forceCompleteMigrationReset,
  getMigrationHealthSummary,
} from '@/services/migrationHealthChecker';

export interface MigrationDebugInfo {
  localStorage: {
    migrationStatus: string | null;
    backgroundStatus: string | null;
    healthStatus: string | null;
    inProgressLocks: string[];
  };
  healthReport: any;
  summary: string;
}

/**
 * Get comprehensive migration debug information
 */
export const getMigrationDebugInfo = async (): Promise<MigrationDebugInfo> => {
  const inProgressLocks = [
    'blitzed-out-migration-in-progress',
    'blitzed-out-current-language-migration',
    'blitzed-out-background-migration-in-progress',
  ].filter((key) => localStorage.getItem(key) !== null);

  const healthReport = await checkMigrationHealth('en', 'online').catch((err) => ({
    error: err.message,
  }));
  const summary = await getMigrationHealthSummary().catch((err) => `Error: ${err.message}`);

  return {
    localStorage: {
      migrationStatus: localStorage.getItem('blitzed-out-action-groups-migration'),
      backgroundStatus: localStorage.getItem('blitzed-out-background-migration'),
      healthStatus: localStorage.getItem('blitzed-out-migration-health'),
      inProgressLocks,
    },
    healthReport,
    summary,
  };
};

/**
 * Simulate a migration failure for testing recovery
 */
export const simulateMigrationFailure = (): void => {
  console.info('🚨 Simulating migration failure...');

  // Set up a failed migration state
  localStorage.setItem(
    'blitzed-out-migration-in-progress',
    JSON.stringify({
      inProgress: true,
      startedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    })
  );

  localStorage.setItem(
    'blitzed-out-migration-health',
    JSON.stringify({
      'en-online': {
        failureCount: 3,
        consecutiveFailures: 3,
        lastValidation: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
    })
  );

  // Clear migration completion status
  localStorage.removeItem('blitzed-out-action-groups-migration');
  localStorage.removeItem('blitzed-out-background-migration');

  console.info(
    '✅ Migration failure simulated. The system should now detect this and attempt recovery.'
  );
};

/**
 * Test the recovery system
 */
export const testMigrationRecovery = async (): Promise<boolean> => {
  console.info('🔧 Testing migration recovery...');

  try {
    const recovered = await recoverFromFailedMigration('en', 'online');

    if (recovered) {
      console.info('✅ Recovery test successful');
      return true;
    } else {
      console.warn('⚠️ Recovery test failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Recovery test error:', error);
    return false;
  }
};

/**
 * Clear all migration data and start fresh
 */
export const resetMigrationSystem = (): void => {
  console.warn('🚨 Resetting entire migration system...');

  const success = forceCompleteMigrationReset();

  if (success) {
    console.info('✅ Migration system reset complete. Page refresh recommended.');
  } else {
    console.error('❌ Migration system reset failed.');
  }
};

/**
 * Check if the setup wizard should work now
 */
export const checkSetupWizardReadiness = async (): Promise<{
  ready: boolean;
  issues: string[];
  recommendations: string[];
}> => {
  const result = {
    ready: false,
    issues: [] as string[],
    recommendations: [] as string[],
  };

  try {
    // Check migration health
    const healthReport = await checkMigrationHealth('en', 'online');

    if (!healthReport.isHealthy) {
      result.issues.push('Migration is not healthy');

      if (healthReport.requiresRecovery) {
        result.recommendations.push('Run testMigrationRecovery() to attempt automatic recovery');
      } else {
        result.recommendations.push(
          'Migration may still be in progress, wait a moment and try again'
        );
      }
    }

    // Check for stale locks
    const staleLocks = [
      'blitzed-out-migration-in-progress',
      'blitzed-out-current-language-migration',
      'blitzed-out-background-migration-in-progress',
    ].filter((key) => {
      const value = localStorage.getItem(key);
      if (!value) return false;

      try {
        const data = JSON.parse(value);
        const ageMs = Date.now() - new Date(data.startedAt).getTime();
        return ageMs > 5 * 60 * 1000; // Older than 5 minutes
      } catch {
        return true; // Corrupted data
      }
    });

    if (staleLocks.length > 0) {
      result.issues.push(`Stale migration locks detected: ${staleLocks.join(', ')}`);
      result.recommendations.push('Run testMigrationRecovery() to clear stale locks');
    }

    // Check data completeness would go here
    // (This would require importing and using the data completeness checker)

    result.ready = result.issues.length === 0 && healthReport.isHealthy;

    if (result.ready) {
      result.recommendations.push('Setup wizard should work correctly now!');
    }
  } catch (error) {
    result.issues.push(`Health check failed: ${error}`);
    result.recommendations.push('Try resetMigrationSystem() if issues persist');
  }

  return result;
};

// Expose functions to window for debugging
if (typeof window !== 'undefined') {
  (window as any).migrationDebug = {
    getInfo: getMigrationDebugInfo,
    simulateFailure: simulateMigrationFailure,
    testRecovery: testMigrationRecovery,
    reset: resetMigrationSystem,
    checkWizardReadiness: checkSetupWizardReadiness,
  };

  console.info(`
🔧 Migration Debug Helper loaded!

Available functions:
• migrationDebug.getInfo() - Get comprehensive debug information
• migrationDebug.simulateFailure() - Simulate a migration failure for testing
• migrationDebug.testRecovery() - Test the automatic recovery system
• migrationDebug.checkWizardReadiness() - Check if setup wizard should work
• migrationDebug.reset() - Nuclear option: reset entire migration system

The system will now automatically detect and recover from migration failures.
If you get stuck in a state where the setup wizard won't work, try:
1. migrationDebug.checkWizardReadiness()
2. migrationDebug.testRecovery()
3. migrationDebug.reset() (if needed)
  `);
}
