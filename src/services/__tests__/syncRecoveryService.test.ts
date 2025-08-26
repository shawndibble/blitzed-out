import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  forceRecovery,
  resetRecoveryStatus,
  runSyncRecovery,
  wasUserAffectedBySync,
} from '../syncRecoveryService';

import { forceFreshMigration } from '@/services/migrationService';
import { getCustomGroups } from '@/stores/customGroups';
import { getTiles } from '@/stores/customTiles';
import { logger } from '@/utils/logger';
import { safeLocalStorage } from '@/services/migration/errorHandling';

// Mock dependencies
vi.mock('@/stores/customTiles');
vi.mock('@/stores/customGroups');
vi.mock('@/services/migrationService');
vi.mock('@/utils/logger');

// Mock safeLocalStorage
vi.mock('@/services/migration/errorHandling', () => ({
  safeLocalStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    getJSON: vi.fn(),
    setJSON: vi.fn(),
  },
}));

describe('syncRecoveryService', () => {
  let mockStorage: Record<string, any> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage = {}; // Clear the mock storage
    resetRecoveryStatus();

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock logger methods
    vi.mocked(logger.error).mockImplementation(() => {});
    vi.mocked(logger.debug).mockImplementation(() => {});

    // Mock safeLocalStorage with persistent behavior
    vi.mocked(safeLocalStorage.getJSON).mockImplementation((key: string) => {
      return mockStorage[key] || null;
    });
    vi.mocked(safeLocalStorage.setJSON).mockImplementation((key: string, value: any) => {
      mockStorage[key] = value;
      return true;
    });
    vi.mocked(safeLocalStorage.removeItem).mockImplementation((key: string) => {
      delete mockStorage[key];
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('runSyncRecovery', () => {
    it('should detect corruption and trigger recovery when database is corrupted', async () => {
      // Mock corrupted database state
      vi.mocked(getCustomGroups).mockImplementation(async (filters: any) => {
        if (filters?.isDefault === true) return []; // No default groups!
        return [];
      });

      vi.mocked(getTiles).mockImplementation(async (filters: any) => {
        if (filters === undefined || Object.keys(filters).length === 0) return []; // Very few tiles
        if (filters?.isCustom === 0 && filters?.isEnabled === 1) return []; // No enabled defaults
        return [];
      });

      vi.mocked(forceFreshMigration).mockResolvedValue();

      const result = await runSyncRecovery();

      expect(result).toBe(true);
      expect(forceFreshMigration).toHaveBeenCalled();
    });

    it('should not trigger recovery when database is healthy', async () => {
      // Mock healthy database state
      vi.mocked(getCustomGroups).mockImplementation(async (filters: any) => {
        if (filters?.isDefault === true) return [{ id: '1' }, { id: '2' }] as any; // Has default groups
        return [];
      });

      vi.mocked(getTiles).mockImplementation(async (filters: any) => {
        if (filters === undefined || Object.keys(filters).length === 0) {
          // Return a realistic number of tiles
          return Array.from({ length: 200 }, (_, i) => ({ id: i })) as any;
        }
        if (filters?.isCustom === 0 && filters?.isEnabled === 1) {
          return Array.from({ length: 180 }, (_, i) => ({ id: i })) as any; // Many enabled defaults
        }
        return [];
      });

      const result = await runSyncRecovery();

      expect(result).toBe(false);
      expect(forceFreshMigration).not.toHaveBeenCalled();
    });

    it('should not run recovery twice for the same version', async () => {
      // First run with corrupted state
      vi.mocked(getCustomGroups).mockResolvedValue([]);
      vi.mocked(getTiles).mockResolvedValue([]);
      vi.mocked(forceFreshMigration).mockResolvedValue();

      // First run should trigger recovery
      const firstRun = await runSyncRecovery();
      expect(firstRun).toBe(true);
      expect(forceFreshMigration).toHaveBeenCalledTimes(1);

      // Second run should skip recovery
      const secondRun = await runSyncRecovery();
      expect(secondRun).toBe(false);
      expect(forceFreshMigration).toHaveBeenCalledTimes(1); // Still only once
    });

    it('should handle detection errors gracefully', async () => {
      // Ensure recovery status is cleared so detection logic runs
      mockStorage = {};
      resetRecoveryStatus();
      vi.mocked(getCustomGroups).mockRejectedValue(new Error('Database error'));
      vi.mocked(getTiles).mockRejectedValue(new Error('Database error'));

      const result = await runSyncRecovery();

      expect(result).toBe(false);
      expect(forceFreshMigration).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[Sync Recovery] Error detecting corruption:'),
        expect.any(Error)
      );
    });

    it('should handle recovery errors gracefully', async () => {
      // Ensure recovery status is cleared so detection logic runs
      mockStorage = {};
      resetRecoveryStatus();
      // Mock corrupted state
      vi.mocked(getCustomGroups).mockResolvedValue([]);
      vi.mocked(getTiles).mockResolvedValue([]);

      // Mock migration failure
      vi.mocked(forceFreshMigration).mockRejectedValue(new Error('Migration failed'));

      const result = await runSyncRecovery();

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[Sync Recovery] Error during recovery:'),
        expect.any(Error)
      );
    });
  });

  describe('corruption detection logic', () => {
    it('should identify corruption with multiple indicators', async () => {
      // Ensure recovery status is cleared so detection logic runs
      mockStorage = {};
      resetRecoveryStatus();
      // Mock state with multiple corruption indicators
      vi.mocked(getCustomGroups).mockImplementation(async (filters: any) => {
        if (filters?.isDefault === true) return []; // Indicator 1: No default groups
        return [];
      });

      vi.mocked(getTiles).mockImplementation(async (filters: any) => {
        if (filters === undefined || Object.keys(filters).length === 0) return []; // Indicator 2: Very few tiles
        if (filters?.isCustom === 0 && filters?.isEnabled === 1) return []; // Indicator 3: No enabled defaults
        return [];
      });

      vi.mocked(forceFreshMigration).mockResolvedValue();

      const result = await runSyncRecovery();
      expect(result).toBe(true);
    });

    it('should not trigger recovery with only one indicator', async () => {
      // Mock state with only one indicator
      vi.mocked(getCustomGroups).mockImplementation(async (filters: any) => {
        if (filters?.isDefault === true) return [{ id: '1' }] as any; // Has default groups
        return [];
      });

      vi.mocked(getTiles).mockImplementation(async (filters: any) => {
        if (filters === undefined || Object.keys(filters).length === 0) return []; // Only this indicator
        if (filters?.isCustom === 0 && filters?.isEnabled === 1) {
          return Array.from({ length: 100 }, (_, i) => ({ id: i })) as any; // Has enabled defaults
        }
        return [];
      });

      const result = await runSyncRecovery();
      expect(result).toBe(false);
    });
  });

  describe('wasUserAffectedBySync', () => {
    it('should return true if user was affected by sync bug', async () => {
      // Ensure recovery status is cleared so detection logic runs
      mockStorage = {};
      resetRecoveryStatus();
      // Trigger recovery with corruption
      vi.mocked(getCustomGroups).mockResolvedValue([]);
      vi.mocked(getTiles).mockResolvedValue([]);
      vi.mocked(forceFreshMigration).mockResolvedValue();

      await runSyncRecovery();

      expect(wasUserAffectedBySync()).toBe(true);
    });

    it('should return false if user was not affected', async () => {
      // Healthy database state
      vi.mocked(getCustomGroups).mockResolvedValue([{ id: '1' }] as any);
      vi.mocked(getTiles).mockResolvedValue(
        Array.from({ length: 200 }, (_, i) => ({ id: i })) as any
      );

      await runSyncRecovery();

      expect(wasUserAffectedBySync()).toBe(false);
    });
  });

  describe('forceRecovery', () => {
    it('should force recovery even if already performed', async () => {
      // First run
      mockStorage = {};
      vi.mocked(getCustomGroups).mockResolvedValue([{ id: '1' }] as any);
      vi.mocked(getTiles).mockResolvedValue([{ id: '1' }] as any);
      await runSyncRecovery();

      // Force recovery should reset status and run again
      vi.mocked(getCustomGroups).mockResolvedValue([]);
      vi.mocked(getTiles).mockResolvedValue([]);
      vi.mocked(forceFreshMigration).mockResolvedValue();

      const result = await forceRecovery();

      expect(result).toBe(true);
      expect(forceFreshMigration).toHaveBeenCalled();
    });
  });
});
