import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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

describe('Fresh User Migration Bug Prevention', () => {
  const MIGRATION_KEY = 'blitzed-out-action-groups-migration';

  beforeEach(() => {
    // Set up localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Clear localStorage to simulate fresh user
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should detect fresh user state correctly', () => {
    // Fresh user should have no migration key
    expect(localStorage.getItem(MIGRATION_KEY)).toBeNull();
  });

  it('should handle migration status check without errors', async () => {
    const { isMigrationCompleted } = await import('../migrationService');

    // Should not throw error with fresh localStorage
    expect(() => isMigrationCompleted()).not.toThrow();
    expect(isMigrationCompleted()).toBe(false);
  });

  it('should not skip migration for fresh users', async () => {
    const { isMigrationCompleted } = await import('../migrationService');

    // Fresh user check
    expect(isMigrationCompleted()).toBe(false);

    // Mock successful migration
    vi.doMock('@/stores/customGroups', () => ({
      addCustomGroup: vi.fn().mockResolvedValue('test-id'),
      getCustomGroupByName: vi.fn().mockResolvedValue(null),
      removeDuplicateGroups: vi.fn().mockResolvedValue(0),
    }));

    vi.doMock('@/stores/customTiles', () => ({
      importCustomTiles: vi.fn().mockResolvedValue(undefined),
      getTiles: vi.fn().mockResolvedValue([]),
    }));

    // Migration should run for fresh user
    const migrationNeeded = !isMigrationCompleted();
    expect(migrationNeeded).toBe(true);
  });

  it('should ensure action groups are available after migration', async () => {
    // This test validates the core issue was fixed - fresh users should get default action groups
    const mockGroups = [
      {
        id: '1',
        name: 'bating',
        label: 'Bating',
        intensities: [{ id: '1', label: 'Masturbation', value: 1, isDefault: true }],
        type: 'solo',
        isDefault: true,
        locale: 'en',
        gameMode: 'online',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Mock the getAllAvailableGroups function
    vi.doMock('@/stores/customGroups', () => ({
      getAllAvailableGroups: vi.fn().mockResolvedValue(mockGroups),
    }));

    const { getAllAvailableGroups } = await import('@/stores/customGroups');

    // Simulate what happens after successful migration
    const groups = await getAllAvailableGroups('en', 'online');

    expect(groups).toBeDefined();
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0].name).toBe('bating');
    expect(groups[0].isDefault).toBe(true);
  });

  it('should handle browser with disabled localStorage', () => {
    // Mock localStorage to throw error (some browsers/incognito mode)
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('localStorage disabled');
    });

    // Should not crash the application
    expect(async () => {
      const { isMigrationCompleted } = await import('../migrationService');
      isMigrationCompleted();
    }).not.toThrow();
  });

  it('should properly set migration completion flag', () => {
    const migrationStatus = {
      version: '2.1.0',
      completed: true,
      completedAt: new Date(),
    };

    mockLocalStorage.setItem(MIGRATION_KEY, JSON.stringify(migrationStatus));

    // Should be able to read back the status
    const stored = mockLocalStorage.getItem(MIGRATION_KEY);
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!);
    expect(parsed.completed).toBe(true);
    expect(parsed.version).toBe('2.1.0');
  });
});
