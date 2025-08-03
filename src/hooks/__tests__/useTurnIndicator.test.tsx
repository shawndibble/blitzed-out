import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import useTurnIndicator from '../useTurnIndicator';
import type { LocalPlayer } from '@/types';

// Player type from usePlayerList
interface Player {
  displayName: string;
  uid: string;
  isSelf: boolean;
  location: number;
  isFinished: boolean;
  status: 'active' | 'idle' | 'away';
  lastActivity: Date;
}

// Mock dependencies
vi.mock('../usePlayerList', () => ({
  default: vi.fn(() => []),
}));

vi.mock('../useLocalPlayers', () => ({
  useLocalPlayers: vi.fn(() => ({
    localPlayers: [],
    hasLocalPlayers: false,
    isLocalPlayerRoom: false,
    currentPlayer: null,
  })),
}));

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

const mockUsePlayerList = vi.mocked(await import('../usePlayerList')).default;
const mockUseLocalPlayers = vi.mocked(await import('../useLocalPlayers')).useLocalPlayers;

// Helper to create complete mock for useLocalPlayers
const createLocalPlayersMock = (overrides = {}) => ({
  session: null,
  localPlayers: [],
  currentPlayer: null,
  currentPlayerIndex: 0,
  sessionSettings: {
    showTurnTransitions: true,
    enableTurnSounds: true,
    showPlayerAvatars: true,
  },
  error: null,
  isLoading: false,
  hasLocalPlayers: false,
  isLocalPlayerRoom: false,
  playerCount: 0,
  isValidSession: false,
  createLocalSession: vi.fn(),
  loadLocalSession: vi.fn(),
  clearLocalSession: vi.fn(),
  advanceToNextPlayer: vi.fn(),
  updateSettings: vi.fn(),
  getPlayerByIndex: vi.fn(),
  getPlayerById: vi.fn(),
  isPlayerActive: vi.fn(),
  getNextPlayer: vi.fn(),
  getPreviousPlayer: vi.fn(),
  setSession: vi.fn(),
  setError: vi.fn(),
  setLoading: vi.fn(),
  ...overrides,
});

describe('useTurnIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Remote Players Mode', () => {
    const remotePlayers: Player[] = [
      {
        uid: 'user1',
        displayName: 'Player 1',
        isSelf: false,
        location: 0,
        isFinished: false,
        status: 'active',
        lastActivity: new Date(),
      },
      {
        uid: 'user2',
        displayName: 'Player 2',
        isSelf: false,
        location: 0,
        isFinished: false,
        status: 'active',
        lastActivity: new Date(),
      },
      {
        uid: 'user3',
        displayName: 'Player 3',
        isSelf: false,
        location: 0,
        isFinished: false,
        status: 'active',
        lastActivity: new Date(),
      },
    ];

    beforeEach(() => {
      mockUseLocalPlayers.mockReturnValue(createLocalPlayersMock());
      mockUsePlayerList.mockReturnValue(remotePlayers);
    });

    it('should return null when no message is provided', () => {
      const { result } = renderHook(() => useTurnIndicator());
      expect(result.current).toBeNull();
    });

    it('should return null when only one player exists', () => {
      mockUsePlayerList.mockReturnValue([remotePlayers[0]]);

      const message = { uid: 'user1' };
      const { result } = renderHook(() => useTurnIndicator(message));

      expect(result.current).toBeNull();
    });

    it('should return next player in remote mode', () => {
      const message = { uid: 'user1' };
      const { result } = renderHook(() => useTurnIndicator(message));

      expect(result.current).toEqual(remotePlayers[1]);
    });

    it('should wrap around to first player when last player finishes turn', () => {
      const message = { uid: 'user3' };
      const { result } = renderHook(() => useTurnIndicator(message));

      expect(result.current).toEqual(remotePlayers[0]);
    });

    it('should skip finished players', () => {
      const playersWithFinished = [
        ...remotePlayers,
        {
          uid: 'user4',
          displayName: 'Player 4',
          isSelf: false,
          location: 0,
          isFinished: true,
          status: 'active' as const,
          lastActivity: new Date(),
        },
      ];
      mockUsePlayerList.mockReturnValue(playersWithFinished);

      const message = { uid: 'user3' };
      const { result } = renderHook(() => useTurnIndicator(message));

      // Should skip finished player and return first unfinished player
      expect(result.current).toEqual(remotePlayers[0]);
    });

    it('should return null when player is not found', () => {
      const message = { uid: 'unknown_user' };
      const { result } = renderHook(() => useTurnIndicator(message));

      expect(result.current).toBeNull();
    });

    it('should handle empty player list', () => {
      mockUsePlayerList.mockReturnValue([]);

      const message = { uid: 'user1' };
      const { result } = renderHook(() => useTurnIndicator(message));

      expect(result.current).toBeNull();
    });
  });

  describe('Local Players Mode', () => {
    const localPlayers: LocalPlayer[] = [
      {
        id: 'local1',
        name: 'Local Player 1',
        role: 'dom',
        order: 0,
        isActive: true,
        deviceId: 'current_device',
        location: 0,
        isFinished: false,
      },
      {
        id: 'local2',
        name: 'Local Player 2',
        role: 'sub',
        order: 1,
        isActive: false,
        deviceId: 'current_device',
        location: 0,
        isFinished: false,
      },
      {
        id: 'local3',
        name: 'Local Player 3',
        role: 'vers',
        order: 2,
        isActive: false,
        deviceId: 'current_device',
        location: 0,
        isFinished: false,
      },
    ];

    beforeEach(() => {
      mockUseLocalPlayers.mockReturnValue(
        createLocalPlayersMock({
          localPlayers,
          currentPlayer: localPlayers[0],
          hasLocalPlayers: true,
          isLocalPlayerRoom: true,
          playerCount: localPlayers.length,
          isValidSession: true,
        })
      );
      mockUsePlayerList.mockReturnValue([]);
    });

    it('should return next local player based on displayName match', () => {
      const message = { uid: 'remote_user', displayName: 'Local Player 1' };
      const { result } = renderHook(() => useTurnIndicator(message));

      expect(result.current).toEqual({
        uid: 'local-local2',
        displayName: 'Local Player 2',
        isSelf: false,
        location: 0,
        isFinished: false,
        status: 'active',
        lastActivity: expect.any(Date),
      });
    });

    it('should wrap around to first player in local mode', () => {
      const message = { uid: 'remote_user', displayName: 'Local Player 3' };
      const { result } = renderHook(() => useTurnIndicator(message));

      expect(result.current).toEqual({
        uid: 'local-local1',
        displayName: 'Local Player 1',
        isSelf: false,
        isFinished: false,
      });
    });

    it('should fall back to active player when displayName not found', () => {
      const message = { uid: 'remote_user', displayName: 'Unknown Player' };
      const { result } = renderHook(() => useTurnIndicator(message));

      // Should fall back to current active player (local1) and return next (local2)
      expect(result.current).toEqual({
        uid: 'local-local2',
        displayName: 'Local Player 2',
        isSelf: false,
        location: 0,
        isFinished: false,
        status: 'active',
        lastActivity: expect.any(Date),
      });
    });

    it('should return null when only one local player exists', () => {
      mockUseLocalPlayers.mockReturnValue(
        createLocalPlayersMock({
          localPlayers: [localPlayers[0]],
          hasLocalPlayers: true,
          isLocalPlayerRoom: true,
          currentPlayer: localPlayers[0],
          playerCount: 1,
        })
      );

      const message = { uid: 'remote_user', displayName: 'Local Player 1' };
      const { result } = renderHook(() => useTurnIndicator(message));

      expect(result.current).toBeNull();
    });

    it('should return null when no active player found and name not matched', () => {
      const localPlayersNoActive = localPlayers.map((p) => ({ ...p, isActive: false }));
      mockUseLocalPlayers.mockReturnValue(
        createLocalPlayersMock({
          localPlayers: localPlayersNoActive,
          hasLocalPlayers: true,
          isLocalPlayerRoom: true,
          currentPlayer: null,
          playerCount: localPlayersNoActive.length,
        })
      );

      const message = { uid: 'remote_user', displayName: 'Unknown Player' };
      const { result } = renderHook(() => useTurnIndicator(message));

      expect(result.current).toBeNull();
    });

    it('should handle unsorted local players correctly', () => {
      const unsortedPlayers = [
        { ...localPlayers[2], order: 2 }, // Should be third
        { ...localPlayers[0], order: 0 }, // Should be first
        { ...localPlayers[1], order: 1 }, // Should be second
      ];

      mockUseLocalPlayers.mockReturnValue(
        createLocalPlayersMock({
          localPlayers: unsortedPlayers,
          hasLocalPlayers: true,
          isLocalPlayerRoom: true,
          currentPlayer: unsortedPlayers[1],
          playerCount: unsortedPlayers.length,
        })
      );

      const message = { uid: 'remote_user', displayName: 'Local Player 1' };
      const { result } = renderHook(() => useTurnIndicator(message));

      // Should correctly sort and return next player
      expect(result.current?.displayName).toBe('Local Player 2');
    });
  });

  describe('Mode Detection', () => {
    it('should use remote players when hasLocalPlayers is false', () => {
      const remotePlayers: Player[] = [
        {
          uid: 'user1',
          displayName: 'Remote Player 1',
          isSelf: false,
          location: 0,
          isFinished: false,
          status: 'active' as const,
          lastActivity: new Date(),
        },
        {
          uid: 'user2',
          displayName: 'Remote Player 2',
          isSelf: false,
          location: 0,
          isFinished: false,
          status: 'active' as const,
          lastActivity: new Date(),
        },
      ];

      mockUseLocalPlayers.mockReturnValue(createLocalPlayersMock());
      mockUsePlayerList.mockReturnValue(remotePlayers);

      const message = { uid: 'user1' };
      const { result } = renderHook(() => useTurnIndicator(message));

      expect(result.current).toEqual(remotePlayers[1]);
    });

    it('should use remote players when isLocalPlayerRoom is false', () => {
      const remotePlayers: Player[] = [
        {
          uid: 'user1',
          displayName: 'Remote Player 1',
          isSelf: false,
          location: 0,
          isFinished: false,
          status: 'active' as const,
          lastActivity: new Date(),
        },
        {
          uid: 'user2',
          displayName: 'Remote Player 2',
          isSelf: false,
          location: 0,
          isFinished: false,
          status: 'active' as const,
          lastActivity: new Date(),
        },
      ];

      mockUseLocalPlayers.mockReturnValue(
        createLocalPlayersMock({
          localPlayers: [
            {
              id: 'local1',
              name: 'Local Player 1',
              role: 'dom',
              order: 0,
              isActive: true,
              deviceId: 'current_device',
              isFinished: false,
            },
          ],
          hasLocalPlayers: true,
          isLocalPlayerRoom: false, // This should make it use remote players
          currentPlayer: null,
          playerCount: 1,
        })
      );
      mockUsePlayerList.mockReturnValue(remotePlayers);

      const message = { uid: 'user1' };
      const { result } = renderHook(() => useTurnIndicator(message));

      expect(result.current).toEqual(remotePlayers[1]);
    });
  });

  describe('Hook Updates', () => {
    it('should update when message changes', () => {
      const remotePlayers: Player[] = [
        {
          uid: 'user1',
          displayName: 'Player 1',
          isSelf: false,
          location: 0,
          isFinished: false,
          status: 'active' as const,
          lastActivity: new Date(),
        },
        {
          uid: 'user2',
          displayName: 'Player 2',
          isSelf: false,
          location: 0,
          isFinished: false,
          status: 'active' as const,
          lastActivity: new Date(),
        },
        {
          uid: 'user3',
          displayName: 'Player 3',
          isSelf: false,
          location: 0,
          isFinished: false,
          status: 'active' as const,
          lastActivity: new Date(),
        },
      ];

      mockUseLocalPlayers.mockReturnValue(createLocalPlayersMock());
      mockUsePlayerList.mockReturnValue(remotePlayers);

      const { result, rerender } = renderHook(({ message }) => useTurnIndicator(message), {
        initialProps: { message: { uid: 'user1' } },
      });

      expect(result.current).toEqual(remotePlayers[1]);

      // Update message to different user
      rerender({ message: { uid: 'user2' } });
      expect(result.current).toEqual(remotePlayers[2]);
    });

    it('should update when player list changes', () => {
      const initialPlayers: Player[] = [
        {
          uid: 'user1',
          displayName: 'Player 1',
          isSelf: false,
          location: 0,
          isFinished: false,
          status: 'active' as const,
          lastActivity: new Date(),
        },
        {
          uid: 'user2',
          displayName: 'Player 2',
          isSelf: false,
          location: 0,
          isFinished: false,
          status: 'active' as const,
          lastActivity: new Date(),
        },
      ];

      mockUseLocalPlayers.mockReturnValue(createLocalPlayersMock());
      mockUsePlayerList.mockReturnValue(initialPlayers);

      const { result } = renderHook(() => useTurnIndicator({ uid: 'user1' }));
      expect(result.current).toEqual(initialPlayers[1]);

      // Add a third player
      const updatedPlayers = [
        ...initialPlayers,
        {
          uid: 'user3',
          displayName: 'Player 3',
          isSelf: false,
          location: 0,
          isFinished: false,
          status: 'active' as const,
          lastActivity: new Date(),
        },
      ];
      mockUsePlayerList.mockReturnValue(updatedPlayers);

      // Re-render should pick up the change
      const { result: newResult } = renderHook(() => useTurnIndicator({ uid: 'user2' }));
      expect(newResult.current).toEqual(updatedPlayers[2]);
    });
  });
});
