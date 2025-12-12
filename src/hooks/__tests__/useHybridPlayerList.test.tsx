import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import useHybridPlayerList, { isLocalPlayer, isRemotePlayer } from '../useHybridPlayerList';
import { useLocalPlayers } from '../useLocalPlayers';
import usePlayerList from '../usePlayerList';
import useAuth from '@/context/hooks/useAuth';

// Mock dependencies
vi.mock('../useLocalPlayers');
vi.mock('../usePlayerList');
vi.mock('@/context/hooks/useAuth');
vi.mock('@/context/hooks/useMessages', () => ({
  default: () => ({
    messages: [],
    loading: false,
  }),
}));

describe('useHybridPlayerList Integration Tests', () => {
  const mockUser = {
    uid: 'test-user-123',
    displayName: 'Test User',
    email: 'test@example.com',
  };

  const mockRemotePlayerList = [
    {
      displayName: 'Remote User 1',
      uid: 'remote-1',
      isSelf: false,
      location: 5,
      isFinished: false,
      status: 'active' as const,
      lastActivity: new Date('2024-01-01'),
    },
    {
      displayName: 'Remote User 2',
      uid: 'remote-2',
      isSelf: true,
      location: 3,
      isFinished: false,
      status: 'active' as const,
      lastActivity: new Date('2024-01-01'),
    },
  ];

  const mockLocalPlayers = [
    {
      id: 'local-1',
      name: 'Local Player 1',
      role: 'dom' as const,
      isActive: true,
      order: 1,
      deviceId: 'current_device',
      location: 0,
      isFinished: false,
    },
    {
      id: 'local-2',
      name: 'Local Player 2',
      role: 'sub' as const,
      isActive: false,
      order: 2,
      deviceId: 'current_device',
      location: 0,
      isFinished: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (usePlayerList as any).mockReturnValue(mockRemotePlayerList);
    (useAuth as any).mockReturnValue({ user: mockUser });
  });

  describe('Remote Players Only', () => {
    it('should return only remote players when no local players are configured', () => {
      (useLocalPlayers as any).mockReturnValue({
        localPlayers: [],
        hasLocalPlayers: false,
        isLocalPlayerRoom: false,
      });

      const { result } = renderHook(() => useHybridPlayerList());

      expect(result.current).toHaveLength(2);
      expect(result.current[0]).toMatchObject({
        displayName: 'Remote User 1',
        uid: 'remote-1',
        isLocal: false,
      });
      expect(result.current[1]).toMatchObject({
        displayName: 'Remote User 2',
        uid: 'remote-2',
        isLocal: false,
      });
    });
  });

  describe('Local Players Integration', () => {
    it('should include local players when in local multiplayer mode', () => {
      (useLocalPlayers as any).mockReturnValue({
        localPlayers: mockLocalPlayers,
        hasLocalPlayers: true,
        isLocalPlayerRoom: true,
      });

      const { result } = renderHook(() => useHybridPlayerList());

      expect(result.current).toHaveLength(2); // Only local players in local multiplayer mode

      // Local players should be sorted by order
      expect(result.current[0]).toMatchObject({
        displayName: 'Local Player 1',
        uid: 'local-local-1',
        isLocal: true,
        localId: 'local-1',
        role: 'dom',
        order: 1,
        isSelf: true, // isActive = true maps to isSelf = true
        location: 0,
        isFinished: false,
        status: 'active',
      });

      expect(result.current[1]).toMatchObject({
        displayName: 'Local Player 2',
        uid: 'local-local-2',
        isLocal: true,
        localId: 'local-2',
        role: 'sub',
        order: 2,
        isSelf: false, // isActive = false maps to isSelf = false
        location: 0,
        isFinished: false,
        status: 'active',
      });
    });

    it('should not include local players when not in local multiplayer mode', () => {
      (useLocalPlayers as any).mockReturnValue({
        localPlayers: mockLocalPlayers,
        hasLocalPlayers: false,
        isLocalPlayerRoom: false,
      });

      const { result } = renderHook(() => useHybridPlayerList());

      expect(result.current).toHaveLength(2); // Only remote players
      expect(result.current.every((player) => !player.isLocal)).toBe(true);
    });

    it('should not include local players when not in local player room', () => {
      (useLocalPlayers as any).mockReturnValue({
        localPlayers: mockLocalPlayers,
        hasLocalPlayers: true,
        isLocalPlayerRoom: false, // Not in local player room
      });

      const { result } = renderHook(() => useHybridPlayerList());

      expect(result.current).toHaveLength(2); // Only remote players
      expect(result.current.every((player) => !player.isLocal)).toBe(true);
    });

    it('should not include local players when hasLocalPlayers is false', () => {
      (useLocalPlayers as any).mockReturnValue({
        localPlayers: mockLocalPlayers,
        hasLocalPlayers: false, // No local players
        isLocalPlayerRoom: true,
      });

      const { result } = renderHook(() => useHybridPlayerList());

      expect(result.current).toHaveLength(2); // Only remote players
      expect(result.current.every((player) => !player.isLocal)).toBe(true);
    });
  });

  describe('Local Player Properties', () => {
    beforeEach(() => {
      (useLocalPlayers as any).mockReturnValue({
        localPlayers: mockLocalPlayers,
        hasLocalPlayers: true,
        isLocalPlayerRoom: true,
      });
    });

    it('should map local player properties correctly', () => {
      const { result } = renderHook(() => useHybridPlayerList());

      const localPlayer = result.current.find((p) => p.isLocal && p.localId === 'local-1');
      expect(localPlayer).toMatchObject({
        displayName: 'Local Player 1',
        uid: 'local-local-1', // Prefixed with 'local-'
        isSelf: true, // Active player is "self"
        location: 0, // Local players don't have board locations in this context
        isFinished: false,
        status: 'active',
        isLocal: true,
        localId: 'local-1',
        role: 'dom',
        order: 1,
      });

      expect(localPlayer?.lastActivity).toBeInstanceOf(Date);
    });

    it('should handle active/inactive local players correctly', () => {
      const { result } = renderHook(() => useHybridPlayerList());

      const activePlayer = result.current.find((p) => p.isLocal && p.localId === 'local-1');
      const inactivePlayer = result.current.find((p) => p.isLocal && p.localId === 'local-2');

      expect(activePlayer?.isSelf).toBe(true); // Active player
      expect(inactivePlayer?.isSelf).toBe(false); // Inactive player
    });
  });

  describe('Empty States', () => {
    it('should handle empty remote player list', () => {
      (usePlayerList as any).mockReturnValue([]);
      (useLocalPlayers as any).mockReturnValue({
        localPlayers: mockLocalPlayers,
        hasLocalPlayers: true,
        isLocalPlayerRoom: true,
      });

      const { result } = renderHook(() => useHybridPlayerList());

      expect(result.current).toHaveLength(2); // Only local players
      expect(result.current.every((player) => player.isLocal)).toBe(true);
    });

    it('should handle empty local player list', () => {
      (useLocalPlayers as any).mockReturnValue({
        localPlayers: [],
        hasLocalPlayers: false,
        isLocalPlayerRoom: false,
      });

      const { result } = renderHook(() => useHybridPlayerList());

      expect(result.current).toHaveLength(2); // Only remote players
      expect(result.current.every((player) => !player.isLocal)).toBe(true);
    });

    it('should handle completely empty state by showing current user', () => {
      (usePlayerList as any).mockReturnValue([]);
      (useLocalPlayers as any).mockReturnValue({
        localPlayers: [],
        hasLocalPlayers: false,
        isLocalPlayerRoom: false,
      });

      const { result } = renderHook(() => useHybridPlayerList());

      // Should show current user as fallback to prevent empty list
      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toMatchObject({
        displayName: 'Test User',
        uid: 'test-user-123',
        isSelf: true,
        isLocal: false,
        location: 0,
        isFinished: false,
        status: 'active',
      });
    });

    it('should not show fallback when user is null', () => {
      (useAuth as any).mockReturnValue({ user: null });
      (usePlayerList as any).mockReturnValue([]);
      (useLocalPlayers as any).mockReturnValue({
        localPlayers: [],
        hasLocalPlayers: false,
        isLocalPlayerRoom: false,
      });

      const { result } = renderHook(() => useHybridPlayerList());

      expect(result.current).toHaveLength(0);
    });
  });

  describe('Type Guards', () => {
    it('should export working type guards', () => {
      const localPlayer = {
        isLocal: true as const,
        localId: 'test',
        role: 'dom',
        order: 1,
        displayName: 'Test Local Player',
        uid: 'local-test',
        isSelf: false,
        location: 0,
        isFinished: false,
        status: 'active' as const,
        lastActivity: new Date(),
      };

      const remotePlayer = {
        isLocal: false as const,
        displayName: 'Test Remote Player',
        uid: 'remote-test',
        isSelf: false,
        location: 0,
        isFinished: false,
        status: 'active' as const,
        lastActivity: new Date(),
      };

      expect(isLocalPlayer(localPlayer)).toBe(true);
      expect(isLocalPlayer(remotePlayer)).toBe(false);
      expect(isRemotePlayer(remotePlayer)).toBe(true);
      expect(isRemotePlayer(localPlayer)).toBe(false);
    });
  });

  describe('Reactivity', () => {
    it('should update when local players change', () => {
      // Initially no local players
      (useLocalPlayers as any).mockReturnValue({
        localPlayers: [],
        hasLocalPlayers: false,
        isLocalPlayerRoom: false,
      });

      const { result, rerender } = renderHook(() => useHybridPlayerList());

      expect(result.current).toHaveLength(2); // Only remote

      // Add local players
      (useLocalPlayers as any).mockReturnValue({
        localPlayers: mockLocalPlayers,
        hasLocalPlayers: true,
        isLocalPlayerRoom: true,
      });

      rerender();
      expect(result.current).toHaveLength(2); // Only local players in local mode
    });

    it('should update when room changes', () => {
      (useLocalPlayers as any).mockReturnValue({
        localPlayers: mockLocalPlayers,
        hasLocalPlayers: true,
        isLocalPlayerRoom: true,
      });

      let { result, rerender } = renderHook(() => useHybridPlayerList());

      expect(result.current).toHaveLength(2); // Local players when in local multiplayer mode

      // Change to disable local players
      (useLocalPlayers as any).mockReturnValue({
        localPlayers: [],
        hasLocalPlayers: false,
        isLocalPlayerRoom: false,
      });
      rerender();

      expect(result.current).toHaveLength(2); // Only remote players when not in local mode
    });
  });
});
