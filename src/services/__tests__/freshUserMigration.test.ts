import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

    // Migration should run for fresh user
    const migrationNeeded = !isMigrationCompleted();
    expect(migrationNeeded).toBe(true);
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
