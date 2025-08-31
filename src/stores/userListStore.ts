import { create } from 'zustand';
import { OnlineUser } from '@/context/userList';

// Performance tracking
interface PerformanceMetrics {
  lastUpdateTime: number;
  updateCount: number;
  averageUpdateInterval: number;
}

interface UserListStore {
  // State
  onlineUsers: Record<string, OnlineUser>;
  loading: boolean;
  error: string | null;
  room: string | null;
  _performanceMetrics: PerformanceMetrics;
  _pendingUpdates: Record<string, OnlineUser | null>; // null means removal
  _batchTimeout: NodeJS.Timeout | null;

  // Actions
  setUsers: (users: Record<string, OnlineUser>) => void;
  addUser: (uid: string, user: OnlineUser) => void;
  removeUser: (uid: string) => void;
  clearUsers: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRoom: (room: string | null) => void;

  // Performance optimized actions
  batchUpdateUsers: (updates: Record<string, OnlineUser | null>) => void;
  flushPendingUpdates: () => void;

  // Selectors
  getUsersByRoom: (room?: string) => Record<string, OnlineUser>;
  getActiveUserCount: () => number;
  getPerformanceMetrics: () => PerformanceMetrics;
}

const BATCH_DELAY = 50; // 50ms debounce for real-time updates

export const useUserListStore = create<UserListStore>((set, get) => ({
  // State
  onlineUsers: {},
  loading: false,
  error: null,
  room: null,
  _performanceMetrics: {
    lastUpdateTime: Date.now(),
    updateCount: 0,
    averageUpdateInterval: 0,
  },
  _pendingUpdates: {},
  _batchTimeout: null,

  // Actions
  setUsers: (users) => {
    const now = Date.now();
    set((state) => {
      const timeDiff = now - state._performanceMetrics.lastUpdateTime;
      const newUpdateCount = state._performanceMetrics.updateCount + 1;
      const newAverage =
        (state._performanceMetrics.averageUpdateInterval * state._performanceMetrics.updateCount +
          timeDiff) /
        newUpdateCount;

      return {
        onlineUsers: users,
        loading: false,
        error: null,
        _performanceMetrics: {
          lastUpdateTime: now,
          updateCount: newUpdateCount,
          averageUpdateInterval: newAverage,
        },
      };
    });
  },

  addUser: (uid, user) => {
    const state = get();
    state._pendingUpdates[uid] = user;

    // Debounced batch update
    if (state._batchTimeout) clearTimeout(state._batchTimeout);
    const timeout = setTimeout(() => {
      state.flushPendingUpdates();
    }, BATCH_DELAY);
    set({ _batchTimeout: timeout });
  },

  removeUser: (uid) => {
    const state = get();
    state._pendingUpdates[uid] = null; // null indicates removal

    // Debounced batch update
    if (state._batchTimeout) clearTimeout(state._batchTimeout);
    const timeout = setTimeout(() => {
      state.flushPendingUpdates();
    }, BATCH_DELAY);
    set({ _batchTimeout: timeout });
  },

  batchUpdateUsers: (updates) =>
    set((state) => {
      const newUsers = { ...state.onlineUsers };

      Object.entries(updates).forEach(([uid, user]) => {
        if (user === null) {
          const { [uid]: _, ...remaining } = newUsers;
          Object.assign(newUsers, remaining);
        } else {
          newUsers[uid] = user;
        }
      });

      const now = Date.now();
      const timeDiff = now - state._performanceMetrics.lastUpdateTime;
      const newUpdateCount = state._performanceMetrics.updateCount + 1;
      const newAverage =
        (state._performanceMetrics.averageUpdateInterval * state._performanceMetrics.updateCount +
          timeDiff) /
        newUpdateCount;

      return {
        onlineUsers: newUsers,
        _performanceMetrics: {
          lastUpdateTime: now,
          updateCount: newUpdateCount,
          averageUpdateInterval: newAverage,
        },
      };
    }),

  flushPendingUpdates: () => {
    const state = get();
    if (Object.keys(state._pendingUpdates).length === 0) return;

    state.batchUpdateUsers(state._pendingUpdates);
    set(() => ({ _pendingUpdates: {} }));
  },

  clearUsers: () =>
    set(() => ({
      onlineUsers: {},
      loading: false,
      error: null,
      _pendingUpdates: {},
    })),

  setLoading: (loading) => set(() => ({ loading })),

  setError: (error) => set(() => ({ error, loading: false })),

  setRoom: (room) => set(() => ({ room })),

  // Selectors
  getUsersByRoom: (room) => {
    const state = get();
    if (!room) return state.onlineUsers;

    // Filter users by room if needed (current implementation doesn't filter by room)
    // This is here for future extensibility when room-specific user filtering is needed
    return state.onlineUsers;
  },

  getActiveUserCount: () => {
    const state = get();
    return Object.keys(state.onlineUsers).length;
  },

  getPerformanceMetrics: () => {
    const state = get();
    return state._performanceMetrics;
  },
}));

// Compatibility selectors for optimized subscriptions
export const useOnlineUsers = () => useUserListStore((state) => state.onlineUsers);
export const useUserListLoading = () => useUserListStore((state) => state.loading);
export const useUserListError = () => useUserListStore((state) => state.error);
export const useActiveUserCount = () => useUserListStore((state) => state.getActiveUserCount());

// Performance-optimized hooks
export const useUserListPerformance = () =>
  useUserListStore((state) => state.getPerformanceMetrics());

// Memoized selectors for better performance
export const useUserCount = () =>
  useUserListStore((state) => Object.keys(state.onlineUsers).length);
export const useUserIds = () => useUserListStore((state) => Object.keys(state.onlineUsers));
export const useHasUsers = () =>
  useUserListStore((state) => Object.keys(state.onlineUsers).length > 0);

// Specific user selectors to prevent unnecessary re-renders
export const useUser = (uid: string) => useUserListStore((state) => state.onlineUsers[uid]);
export const useIsUserOnline = (uid: string) =>
  useUserListStore((state) => !!state.onlineUsers[uid]);
