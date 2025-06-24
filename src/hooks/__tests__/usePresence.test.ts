import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import usePresence from '../usePresence';
import * as firebaseService from '@/services/firebase';
import useAuth from '@/context/hooks/useAuth';

// Mock the firebase service
vi.mock('@/services/firebase', () => ({
  setMyPresence: vi.fn(),
}));

// Mock the auth context with a controllable mock
vi.mock('@/context/hooks/useAuth', () => {
  const mockUseAuth = vi.fn(() => ({
    user: {
      displayName: 'Test User',
      uid: 'test-user-id',
    },
  }));
  return {
    default: mockUseAuth,
  };
});

describe('usePresence Hook', () => {
  const mockSetMyPresence = vi.mocked(firebaseService.setMyPresence);
  const mockUseAuth = vi.mocked(useAuth);

  beforeEach(() => {
    mockSetMyPresence.mockClear();
    // Reset to default mock return value
    mockUseAuth.mockReturnValue({
      user: {
        displayName: 'Test User',
        uid: 'test-user-id',
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Setup', () => {
    it('should call setMyPresence on mount with correct parameters', () => {
      renderHook(() => usePresence('test-room'));

      expect(mockSetMyPresence).toHaveBeenCalledWith({
        newRoom: 'test-room',
        oldRoom: null,
        newDisplayName: 'Test User',
        oldDisplayName: 'Test User',
        removeOnDisconnect: false,
      });
    });

    it('should handle empty room ID', () => {
      renderHook(() => usePresence(''));

      expect(mockSetMyPresence).toHaveBeenCalledWith({
        newRoom: '',
        oldRoom: null,
        newDisplayName: 'Test User',
        oldDisplayName: 'Test User',
        removeOnDisconnect: false,
      });
    });

    it('should handle undefined display name', () => {
      // Mock auth context to return undefined display name
      mockUseAuth.mockReturnValue({
        user: {
          displayName: undefined,
          uid: 'test-user-id',
        },
      });

      renderHook(() => usePresence('test-room'));

      expect(mockSetMyPresence).toHaveBeenCalledWith({
        newRoom: 'test-room',
        oldRoom: null,
        newDisplayName: '',
        oldDisplayName: '',
        removeOnDisconnect: false,
      });
    });
  });

  describe('Room Changes', () => {
    it('should update presence when room changes', () => {
      const { rerender } = renderHook(({ roomId }) => usePresence(roomId), {
        initialProps: { roomId: 'room1' },
      });

      expect(mockSetMyPresence).toHaveBeenCalledWith({
        newRoom: 'room1',
        oldRoom: null,
        newDisplayName: 'Test User',
        oldDisplayName: 'Test User',
        removeOnDisconnect: false,
      });

      mockSetMyPresence.mockClear();

      // Change room
      rerender({ roomId: 'room2' });

      expect(mockSetMyPresence).toHaveBeenCalledWith({
        newRoom: 'room2',
        oldRoom: 'room1',
        newDisplayName: 'Test User',
        oldDisplayName: 'Test User',
        removeOnDisconnect: false,
      });
    });

    it('should not call setMyPresence if room has not changed', () => {
      const { rerender } = renderHook(({ roomId }) => usePresence(roomId), {
        initialProps: { roomId: 'test-room' },
      });

      expect(mockSetMyPresence).toHaveBeenCalledTimes(1);

      // Rerender with same room
      rerender({ roomId: 'test-room' });

      // Should not call setMyPresence again
      expect(mockSetMyPresence).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple rapid room changes', () => {
      const { rerender } = renderHook(({ roomId }) => usePresence(roomId), {
        initialProps: { roomId: 'room1' },
      });

      expect(mockSetMyPresence).toHaveBeenCalledTimes(1);

      // Rapid room changes
      rerender({ roomId: 'room2' });
      rerender({ roomId: 'room3' });
      rerender({ roomId: 'room4' });

      expect(mockSetMyPresence).toHaveBeenCalledTimes(4);
      expect(mockSetMyPresence).toHaveBeenLastCalledWith({
        newRoom: 'room4',
        oldRoom: 'room3',
        newDisplayName: 'Test User',
        oldDisplayName: 'Test User',
        removeOnDisconnect: false,
      });
    });
  });

  describe('Display Name Changes', () => {
    it('should update presence when display name changes', () => {
      // Use the controllable mock

      mockUseAuth.mockReturnValue({
        user: {
          displayName: 'Initial Name',
          uid: 'test-user-id',
        },
      });

      const { rerender } = renderHook(() => usePresence('test-room'));

      expect(mockSetMyPresence).toHaveBeenCalledWith({
        newRoom: 'test-room',
        oldRoom: null,
        newDisplayName: 'Initial Name',
        oldDisplayName: 'Initial Name',
        removeOnDisconnect: false,
      });

      mockSetMyPresence.mockClear();

      // Change display name
      mockUseAuth.mockReturnValue({
        user: {
          displayName: 'Updated Name',
          uid: 'test-user-id',
        },
      });

      rerender();

      expect(mockSetMyPresence).toHaveBeenCalledWith({
        newRoom: 'test-room',
        oldRoom: 'test-room',
        newDisplayName: 'Updated Name',
        oldDisplayName: 'Initial Name',
        removeOnDisconnect: false,
      });
    });

    it('should not call setMyPresence if display name has not changed', () => {
      const { rerender } = renderHook(() => usePresence('test-room'));

      expect(mockSetMyPresence).toHaveBeenCalledTimes(1);

      // Rerender without changing display name
      rerender();

      // Should not call setMyPresence again
      expect(mockSetMyPresence).toHaveBeenCalledTimes(1);
    });

    it('should handle display name changing to empty string', () => {
      // Use the controllable mock

      mockUseAuth.mockReturnValue({
        user: {
          displayName: 'Test User',
          uid: 'test-user-id',
        },
      });

      const { rerender } = renderHook(() => usePresence('test-room'));

      mockSetMyPresence.mockClear();

      // Change display name to empty
      mockUseAuth.mockReturnValue({
        user: {
          displayName: '',
          uid: 'test-user-id',
        },
      });

      rerender();

      expect(mockSetMyPresence).toHaveBeenCalledWith({
        newRoom: 'test-room',
        oldRoom: 'test-room',
        newDisplayName: '',
        oldDisplayName: 'Test User',
        removeOnDisconnect: false,
      });
    });
  });

  describe('Realtime Room Behavior', () => {
    it('should set removeOnDisconnect to true for realtime rooms', () => {
      renderHook(() => usePresence('test-room', true));

      expect(mockSetMyPresence).toHaveBeenCalledWith({
        newRoom: 'test-room',
        oldRoom: null,
        newDisplayName: 'Test User',
        oldDisplayName: 'Test User',
        removeOnDisconnect: true,
      });
    });

    it('should set removeOnDisconnect to true for PUBLIC room', () => {
      renderHook(() => usePresence('PUBLIC'));

      expect(mockSetMyPresence).toHaveBeenCalledWith({
        newRoom: 'PUBLIC',
        oldRoom: null,
        newDisplayName: 'Test User',
        oldDisplayName: 'Test User',
        removeOnDisconnect: true,
      });
    });

    it('should set removeOnDisconnect to true for public room (lowercase)', () => {
      renderHook(() => usePresence('public'));

      expect(mockSetMyPresence).toHaveBeenCalledWith({
        newRoom: 'public',
        oldRoom: null,
        newDisplayName: 'Test User',
        oldDisplayName: 'Test User',
        removeOnDisconnect: true,
      });
    });

    it('should set removeOnDisconnect to false for private rooms by default', () => {
      renderHook(() => usePresence('private-room'));

      expect(mockSetMyPresence).toHaveBeenCalledWith({
        newRoom: 'private-room',
        oldRoom: null,
        newDisplayName: 'Test User',
        oldDisplayName: 'Test User',
        removeOnDisconnect: false,
      });
    });

    it('should override removeOnDisconnect for private rooms when roomRealtime is true', () => {
      renderHook(() => usePresence('private-room', true));

      expect(mockSetMyPresence).toHaveBeenCalledWith({
        newRoom: 'private-room',
        oldRoom: null,
        newDisplayName: 'Test User',
        oldDisplayName: 'Test User',
        removeOnDisconnect: true,
      });
    });
  });

  describe('Presence Cleanup', () => {
    it('should handle user leaving room', () => {
      const { rerender } = renderHook(({ roomId }) => usePresence(roomId), {
        initialProps: { roomId: 'room1' },
      });

      mockSetMyPresence.mockClear();

      // User leaves room (no new room)
      rerender({ roomId: '' });

      expect(mockSetMyPresence).toHaveBeenCalledWith({
        newRoom: '',
        oldRoom: 'room1',
        newDisplayName: 'Test User',
        oldDisplayName: 'Test User',
        removeOnDisconnect: false,
      });
    });

    it('should handle unmounting', () => {
      const { unmount } = renderHook(() => usePresence('test-room'));

      // Should have been called once on mount
      expect(mockSetMyPresence).toHaveBeenCalledTimes(1);

      // Unmount should not cause additional calls
      unmount();
      expect(mockSetMyPresence).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multiple Users Scenario', () => {
    it('should handle multiple users in same room', () => {
      // Simulate multiple users using the hook
      const user1Auth = {
        user: {
          displayName: 'User 1',
          uid: 'user1-id',
        },
      };

      const user2Auth = {
        user: {
          displayName: 'User 2',
          uid: 'user2-id',
        },
      };

      // Use the controllable mock

      // First user
      mockUseAuth.mockReturnValue(user1Auth);
      renderHook(() => usePresence('game-room'));

      expect(mockSetMyPresence).toHaveBeenCalledWith({
        newRoom: 'game-room',
        oldRoom: null,
        newDisplayName: 'User 1',
        oldDisplayName: 'User 1',
        removeOnDisconnect: false,
      });

      mockSetMyPresence.mockClear();

      // Second user
      mockUseAuth.mockReturnValue(user2Auth);
      renderHook(() => usePresence('game-room'));

      expect(mockSetMyPresence).toHaveBeenCalledWith({
        newRoom: 'game-room',
        oldRoom: null,
        newDisplayName: 'User 2',
        oldDisplayName: 'User 2',
        removeOnDisconnect: false,
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null room ID', () => {
      renderHook(() => usePresence(null as any));

      // When roomId is null and displayName hasn't changed, setMyPresence should not be called
      // because currentRoom starts as null and displayName starts as the current displayName
      expect(mockSetMyPresence).not.toHaveBeenCalled();
    });

    it('should handle undefined room ID', () => {
      renderHook(() => usePresence(undefined as any));

      expect(mockSetMyPresence).toHaveBeenCalledWith({
        newRoom: undefined,
        oldRoom: null,
        newDisplayName: 'Test User',
        oldDisplayName: 'Test User',
        removeOnDisconnect: false,
      });
    });

    it('should handle room ID with special characters', () => {
      renderHook(() => usePresence('room-with-special-chars_123!@#'));

      expect(mockSetMyPresence).toHaveBeenCalledWith({
        newRoom: 'room-with-special-chars_123!@#',
        oldRoom: null,
        newDisplayName: 'Test User',
        oldDisplayName: 'Test User',
        removeOnDisconnect: false,
      });
    });

    it('should handle very long room IDs', () => {
      const longRoomId = 'a'.repeat(1000);
      renderHook(() => usePresence(longRoomId));

      expect(mockSetMyPresence).toHaveBeenCalledWith({
        newRoom: longRoomId,
        oldRoom: null,
        newDisplayName: 'Test User',
        oldDisplayName: 'Test User',
        removeOnDisconnect: false,
      });
    });

    it('should handle display name with special characters', () => {
      mockUseAuth.mockReturnValue({
        user: {
          displayName: 'User (Admin) 🎮',
          uid: 'test-user-id',
        },
      });

      renderHook(() => usePresence('test-room'));

      expect(mockSetMyPresence).toHaveBeenCalledWith({
        newRoom: 'test-room',
        oldRoom: null,
        newDisplayName: 'User (Admin) 🎮',
        oldDisplayName: 'User (Admin) 🎮',
        removeOnDisconnect: false,
      });
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const { rerender } = renderHook(
        ({ roomId, roomRealtime }) => usePresence(roomId, roomRealtime),
        {
          initialProps: {
            roomId: 'test-room',
            roomRealtime: false,
          },
        }
      );

      expect(mockSetMyPresence).toHaveBeenCalledTimes(1);

      // Multiple rerenders with same props should not trigger setMyPresence
      rerender({ roomId: 'test-room', roomRealtime: false });
      rerender({ roomId: 'test-room', roomRealtime: false });
      rerender({ roomId: 'test-room', roomRealtime: false });

      expect(mockSetMyPresence).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid consecutive changes efficiently', () => {
      const { rerender } = renderHook(({ roomId }) => usePresence(roomId), {
        initialProps: { roomId: 'room1' },
      });

      // Rapid consecutive changes
      for (let i = 2; i <= 10; i++) {
        rerender({ roomId: `room${i}` });
      }

      // Should have been called for each change
      expect(mockSetMyPresence).toHaveBeenCalledTimes(10);
    });
  });

  describe('Integration Scenarios', () => {
    it('should work with user switching between multiple rooms', () => {
      const { rerender } = renderHook(({ roomId }) => usePresence(roomId), {
        initialProps: { roomId: 'lobby' },
      });

      // User goes to game room
      rerender({ roomId: 'game-room-1' });
      expect(mockSetMyPresence).toHaveBeenLastCalledWith({
        newRoom: 'game-room-1',
        oldRoom: 'lobby',
        newDisplayName: 'Test User',
        oldDisplayName: 'Test User',
        removeOnDisconnect: false,
      });

      // User switches to another game room
      rerender({ roomId: 'game-room-2' });
      expect(mockSetMyPresence).toHaveBeenLastCalledWith({
        newRoom: 'game-room-2',
        oldRoom: 'game-room-1',
        newDisplayName: 'Test User',
        oldDisplayName: 'Test User',
        removeOnDisconnect: false,
      });

      // User returns to lobby
      rerender({ roomId: 'lobby' });
      expect(mockSetMyPresence).toHaveBeenLastCalledWith({
        newRoom: 'lobby',
        oldRoom: 'game-room-2',
        newDisplayName: 'Test User',
        oldDisplayName: 'Test User',
        removeOnDisconnect: false,
      });
    });

    it('should handle user updating profile while in room', () => {
      // Use the controllable mock

      mockUseAuth.mockReturnValue({
        user: {
          displayName: 'Old Name',
          uid: 'test-user-id',
        },
      });

      const { rerender } = renderHook(() => usePresence('game-room'));

      // User updates their display name
      mockUseAuth.mockReturnValue({
        user: {
          displayName: 'New Name',
          uid: 'test-user-id',
        },
      });

      rerender();

      expect(mockSetMyPresence).toHaveBeenLastCalledWith({
        newRoom: 'game-room',
        oldRoom: 'game-room',
        newDisplayName: 'New Name',
        oldDisplayName: 'Old Name',
        removeOnDisconnect: false,
      });
    });
  });
});
