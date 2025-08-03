import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  checkAndHandleVersionChange,
  fixMigrationStatusCorruption,
  isMigrationCompleted,
  runMigrationIfNeeded,
  verifyMigrationIntegrity,
} from '../migrationService';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// Mock stores
vi.mock('@/stores/customGroups', () => ({
  addCustomGroup: vi.fn(),
  getCustomGroupByName: vi.fn(),
  removeDuplicateGroups: vi.fn(),
}));

vi.mock('@/stores/customTiles', () => ({
  importCustomTiles: vi.fn(),
  getTiles: vi.fn().mockResolvedValue([]),
}));

// Mock dynamic imports for action files
vi.mock('@/locales/en/online/bating.json', () => ({
  label: 'Bating',
  type: 'solo',
  actions: {
    None: [],
    Masturbation: ['30 slow strokes.', 'Jerk as fast as you can for 30 seconds.'],
    Edging: ['Bring yourself to the edge.', 'Get to the edge twice.'],
  },
}));

vi.mock('@/locales/en/translation.json', () => ({
  default: {},
}));

describe('Migration Service', () => {
  const MIGRATION_KEY = 'blitzed-out-action-groups-migration';
  const BACKGROUND_MIGRATION_KEY = 'blitzed-out-background-migration';
  const MIGRATION_VERSION = '2.1.2';

  beforeEach(() => {
    // Set up localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Clear localStorage
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('isMigrationCompleted', () => {
    it('should return false when no migration status exists', () => {
      expect(isMigrationCompleted()).toBe(false);
    });

    it('should return false when migration is not completed', () => {
      const status = {
        version: MIGRATION_VERSION,
        completed: false,
      };
      mockLocalStorage.setItem(MIGRATION_KEY, JSON.stringify(status));
      expect(isMigrationCompleted()).toBe(false);
    });

    it('should return false when migration version is outdated', () => {
      const status = {
        version: '1.0.0',
        completed: true,
      };
      mockLocalStorage.setItem(MIGRATION_KEY, JSON.stringify(status));
      expect(isMigrationCompleted()).toBe(false);
    });

    it('should return true when migration is completed with correct version', () => {
      const status = {
        version: MIGRATION_VERSION,
        completed: true,
        completedAt: new Date().toISOString(),
      };
      const backgroundStatus = {
        completedLanguages: ['en', 'es', 'fr', 'zh', 'hi'],
        inProgress: false,
        startedAt: new Date(),
        completedAt: new Date(),
      };
      mockLocalStorage.setItem(MIGRATION_KEY, JSON.stringify(status));
      mockLocalStorage.setItem(BACKGROUND_MIGRATION_KEY, JSON.stringify(backgroundStatus));
      expect(isMigrationCompleted()).toBe(true);
    });
  });

  describe('runMigrationIfNeeded', () => {
    it('should return true immediately if migration is already completed', async () => {
      const status = {
        version: MIGRATION_VERSION,
        completed: true,
        completedAt: new Date().toISOString(),
      };
      mockLocalStorage.setItem(MIGRATION_KEY, JSON.stringify(status));

      const result = await runMigrationIfNeeded();
      expect(result).toBe(true);
    });

    it('should run migration if not completed', async () => {
      // Mock the stores to prevent actual database operations
      const { addCustomGroup } = await import('@/stores/customGroups');
      vi.mocked(addCustomGroup).mockResolvedValue('test-id');

      const result = await runMigrationIfNeeded();
      expect(result).toBe(true);
    });
  });

  describe('Fresh user scenario', () => {
    it('should ensure migration runs for fresh users with no localStorage', async () => {
      // Simulate fresh user - no localStorage data
      expect(mockLocalStorage.getItem(MIGRATION_KEY)).toBeNull();
      expect(isMigrationCompleted()).toBe(false);

      // Migration should be needed
      const needsMigration = !isMigrationCompleted();
      expect(needsMigration).toBe(true);
    });

    it('should properly mark current language migration as completed after successful run', async () => {
      // Start with no migration status
      expect(isMigrationCompleted()).toBe(false);

      // Mock the stores for successful migration
      const { addCustomGroup } = await import('@/stores/customGroups');
      vi.mocked(addCustomGroup).mockResolvedValue('test-id');

      const result = await runMigrationIfNeeded();
      expect(result).toBe(true);

      // Check that current language was marked as migrated (not full migration yet)
      const { isCurrentLanguageMigrationCompleted } = await import('../migrationService');
      expect(isCurrentLanguageMigrationCompleted('en')).toBe(true);

      // Main migration should not be marked complete yet (only when all languages are done)
      expect(isMigrationCompleted()).toBe(false);
    });
  });

  describe('Version compatibility', () => {
    it('should re-run migration when version is upgraded', () => {
      // Set old version
      const oldStatus = {
        version: '2.0.0',
        completed: true,
        completedAt: new Date().toISOString(),
      };
      mockLocalStorage.setItem(MIGRATION_KEY, JSON.stringify(oldStatus));

      // Should return false for completed check due to version mismatch
      expect(isMigrationCompleted()).toBe(false);
    });

    it('should handle version downgrade gracefully', () => {
      // Set future version (shouldn't happen in practice)
      const futureStatus = {
        version: '3.0.0',
        completed: true,
        completedAt: new Date().toISOString(),
      };
      mockLocalStorage.setItem(MIGRATION_KEY, JSON.stringify(futureStatus));

      // Should return false due to version mismatch
      expect(isMigrationCompleted()).toBe(false);
    });
  });

  describe('verifyMigrationIntegrity', () => {
    it('should return true when localStorage says not complete', async () => {
      // No migration status set, so it should return true (no corruption)
      const result = await verifyMigrationIntegrity('en', 'online');
      expect(result).toBe(true);
    });

    it('should return false when localStorage says complete but database is empty', async () => {
      // Mock getAllAvailableGroups to return empty array (no groups in database)
      vi.doMock('@/stores/customGroups', () => ({
        getAllAvailableGroups: vi.fn().mockResolvedValue([]),
      }));

      // Set up localStorage to claim migration is complete for 'en'
      const backgroundStatus = {
        completedLanguages: ['en'],
        inProgress: false,
        startedAt: new Date(),
        completedAt: new Date(),
      };
      mockLocalStorage.setItem(BACKGROUND_MIGRATION_KEY, JSON.stringify(backgroundStatus));

      const result = await verifyMigrationIntegrity('en', 'online');
      expect(result).toBe(false);
    });

    it('should return true when localStorage and database are consistent', async () => {
      // Mock getAllAvailableGroups to return some groups (database has data)
      vi.doMock('@/stores/customGroups', () => ({
        getAllAvailableGroups: vi.fn().mockResolvedValue([
          { name: 'group1', label: 'Group 1' },
          { name: 'group2', label: 'Group 2' },
        ]),
      }));

      // Set up localStorage to claim migration is complete for 'en'
      const backgroundStatus = {
        completedLanguages: ['en'],
        inProgress: false,
        startedAt: new Date(),
        completedAt: new Date(),
      };
      mockLocalStorage.setItem(BACKGROUND_MIGRATION_KEY, JSON.stringify(backgroundStatus));

      const result = await verifyMigrationIntegrity('en', 'online');
      expect(result).toBe(true);
    });
  });

  describe('fixMigrationStatusCorruption', () => {
    it('should clear localStorage keys', () => {
      // Set up some localStorage data
      mockLocalStorage.setItem(MIGRATION_KEY, 'test');
      mockLocalStorage.setItem(BACKGROUND_MIGRATION_KEY, 'test');

      fixMigrationStatusCorruption();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(MIGRATION_KEY);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(BACKGROUND_MIGRATION_KEY);
    });
  });

  describe('checkAndHandleVersionChange', () => {
    it('should return versionChanged false when no migration status exists', () => {
      const result = checkAndHandleVersionChange();
      expect(result.versionChanged).toBe(false);
    });

    it('should return versionChanged true when version is different', () => {
      const oldStatus = {
        version: '2.1.1', // Different from current 2.1.2
        completed: true,
        completedAt: new Date(),
      };
      mockLocalStorage.setItem(MIGRATION_KEY, JSON.stringify(oldStatus));

      const result = checkAndHandleVersionChange();
      expect(result.versionChanged).toBe(true);
      expect(result.oldVersion).toBe('2.1.1');

      // Should clear localStorage
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(MIGRATION_KEY);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(BACKGROUND_MIGRATION_KEY);
    });

    it('should return versionChanged false when version matches', () => {
      const currentStatus = {
        version: MIGRATION_VERSION, // Same as current
        completed: true,
        completedAt: new Date(),
      };
      mockLocalStorage.setItem(MIGRATION_KEY, JSON.stringify(currentStatus));

      const result = checkAndHandleVersionChange();
      expect(result.versionChanged).toBe(false);
    });
  });
});
