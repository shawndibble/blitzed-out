import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  checkMigrationHealth,
  forceCompleteMigrationReset,
  getMigrationHealthSummary,
  recoverFromFailedMigration,
} from '../migrationHealthChecker';

import { isDexieDataComplete } from '@/services/dataCompletenessChecker';

// Mock the data completeness checker
vi.mock('@/services/dataCompletenessChecker', () => ({
  isDexieDataComplete: vi.fn(),
}));

// Mock i18n
vi.mock('@/i18n', () => ({
  default: {
    resolvedLanguage: 'en',
    language: 'en',
  },
}));

describe('migrationHealthChecker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  describe('checkMigrationHealth', () => {
    it('should report healthy migration when data is complete', async () => {
      vi.mocked(isDexieDataComplete).mockResolvedValue(true);

      const report = await checkMigrationHealth('en', 'online');

      expect(report.isHealthy).toBe(true);
      expect(report.requiresRecovery).toBe(false);
      expect(report.details.dataComplete).toBe(true);
      expect(report.details.migrationStatus).toBe('completed');
      expect(report.failureCount).toBe(0);
    });

    it('should report unhealthy migration when data is incomplete', async () => {
      vi.mocked(isDexieDataComplete).mockResolvedValue(false);

      const report = await checkMigrationHealth('en', 'online');

      expect(report.isHealthy).toBe(false);
      expect(report.details.dataComplete).toBe(false);
      expect(report.details.migrationStatus).toBe('incomplete');
      expect(report.failureCount).toBe(1);
    });

    it('should require recovery after multiple consecutive failures', async () => {
      vi.mocked(isDexieDataComplete).mockResolvedValue(false);

      // Simulate multiple failures
      await checkMigrationHealth('en', 'online');
      await checkMigrationHealth('en', 'online');
      const report = await checkMigrationHealth('en', 'online');

      expect(report.requiresRecovery).toBe(true);
      expect(report.failureCount).toBe(3);
      expect(report.details.errorMessage).toContain('Migration failed 3 consecutive times');
    });

    it('should reset failure counters on successful validation', async () => {
      vi.mocked(isDexieDataComplete)
        .mockResolvedValueOnce(false) // First call fails
        .mockResolvedValueOnce(true); // Second call succeeds

      // First check fails
      const failReport = await checkMigrationHealth('en', 'online');
      expect(failReport.isHealthy).toBe(false);
      expect(failReport.failureCount).toBe(1);

      // Second check succeeds and resets counters
      const successReport = await checkMigrationHealth('en', 'online');
      expect(successReport.isHealthy).toBe(true);
      expect(successReport.failureCount).toBe(1); // Still shows historical count
    });

    it('should use cached results for recent validations', async () => {
      vi.mocked(isDexieDataComplete).mockResolvedValue(true);

      // First call
      const firstReport = await checkMigrationHealth('en', 'online');
      expect(firstReport.isHealthy).toBe(true);
      expect(isDexieDataComplete).toHaveBeenCalledTimes(1);

      // Second call immediately after should use cache
      const secondReport = await checkMigrationHealth('en', 'online');
      expect(secondReport.isHealthy).toBe(true);
      expect(isDexieDataComplete).toHaveBeenCalledTimes(1); // Still only called once
    });
  });

  describe('recoverFromFailedMigration', () => {
    it('should clear migration locks and reset health state', async () => {
      // Set up some migration locks
      localStorage.setItem(
        'blitzed-out-migration-in-progress',
        JSON.stringify({ inProgress: true })
      );
      localStorage.setItem(
        'blitzed-out-current-language-migration',
        JSON.stringify({ locales: ['en'] })
      );

      const result = await recoverFromFailedMigration('en', 'online');

      expect(result).toBe(true);
      expect(localStorage.getItem('blitzed-out-migration-in-progress')).toBeNull();
      expect(localStorage.getItem('blitzed-out-current-language-migration')).toBeNull();
    });
  });

  describe('forceCompleteMigrationReset', () => {
    it('should clear all migration-related localStorage keys', () => {
      // Set up migration data
      localStorage.setItem(
        'blitzed-out-action-groups-migration',
        JSON.stringify({ completed: true })
      );
      localStorage.setItem(
        'blitzed-out-background-migration',
        JSON.stringify({ completedLanguages: ['en'] })
      );
      localStorage.setItem(
        'blitzed-out-migration-health',
        JSON.stringify({ 'en-online': { failureCount: 5 } })
      );

      const result = forceCompleteMigrationReset();

      expect(result).toBe(true);
      expect(localStorage.getItem('blitzed-out-action-groups-migration')).toBeNull();
      expect(localStorage.getItem('blitzed-out-background-migration')).toBeNull();
      expect(localStorage.getItem('blitzed-out-migration-health')).toBeNull();
    });
  });

  describe('getMigrationHealthSummary', () => {
    it('should generate health summary for all locales and game modes', async () => {
      vi.mocked(isDexieDataComplete).mockResolvedValue(true);

      const summary = await getMigrationHealthSummary();

      expect(summary).toContain('Migration Health Summary:');
      expect(summary).toContain('Overall:');
      expect(isDexieDataComplete).toHaveBeenCalledTimes(10); // 5 locales × 2 game modes
    });

    it('should identify unhealthy migrations in summary', async () => {
      // Mock some failures
      vi.mocked(isDexieDataComplete)
        .mockResolvedValueOnce(false) // en/online fails
        .mockResolvedValueOnce(true) // en/local succeeds
        .mockResolvedValue(true); // All others succeed

      const summary = await getMigrationHealthSummary();

      expect(summary).toContain('UNHEALTHY');
      expect(summary).toContain('en/online');
    });
  });
});
