import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import useHybridPlayerList, { isLocalPlayer, isRemotePlayer } from '../useHybridPlayerList';
import { useLocalPlayers } from '../useLocalPlayers';
import usePlayerList from '../usePlayerList';

// Mock dependencies
vi.mock('../useLocalPlayers');
vi.mock('../usePlayerList');

describe('useHybridPlayerList Integration Tests', () => {
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
    },
    {
      id: 'local-2',
      name: 'Local Player 2',
      role: 'sub' as const,
      isActive: false,
      order: 2,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (usePlayerList as any).mockReturnValue(mockRemotePlayerList);
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

      expect(result.current).toHaveLength(4); // 2 local + 2 remote

      // Local players should be at the beginning (unshift)
      expect(result.current[0]).toMatchObject({
        displayName: 'Local Player 1',
        uid: 'local-local-1',
        isLocal: true,
        localId: 'local-1',
        role: 'dom',
        order: 1,
        isSelf: true, // isActive = true maps to isSelf = true
      });

      expect(result.current[1]).toMatchObject({
        displayName: 'Local Player 2',
        uid: 'local-local-2',
        isLocal: true,
        localId: 'local-2',
        role: 'sub',
        order: 2,
        isSelf: false, // isActive = false maps to isSelf = false
      });

      // Remote players should follow local players
      expect(result.current[2]).toMatchObject({
        displayName: 'Remote User 1',
        isLocal: false,
      });

      expect(result.current[3]).toMatchObject({
        displayName: 'Remote User 2',
        isLocal: false,
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

    it('should handle completely empty state', () => {
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
      const { result, rerender } = renderHook(() => useHybridPlayerList());

      // Initially no local players
      (useLocalPlayers as any).mockReturnValue({
        localPlayers: [],
        hasLocalPlayers: false,
        isLocalPlayerRoom: false,
      });

      rerender();
      expect(result.current).toHaveLength(2); // Only remote

      // Add local players
      (useLocalPlayers as any).mockReturnValue({
        localPlayers: mockLocalPlayers,
        hasLocalPlayers: true,
        isLocalPlayerRoom: true,
      });

      rerender();
      expect(result.current).toHaveLength(4); // Local + remote
    });

    it('should update when room changes', () => {
      (useLocalPlayers as any).mockReturnValue({
        localPlayers: mockLocalPlayers,
        hasLocalPlayers: true,
        isLocalPlayerRoom: true,
      });

      let { result, rerender } = renderHook(() => useHybridPlayerList());

      expect(result.current).toHaveLength(4); // Local players when in local multiplayer mode

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
