import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getMessages,
  getMessagesWithPagination,
  getUserList,
  getSchedule,
  getScheduleWithPagination,
  getQueryPerformanceMetrics,
  getCacheStats,
  clearQueryCache,
} from '../firebase';

// Mock Firebase modules
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  onSnapshot: vi.fn((_query, callback) => {
    // Simulate async Firebase response
    setTimeout(() => {
      callback({
        docs: [
          {
            id: 'test-id-1',
            data: () => ({ text: 'test message 1', timestamp: new Date() }),
          },
          {
            id: 'test-id-2',
            data: () => ({ text: 'test message 2', timestamp: new Date() }),
          },
        ],
      });
    }, 50);
    return () => {}; // unsubscribe function
  }),
  Timestamp: {
    fromDate: (date: Date) => date,
  },
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  serverTimestamp: vi.fn(),
  updateDoc: vi.fn(),
}));

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn(),
  onValue: vi.fn((_ref, callback) => {
    setTimeout(() => {
      callback({
        val: () => ({
          user1: { displayName: 'User 1', lastActive: Date.now() },
          user2: { displayName: 'User 2', lastActive: Date.now() },
        }),
      });
    }, 50);
  }),
}));

describe('Firebase Query Optimizations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearQueryCache();
  });

  afterEach(() => {
    clearQueryCache();
  });

  describe('getMessages optimization', () => {
    it('should support backward compatibility with no options', () => {
      const mockCallback = vi.fn();
      const unsubscribe = getMessages('test-room', mockCallback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should support custom limit parameter', () => {
      const mockCallback = vi.fn();
      const unsubscribe = getMessages('test-room', mockCallback, { limitCount: 25 });

      expect(typeof unsubscribe).toBe('function');
    });

    it('should support caching options', () => {
      const mockCallback = vi.fn();
      const unsubscribe = getMessages('test-room', mockCallback, {
        enableCache: true,
        enableDebounce: false,
      });

      expect(typeof unsubscribe).toBe('function');
    });

    it('should handle null/undefined roomId gracefully', () => {
      const mockCallback = vi.fn();

      expect(getMessages(null, mockCallback)).toBeUndefined();
      expect(getMessages(undefined, mockCallback)).toBeUndefined();
    });
  });

  describe('getUserList optimization', () => {
    it('should support backward compatibility', () => {
      const mockCallback = vi.fn();
      const existingData = {};

      expect(() => {
        getUserList('test-room', mockCallback, existingData);
      }).not.toThrow();
    });

    it('should support optimization options', () => {
      const mockCallback = vi.fn();
      const existingData = {};

      expect(() => {
        getUserList('test-room', mockCallback, existingData, {
          enableCache: true,
          enableDebounce: false,
        });
      }).not.toThrow();
    });

    it('should handle null/undefined roomId gracefully', () => {
      const mockCallback = vi.fn();

      expect(() => {
        getUserList(null, mockCallback);
      }).not.toThrow();

      expect(() => {
        getUserList(undefined, mockCallback);
      }).not.toThrow();
    });
  });

  describe('getSchedule optimization', () => {
    it('should support backward compatibility with no options', () => {
      const mockCallback = vi.fn();
      const unsubscribe = getSchedule(mockCallback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should support custom limit and pagination', () => {
      const mockCallback = vi.fn();
      const unsubscribe = getSchedule(mockCallback, { limitCount: 25 });

      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('Enhanced pagination functions', () => {
    it('should support getMessagesWithPagination', () => {
      const mockCallback = vi.fn();
      const unsubscribe = getMessagesWithPagination('test-room', mockCallback, 25);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should support getScheduleWithPagination', () => {
      const mockCallback = vi.fn();
      const unsubscribe = getScheduleWithPagination(mockCallback, 25);

      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('Performance monitoring', () => {
    it('should provide query performance metrics', () => {
      const metrics = getQueryPerformanceMetrics();

      expect(typeof metrics).toBe('object');
    });

    it('should provide cache statistics', () => {
      const stats = getCacheStats();

      expect(stats).toHaveProperty('totalCachedQueries');
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('oldestCacheEntry');
      expect(stats).toHaveProperty('newestCacheEntry');
    });
  });

  describe('Cache management', () => {
    it('should clear all cache when no pattern provided', () => {
      clearQueryCache();
      const stats = getCacheStats();

      expect(stats.totalCachedQueries).toBe(0);
    });

    it('should clear specific cache entries with pattern', () => {
      clearQueryCache('messages');
      const stats = getCacheStats();

      expect(stats.totalCachedQueries).toBe(0);
    });
  });
});
