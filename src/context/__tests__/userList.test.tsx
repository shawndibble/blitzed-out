import * as firebase from '@/services/firebase';

import { UserListContext, UserListProvider } from '../userList';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useContext } from 'react';
import { useUserListStore } from '@/stores/userListStore';

// Mock Firebase
vi.mock('@/services/firebase', () => ({
  getUserList: vi.fn(),
}));

// Mock router
vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'TEST_ROOM' }),
  Params: {},
}));

// Mock the store
vi.mock('@/stores/userListStore', () => ({
  useUserListStore: vi.fn(),
}));

describe('UserListProvider', () => {
  const mockSetUsers = vi.fn();
  const mockSetRoom = vi.fn();
  const mockClearUsers = vi.fn();
  const mockFlushPendingUpdates = vi.fn();
  const mockGetUserList = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup store mock
    vi.mocked(useUserListStore).mockReturnValue({
      onlineUsers: {},
      setUsers: mockSetUsers,
      setRoom: mockSetRoom,
      clearUsers: mockClearUsers,
      flushPendingUpdates: mockFlushPendingUpdates,
      // Add other store properties as needed
      loading: false,
      error: null,
    } as any);

    // Setup Firebase mock
    vi.mocked(firebase.getUserList).mockImplementation(mockGetUserList);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Infinite Loop Prevention', () => {
    it('should not create infinite loops when Firebase calls the callback multiple times', async () => {
      let firebaseCallback: ((data: Record<string, unknown>) => void) | null = null;
      const mockUnsubscribe = vi.fn();

      // Mock getUserList to capture the callback and simulate multiple calls
      mockGetUserList.mockImplementation((_room, callback) => {
        firebaseCallback = callback;
        return mockUnsubscribe;
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UserListProvider>{children}</UserListProvider>
      );

      renderHook(() => useContext(UserListContext), { wrapper });

      // Wait for the component to mount and setup the listener
      await waitFor(() => {
        expect(mockGetUserList).toHaveBeenCalledTimes(1);
      });

      // Simulate Firebase calling the callback multiple times with the same data
      const userData = {
        user1: {
          displayName: 'Test User',
          uid: 'user1',
          lastSeen: new Date(),
        },
      };

      act(() => {
        // Call the callback multiple times - this should not trigger infinite loops
        firebaseCallback?.(userData);
        firebaseCallback?.(userData);
        firebaseCallback?.(userData);
      });

      // Verify that getUserList was only called once initially (not repeatedly due to re-renders)
      expect(mockGetUserList).toHaveBeenCalledTimes(1);

      // Verify setUsers was called for each callback
      expect(mockSetUsers).toHaveBeenCalledTimes(3);
    });

    it('should maintain stable callback reference to prevent useEffect loops', () => {
      let capturedCallbacks: any[] = [];

      mockGetUserList.mockImplementation((_room, callback) => {
        capturedCallbacks.push(callback);
        return vi.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UserListProvider>{children}</UserListProvider>
      );

      const { rerender } = renderHook(() => useContext(UserListContext), { wrapper });

      // Multiple re-renders should not create new callbacks
      rerender();
      rerender();
      rerender();

      // Should only have one getUserList call (stable callback prevents re-subscriptions)
      expect(mockGetUserList).toHaveBeenCalledTimes(1);
      expect(capturedCallbacks).toHaveLength(1);
    });

    it('should handle rapid state updates without creating render loops', async () => {
      let firebaseCallback: ((data: Record<string, unknown>) => void) | null = null;

      mockGetUserList.mockImplementation((_room, callback) => {
        firebaseCallback = callback;
        return vi.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UserListProvider>{children}</UserListProvider>
      );

      renderHook(() => useContext(UserListContext), { wrapper });

      await waitFor(() => {
        expect(mockGetUserList).toHaveBeenCalledTimes(1);
      });

      // Simulate rapid Firebase updates
      act(() => {
        for (let i = 0; i < 10; i++) {
          firebaseCallback?.({
            [`user${i}`]: {
              displayName: `User ${i}`,
              uid: `user${i}`,
              lastSeen: new Date(),
            },
          });
        }
      });

      // Should not cause additional listener setups
      expect(mockGetUserList).toHaveBeenCalledTimes(1);
      expect(mockSetUsers).toHaveBeenCalledTimes(10);
    });
  });

  describe('Error Handling', () => {
    it('should handle Firebase callback errors gracefully', async () => {
      let firebaseCallback: ((data: Record<string, unknown>) => void) | null = null;

      mockGetUserList.mockImplementation((_room, callback) => {
        firebaseCallback = callback;
        return vi.fn();
      });

      // Mock console.warn to verify it's called for invalid data
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UserListProvider>{children}</UserListProvider>
      );

      renderHook(() => useContext(UserListContext), { wrapper });

      await waitFor(() => {
        expect(mockGetUserList).toHaveBeenCalledTimes(1);
      });

      // Simulate invalid user data that should be filtered out
      act(() => {
        firebaseCallback?.({
          validUser: {
            displayName: 'Valid User',
            uid: 'validUser',
            lastSeen: new Date(),
          },
          invalidUser: {
            // Missing required fields
            displayName: 'Invalid User',
            // uid is missing
            lastSeen: 'invalid-date',
          },
        });
      });

      // Verify that invalid user data is filtered before updating the store
      const lastCallArg = mockSetUsers.mock.calls[mockSetUsers.mock.calls.length - 1]?.[0];
      expect(lastCallArg).toBeDefined();
      expect(lastCallArg.validUser).toBeDefined();
      expect(lastCallArg.validUser.displayName).toBe('Valid User');
      expect(lastCallArg.invalidUser).toBeUndefined();

      consoleWarnSpy.mockRestore();
    });
  });
});
