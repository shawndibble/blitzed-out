/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalPlayers } from '../useLocalPlayers';
import type { LocalPlayer, LocalSessionSettings } from '@/types';

// Global mock state object - this approach works better with isolate: false
const mockState = {
  session: null as any,
  error: null as string | null,
  isLoading: false,
};

// Mock functions - must be declared before the mock
const mockSetSession = vi.fn();
const mockClearSession = vi.fn();
const mockSetError = vi.fn();
const mockSetLoading = vi.fn();
const mockInitSession = vi.fn();
const mockLoadSession = vi.fn();
const mockNextLocalPlayer = vi.fn();

// Mock the local player store
vi.mock('@/stores/localPlayerStore', () => ({
  useLocalPlayerStore: () => ({
    get session() {
      return mockState.session;
    },
    get error() {
      return mockState.error;
    },
    get isLoading() {
      return mockState.isLoading;
    },
    hasLocalPlayers: () =>
      mockState.session?.isActive === true && mockState.session?.players.length > 0,
    isLocalPlayerRoom: () => mockState.session?.isActive === true,
    getCurrentPlayer: () => {
      if (!mockState.session || !mockState.session.isActive) return null;
      const index = mockState.session.currentPlayerIndex;
      return mockState.session.players[index] || null;
    },
    setSession: mockSetSession,
    clearSession: mockClearSession,
    setError: mockSetError,
    setLoading: mockSetLoading,
    initSession: mockInitSession,
    loadSession: mockLoadSession,
    nextLocalPlayer: mockNextLocalPlayer,
    updateSessionSettings: vi.fn(),
  }),
}));

describe('useLocalPlayers', () => {
  let mockPlayers: LocalPlayer[];
  let mockSettings: LocalSessionSettings;

  beforeEach(() => {
    mockPlayers = [
      {
        id: 'player-1',
        name: 'Player One',
        role: 'sub',
        order: 0,
        isActive: true,
        deviceId: 'device-123',
        location: 0,
        isFinished: false,
      },
      {
        id: 'player-2',
        name: 'Player Two',
        role: 'dom',
        order: 1,
        isActive: false,
        deviceId: 'device-123',
        location: 0,
        isFinished: false,
      },
    ];

    mockSettings = {
      showTurnTransitions: true,
      enableTurnSounds: true,
      showPlayerAvatars: true,
    };

    // Reset mock state
    mockState.session = null;
    mockState.error = null;
    mockState.isLoading = false;

    // Clear all mock calls
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    test('should return correct initial state with no session', () => {
      const { result } = renderHook(() => useLocalPlayers());

      expect(result.current.session).toBeNull();
      expect(result.current.localPlayers).toEqual([]);
      expect(result.current.currentPlayer).toBeNull();
      expect(result.current.currentPlayerIndex).toBe(-1);
      expect(result.current.sessionSettings).toBeUndefined();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasLocalPlayers).toBe(false);
      expect(result.current.isLocalPlayerRoom).toBe(false);
      expect(result.current.playerCount).toBe(0);
      expect(result.current.isValidSession).toBe(false);
    });

    test('should return correct state with active session', () => {
      mockState.session = {
        id: 'test-session',
        roomId: 'TEST-ROOM',
        players: mockPlayers,
        currentPlayerIndex: 0,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: mockSettings,
      };

      const { result } = renderHook(() => useLocalPlayers());

      expect(result.current.session).toBe(mockState.session);
      expect(result.current.localPlayers).toEqual(mockPlayers);
      expect(result.current.currentPlayer).toBe(mockPlayers[0]);
      expect(result.current.currentPlayerIndex).toBe(0);
      expect(result.current.sessionSettings).toBe(mockSettings);
      expect(result.current.hasLocalPlayers).toBe(true);
      expect(result.current.isLocalPlayerRoom).toBe(true);
      expect(result.current.playerCount).toBe(2);
      expect(result.current.isValidSession).toBe(true);
    });
  });

  describe('Action Functions', () => {
    test('createLocalSession should call initSession with correct parameters', async () => {
      const { result } = renderHook(() => useLocalPlayers());

      await act(async () => {
        await result.current.createLocalSession('TEST-ROOM', mockPlayers, mockSettings);
      });

      expect(mockInitSession).toHaveBeenCalledWith('TEST-ROOM', mockPlayers, mockSettings);
    });

    test('loadLocalSession should call loadSession with correct parameters', async () => {
      const { result } = renderHook(() => useLocalPlayers());

      await act(async () => {
        await result.current.loadLocalSession('test-session-id');
      });

      expect(mockLoadSession).toHaveBeenCalledWith('test-session-id');
    });

    test('advanceToNextPlayer should call nextLocalPlayer', async () => {
      const { result } = renderHook(() => useLocalPlayers());

      await act(async () => {
        await result.current.advanceToNextPlayer();
      });

      expect(mockNextLocalPlayer).toHaveBeenCalled();
    });

    test('clearLocalSession should call clearSession', () => {
      const { result } = renderHook(() => useLocalPlayers());

      act(() => {
        result.current.clearLocalSession();
      });

      expect(mockClearSession).toHaveBeenCalled();
    });
  });

  describe('Utility Functions', () => {
    beforeEach(() => {
      mockState.session = {
        id: 'test-session',
        roomId: 'TEST-ROOM',
        players: mockPlayers,
        currentPlayerIndex: 0,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: mockSettings,
      };
    });

    test('getPlayerByIndex should return correct player', () => {
      const { result } = renderHook(() => useLocalPlayers());

      expect(result.current.getPlayerByIndex(0)).toBe(mockPlayers[0]);
      expect(result.current.getPlayerByIndex(1)).toBe(mockPlayers[1]);
      expect(result.current.getPlayerByIndex(2)).toBeNull();
      expect(result.current.getPlayerByIndex(-1)).toBeNull();
    });

    test('getPlayerById should return correct player', () => {
      const { result } = renderHook(() => useLocalPlayers());

      expect(result.current.getPlayerById('player-1')).toBe(mockPlayers[0]);
      expect(result.current.getPlayerById('player-2')).toBe(mockPlayers[1]);
      expect(result.current.getPlayerById('non-existent')).toBeNull();
    });

    test('isPlayerActive should return correct active state', () => {
      const { result } = renderHook(() => useLocalPlayers());

      expect(result.current.isPlayerActive('player-1')).toBe(true);
      expect(result.current.isPlayerActive('player-2')).toBe(false);
      expect(result.current.isPlayerActive('non-existent')).toBe(false);
    });

    test('getNextPlayer should return next player in order', () => {
      const { result } = renderHook(() => useLocalPlayers());

      expect(result.current.getNextPlayer()).toBe(mockPlayers[1]); // Next from index 0
    });

    test('getNextPlayer should wrap around to first player', () => {
      mockState.session.currentPlayerIndex = 1; // Set to last player

      const { result } = renderHook(() => useLocalPlayers());

      expect(result.current.getNextPlayer()).toBe(mockPlayers[0]); // Should wrap to first
    });

    test('getPreviousPlayer should return previous player in order', () => {
      mockState.session.currentPlayerIndex = 1; // Set to second player

      const { result } = renderHook(() => useLocalPlayers());

      expect(result.current.getPreviousPlayer()).toBe(mockPlayers[0]); // Previous from index 1
    });

    test('getPreviousPlayer should wrap around to last player', () => {
      mockState.session.currentPlayerIndex = 0; // Set to first player

      const { result } = renderHook(() => useLocalPlayers());

      expect(result.current.getPreviousPlayer()).toBe(mockPlayers[1]); // Should wrap to last
    });

    test('utility functions should handle empty player list', () => {
      mockState.session.players = [];
      mockState.session.currentPlayerIndex = 0;

      const { result } = renderHook(() => useLocalPlayers());

      expect(result.current.getNextPlayer()).toBeNull();
      expect(result.current.getPreviousPlayer()).toBeNull();
      expect(result.current.getPlayerByIndex(0)).toBeNull();
      expect(result.current.getPlayerById('any-id')).toBeNull();
    });
  });

  describe('Computed Properties', () => {
    test('isValidSession should be true for active session with 2+ players', () => {
      mockState.session = {
        id: 'test-session',
        roomId: 'TEST-ROOM',
        players: mockPlayers,
        currentPlayerIndex: 0,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: mockSettings,
      };

      const { result } = renderHook(() => useLocalPlayers());

      expect(result.current.isValidSession).toBe(true);
    });

    test('isValidSession should be false for inactive session', () => {
      mockState.session = {
        id: 'test-session',
        roomId: 'TEST-ROOM',
        players: mockPlayers,
        currentPlayerIndex: 0,
        isActive: false, // Inactive
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: mockSettings,
      };

      const { result } = renderHook(() => useLocalPlayers());

      expect(result.current.isValidSession).toBe(false);
    });

    test('isValidSession should be false for session with < 2 players', () => {
      mockState.session = {
        id: 'test-session',
        roomId: 'TEST-ROOM',
        players: [mockPlayers[0]], // Only 1 player
        currentPlayerIndex: 0,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: mockSettings,
      };

      const { result } = renderHook(() => useLocalPlayers());

      expect(result.current.isValidSession).toBe(false);
    });
  });
});
