import { vi } from 'vitest';

export const setupMigrationContextMock = () => {
  vi.mock('@/context/migration', () => ({
    useMigration: () => ({
      currentLanguageMigrated: true,
      isMigrationInProgress: false,
      isMigrationCompleted: true,
      error: null,
      triggerMigration: vi.fn(),
      ensureLanguageMigrated: vi.fn(),
    }),
  }));
};

export const setupFirebaseMock = () => {
  const mockRealtimeDatabase = {
    ref: vi.fn((path: string) => ({
      set: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      push: vi.fn(() => ({
        key: `signal-${Date.now()}`,
        set: vi.fn().mockResolvedValue(undefined),
      })),
      on: vi.fn((eventType, callback) => {
        if (!mockRealtimeDatabase._callbacks) {
          mockRealtimeDatabase._callbacks = new Map();
        }
        if (!mockRealtimeDatabase._callbacks.has(path)) {
          mockRealtimeDatabase._callbacks.set(path, new Map());
        }
        const pathCallbacks = mockRealtimeDatabase._callbacks.get(path);
        if (!pathCallbacks.has(eventType)) {
          pathCallbacks.set(eventType, []);
        }
        pathCallbacks.get(eventType).push(callback);

        return callback;
      }),
      off: vi.fn((eventType, callback) => {
        if (mockRealtimeDatabase._callbacks?.has(path)) {
          const pathCallbacks = mockRealtimeDatabase._callbacks.get(path);
          if (pathCallbacks?.has(eventType)) {
            const callbacks = pathCallbacks.get(eventType);
            const index = callbacks.indexOf(callback);
            if (index > -1) callbacks.splice(index, 1);
          }
        }
      }),
      once: vi.fn((_eventType) => {
        return Promise.resolve({
          val: () => null,
          exists: () => false,
        });
      }),
      onDisconnect: vi.fn(() => ({
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
        cancel: vi.fn().mockResolvedValue(undefined),
      })),
    })),
    _callbacks: new Map(),

    _triggerCallback: (path: string, eventType: string, data: unknown) => {
      const pathCallbacks = mockRealtimeDatabase._callbacks?.get(path);
      const callbacks = pathCallbacks?.get(eventType) || [];
      const snapshot = {
        val: () => data,
        exists: () => data !== null,
        key: path.split('/').pop(),
      };
      callbacks.forEach((cb: (...args: unknown[]) => void) => cb(snapshot));
    },
  };

  return mockRealtimeDatabase;
};

export const advanceTime = async (milliseconds: number) => {
  vi.advanceTimersByTime(milliseconds);
  await Promise.resolve();
};

export const setupTestTimers = () => {
  vi.useFakeTimers();
};

export const cleanupTestTimers = () => {
  vi.useRealTimers();
};
