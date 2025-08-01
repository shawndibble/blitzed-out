import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isMigrationCompleted, runMigrationIfNeeded } from '../migrationService';

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
  const MIGRATION_VERSION = '2.1.1';

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

    it('should return false when migration status is invalid JSON', () => {
      mockLocalStorage.setItem(MIGRATION_KEY, 'invalid json');
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
      mockLocalStorage.setItem(MIGRATION_KEY, JSON.stringify(status));
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

    it('should handle migration errors gracefully', async () => {
      // Mock the stores to throw errors
      const { addCustomGroup } = await import('@/stores/customGroups');
      vi.mocked(addCustomGroup).mockRejectedValue(new Error('Database error'));

      const result = await runMigrationIfNeeded();
      expect(result).toBe(true); // Migration should still succeed even with some failures
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

    it('should handle empty localStorage gracefully', async () => {
      // Clear all localStorage
      mockLocalStorage.clear();

      // Should not throw error
      expect(() => isMigrationCompleted()).not.toThrow();
      expect(isMigrationCompleted()).toBe(false);
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

  describe('Error handling', () => {
    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw an error
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      // Should not throw and return false
      expect(() => isMigrationCompleted()).not.toThrow();
      expect(isMigrationCompleted()).toBe(false);
    });

    it('should handle JSON parsing errors', () => {
      mockLocalStorage.setItem(MIGRATION_KEY, '{invalid json}');

      expect(() => isMigrationCompleted()).not.toThrow();
      expect(isMigrationCompleted()).toBe(false);
    });
  });
});
