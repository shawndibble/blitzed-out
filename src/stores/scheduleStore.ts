import { create } from 'zustand';
import { ScheduleItem } from '@/context/schedule';
import dayjs from 'dayjs';

// Performance tracking and caching
interface ScheduleCache {
  upcomingSchedule: { data: ScheduleItem[]; timestamp: number; limit: number };
  roomSchedule: Record<string, { data: ScheduleItem[]; timestamp: number }>;
}

interface PerformanceMetrics {
  lastUpdateTime: number;
  updateCount: number;
  cacheHitRate: number;
}

interface ScheduleStore {
  // State
  schedule: ScheduleItem[];
  loading: boolean;
  error: string | null;
  _cache: ScheduleCache;
  _performanceMetrics: PerformanceMetrics;
  _pendingUpdates: ScheduleItem[];

  // Actions
  loadSchedule: (schedule: ScheduleItem[]) => void;
  addScheduleItem: (item: ScheduleItem) => void;
  removeScheduleItem: (id: string) => void;
  clearSchedule: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Performance optimized actions
  batchAddScheduleItems: (items: ScheduleItem[]) => void;
  flushPendingScheduleUpdates: () => void;
  invalidateCache: () => void;

  // Selectors with caching
  getUpcomingSchedule: (limit?: number) => ScheduleItem[];
  getScheduleByRoom: (room: string) => ScheduleItem[];
  getPerformanceMetrics: () => PerformanceMetrics;
}

// Cache timeout for schedule data (5 minutes)
const CACHE_TIMEOUT = 5 * 60 * 1000;

// Batch timeout for schedule updates
let scheduleBatchTimeout: NodeJS.Timeout | null = null;
const SCHEDULE_BATCH_DELAY = 100; // 100ms debounce for schedule updates

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
  // State
  schedule: [],
  loading: false,
  error: null,
  _cache: {
    upcomingSchedule: { data: [], timestamp: 0, limit: 0 },
    roomSchedule: {},
  },
  _performanceMetrics: {
    lastUpdateTime: Date.now(),
    updateCount: 0,
    cacheHitRate: 0,
  },
  _pendingUpdates: [],

  // Actions
  loadSchedule: (schedule) => {
    const now = Date.now();
    set((state) => {
      const newUpdateCount = state._performanceMetrics.updateCount + 1;

      return {
        schedule,
        loading: false,
        error: null,
        _performanceMetrics: {
          lastUpdateTime: now,
          updateCount: newUpdateCount,
          cacheHitRate: state._performanceMetrics.cacheHitRate,
        },
      };
    });
    
    // Invalidate cache when new data is loaded
    get().invalidateCache();
  },

  addScheduleItem: (item) => {
    const state = get();
    state._pendingUpdates.push(item);
    
    // Debounced batch update
    if (scheduleBatchTimeout) clearTimeout(scheduleBatchTimeout);
    scheduleBatchTimeout = setTimeout(() => {
      state.flushPendingScheduleUpdates();
    }, SCHEDULE_BATCH_DELAY);
  },

  batchAddScheduleItems: (items) =>
    set((state) => {
      const newSchedule = [...state.schedule, ...items];
      const now = Date.now();
      const newUpdateCount = state._performanceMetrics.updateCount + 1;

      return {
        schedule: newSchedule,
        _performanceMetrics: {
          lastUpdateTime: now,
          updateCount: newUpdateCount,
          cacheHitRate: state._performanceMetrics.cacheHitRate,
        },
      };
    }),

  flushPendingScheduleUpdates: () => {
    const state = get();
    if (state._pendingUpdates.length === 0) return;
    
    state.batchAddScheduleItems(state._pendingUpdates);
    set(() => ({ _pendingUpdates: [] }));
    state.invalidateCache();
  },

  removeScheduleItem: (id) => {
    set((state) => ({
      schedule: state.schedule.filter((item) => item.id !== id),
    }));
    get().invalidateCache();
  },

  clearSchedule: () => {
    set(() => ({
      schedule: [],
      loading: false,
      error: null,
      _pendingUpdates: [],
    }));
    get().invalidateCache();
  },

  invalidateCache: () =>
    set(() => ({
      _cache: {
        upcomingSchedule: { data: [], timestamp: 0, limit: 0 },
        roomSchedule: {},
      },
    })),

  setLoading: (loading) => set(() => ({ loading })),

  setError: (error) => set(() => ({ error, loading: false })),

  // Selectors with caching
  getUpcomingSchedule: (limit = 10) => {
    const state = get();
    const now = Date.now();
    
    // Check cache validity
    const cache = state._cache.upcomingSchedule;
    const isCacheValid = cache.timestamp > 0 && 
                        (now - cache.timestamp) < CACHE_TIMEOUT && 
                        cache.limit >= limit;
    
    if (isCacheValid) {
      // Update cache hit rate
      const totalRequests = state._performanceMetrics.updateCount + 1;
      const currentHits = state._performanceMetrics.cacheHitRate * (totalRequests - 1);
      const newHitRate = (currentHits + 1) / totalRequests;
      
      set((prevState) => ({
        _performanceMetrics: {
          ...prevState._performanceMetrics,
          cacheHitRate: newHitRate,
        },
      }));
      
      return cache.data.slice(0, limit);
    }
    
    // Calculate and cache result
    const currentTime = dayjs();
    const upcoming = state.schedule
      .filter((item) => item.dateTime.isAfter(currentTime))
      .sort((a, b) => a.dateTime.valueOf() - b.dateTime.valueOf())
      .slice(0, Math.max(limit, 20)); // Cache extra items for future requests
    
    // Update cache
    set((prevState) => ({
      _cache: {
        ...prevState._cache,
        upcomingSchedule: {
          data: upcoming,
          timestamp: now,
          limit: Math.max(limit, 20),
        },
      },
    }));
    
    return upcoming.slice(0, limit);
  },

  getScheduleByRoom: (room) => {
    const state = get();
    const now = Date.now();
    
    // Check cache validity
    const cache = state._cache.roomSchedule[room];
    const isCacheValid = cache && 
                        cache.timestamp > 0 && 
                        (now - cache.timestamp) < CACHE_TIMEOUT;
    
    if (isCacheValid) {
      // Update cache hit rate
      const totalRequests = state._performanceMetrics.updateCount + 1;
      const currentHits = state._performanceMetrics.cacheHitRate * (totalRequests - 1);
      const newHitRate = (currentHits + 1) / totalRequests;
      
      set((prevState) => ({
        _performanceMetrics: {
          ...prevState._performanceMetrics,
          cacheHitRate: newHitRate,
        },
      }));
      
      return cache.data;
    }
    
    // Calculate and cache result
    const roomSchedule = state.schedule.filter((item) => item.room === room);
    
    // Update cache
    set((prevState) => ({
      _cache: {
        ...prevState._cache,
        roomSchedule: {
          ...prevState._cache.roomSchedule,
          [room]: {
            data: roomSchedule,
            timestamp: now,
          },
        },
      },
    }));
    
    return roomSchedule;
  },

  getPerformanceMetrics: () => {
    const state = get();
    return state._performanceMetrics;
  },
}));

// Compatibility selectors for optimized subscriptions
export const useScheduleItems = () => useScheduleStore((state) => state.schedule);
export const useScheduleLoading = () => useScheduleStore((state) => state.loading);
export const useScheduleError = () => useScheduleStore((state) => state.error);
export const useUpcomingSchedule = (limit?: number) => 
  useScheduleStore((state) => state.getUpcomingSchedule(limit));

// Performance-optimized hooks
export const useSchedulePerformance = () => useScheduleStore((state) => state.getPerformanceMetrics());

// Memoized selectors for better performance
export const useScheduleCount = () => useScheduleStore((state) => state.schedule.length);
export const useHasSchedule = () => useScheduleStore((state) => state.schedule.length > 0);
export const useScheduleByRoom = (room: string) => useScheduleStore((state) => state.getScheduleByRoom(room));

// Cached selectors that prevent recalculation
export const useCachedUpcomingSchedule = (limit = 10) => useScheduleStore((state) => {
  const cached = state._cache.upcomingSchedule;
  const now = Date.now();
  const isCacheValid = cached.timestamp > 0 && 
                      (now - cached.timestamp) < 5 * 60 * 1000 && 
                      cached.limit >= limit;
  
  return isCacheValid ? cached.data.slice(0, limit) : state.getUpcomingSchedule(limit);
});

// Specific schedule item selectors
export const useScheduleItem = (id: string) => useScheduleStore((state) => 
  state.schedule.find(item => item.id === id)
);