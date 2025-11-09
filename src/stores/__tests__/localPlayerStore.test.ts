import type { LocalPlayer, LocalSessionSettings } from '@/types';
import { act, renderHook } from '@testing-library/react';
/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useLocalPlayerStore } from '../localPlayerStore';

// Mock the local player service
vi.mock('@/services/localPlayerService', () => ({
  localPlayerService: {
    createSession: vi.fn(),
    getSession: vi.fn(),
    advanceLocalTurn: vi.fn(),
    clearCurrentSession: vi.fn(),
  },
}));

// Mock the database
vi.mock('@/stores/store', () => ({
  default: {
    localPlayerSessions: {
      where: vi.fn(),
      add: vi.fn(),
    },
  },
}));

// Mock the settings store
vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: {
    getState: vi.fn(() => ({
      settings: { gameMode: 'online' as const, room: 'PUBLIC' },
      updateSettings: vi.fn(),
      setLocale: vi.fn(),
      resetSettings: vi.fn(),
      updateSelectedAction: vi.fn(),
      removeSelectedAction: vi.fn(),
      clearSelectedActions: vi.fn(),
      getSelectedActionsByType: vi.fn(),
    })),
  },
}));

describe('LocalPlayerStore', () => {
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
        sound: '',
        gender: 'non-binary',
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
        sound: '',
        gender: 'non-binary',
      },
    ];

    mockSettings = {
      showTurnTransitions: true,
      enableTurnSounds: true,
      showPlayerAvatars: true,
    };

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    test('should have correct initial state', () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      expect(result.current.session).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasLocalPlayers()).toBe(false);
      expect(result.current.isLocalPlayerRoom()).toBe(false);
      expect(result.current.getCurrentPlayer()).toBeNull();
    });
  });

  describe('Basic Actions', () => {
    test('should set session correctly', () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      const mockSession = {
        id: 'test-session',
        roomId: 'TEST-ROOM',
        players: mockPlayers,
        currentPlayerIndex: 0,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: mockSettings,
      };

      act(() => {
        result.current.setSession(mockSession);
      });

      expect(result.current.session).toStrictEqual(mockSession);
      expect(result.current.error).toBeNull();
    });

    test('should clear session correctly', () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      // Set a session first
      const mockSession = {
        id: 'test-session',
        roomId: 'TEST-ROOM',
        players: mockPlayers,
        currentPlayerIndex: 0,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: mockSettings,
      };

      act(() => {
        result.current.setSession(mockSession);
      });

      expect(result.current.session).toStrictEqual(mockSession);

      act(() => {
        result.current.clearSession();
      });

      expect(result.current.session).toBeNull();
      expect(result.current.error).toBeNull();
    });

    test('should set error correctly', () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');
      expect(result.current.isLoading).toBe(false);
    });

    test('should set loading state correctly', () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Getters', () => {
    test('hasLocalPlayers should return true for active session with players', () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      const mockSession = {
        id: 'test-session',
        roomId: 'TEST-ROOM',
        players: mockPlayers,
        currentPlayerIndex: 0,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: mockSettings,
      };

      act(() => {
        result.current.setSession(mockSession);
      });

      expect(result.current.hasLocalPlayers()).toBe(true);
    });

    test('hasLocalPlayers should return false for inactive session', () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      const mockSession = {
        id: 'test-session',
        roomId: 'TEST-ROOM',
        players: mockPlayers,
        currentPlayerIndex: 0,
        isActive: false, // Inactive
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: mockSettings,
      };

      act(() => {
        result.current.setSession(mockSession);
      });

      expect(result.current.hasLocalPlayers()).toBe(false);
    });

    test('isLocalPlayerRoom should return true for active session', () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      const mockSession = {
        id: 'test-session',
        roomId: 'TEST-ROOM',
        players: mockPlayers,
        currentPlayerIndex: 0,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: mockSettings,
      };

      act(() => {
        result.current.setSession(mockSession);
      });

      expect(result.current.isLocalPlayerRoom()).toBe(true);
    });

    test('getCurrentPlayer should return current active player', () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      const mockSession = {
        id: 'test-session',
        roomId: 'TEST-ROOM',
        players: mockPlayers,
        currentPlayerIndex: 1, // Second player
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: mockSettings,
      };

      act(() => {
        result.current.setSession(mockSession);
      });

      const currentPlayer = result.current.getCurrentPlayer();
      expect(currentPlayer).toStrictEqual(mockPlayers[1]);
    });

    test('getCurrentPlayer should return null for invalid index', () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      const mockSession = {
        id: 'test-session',
        roomId: 'TEST-ROOM',
        players: mockPlayers,
        currentPlayerIndex: 99, // Invalid index
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: mockSettings,
      };

      act(() => {
        result.current.setSession(mockSession);
      });

      const currentPlayer = result.current.getCurrentPlayer();
      expect(currentPlayer).toBeNull();
    });
  });

  describe('Async Actions', () => {
    test('initSession should handle success', async () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      const mockSession = {
        id: 'test-session',
        roomId: 'TEST-ROOM',
        players: mockPlayers,
        currentPlayerIndex: 0,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: mockSettings,
      };

      // Mock the service
      const { localPlayerService } = await import('@/services/localPlayerService');
      vi.mocked(localPlayerService.createSession).mockResolvedValue(mockSession);

      await act(async () => {
        await result.current.initSession('TEST-ROOM', mockPlayers, mockSettings);
      });

      expect(result.current.session).toEqual(mockSession);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    test('initSession should handle errors', async () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      // Mock the service to throw an error
      const { localPlayerService } = await import('@/services/localPlayerService');
      vi.mocked(localPlayerService.createSession).mockRejectedValue(new Error('Creation failed'));

      await act(async () => {
        await result.current.initSession('TEST-ROOM', mockPlayers, mockSettings);
      });

      expect(result.current.session).toBeNull();
      expect(result.current.error).toBe('Creation failed');
      expect(result.current.isLoading).toBe(false);
    });

    test('loadSession should handle success', async () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      const mockSession = {
        id: 'test-session',
        roomId: 'TEST-ROOM',
        players: mockPlayers,
        currentPlayerIndex: 0,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: mockSettings,
      };

      // Mock the service
      const { localPlayerService } = await import('@/services/localPlayerService');
      vi.mocked(localPlayerService.getSession).mockResolvedValue(mockSession);

      await act(async () => {
        await result.current.loadSession('test-session');
      });

      expect(result.current.session).toEqual(mockSession);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    test('nextLocalPlayer should handle success', async () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      const initialSession = {
        id: 'test-session',
        roomId: 'TEST-ROOM',
        players: mockPlayers,
        currentPlayerIndex: 0,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: mockSettings,
      };

      const updatedSession = {
        ...initialSession,
        currentPlayerIndex: 1, // Advanced to next player
      };

      // Set initial session
      act(() => {
        result.current.setSession(initialSession);
      });

      // Mock the service
      const { localPlayerService } = await import('@/services/localPlayerService');
      vi.mocked(localPlayerService.advanceLocalTurn).mockResolvedValue(mockPlayers[1]);
      vi.mocked(localPlayerService.getSession).mockResolvedValue(updatedSession);

      await act(async () => {
        await result.current.nextLocalPlayer();
      });

      expect(result.current.session).toEqual(updatedSession);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    test('nextLocalPlayer should handle no active session', async () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      // Ensure we start with no session
      await act(async () => {
        await result.current.clearSession();
      });

      expect(result.current.session).toBeNull();

      await act(async () => {
        await result.current.nextLocalPlayer();
      });

      expect(result.current.error).toBe('No active session');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Session Persistence', () => {
    test('clearSession should delete session from Dexie database', async () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      const mockSession = {
        id: 'test-session-123',
        roomId: 'TEST-ROOM',
        players: mockPlayers,
        currentPlayerIndex: 0,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: mockSettings,
      };

      // Set a session first
      act(() => {
        result.current.setSession(mockSession);
      });

      expect(result.current.session).toStrictEqual(mockSession);

      // Mock database delete chain
      const mockDelete = vi.fn().mockResolvedValue(undefined);
      const mockEquals = vi.fn().mockReturnValue({ delete: mockDelete });
      const mockWhere = vi.fn().mockReturnValue({ equals: mockEquals });

      const db = await import('@/stores/store');
      vi.mocked(db.default.localPlayerSessions.where).mockImplementation(mockWhere);

      // Clear the session
      await act(async () => {
        await result.current.clearSession();
      });

      // Verify session was cleared
      expect(result.current.session).toBeNull();
      expect(result.current.error).toBeNull();

      // Verify database delete was called
      expect(mockWhere).toHaveBeenCalledWith('sessionId');
      expect(mockEquals).toHaveBeenCalledWith('test-session-123');
      expect(mockDelete).toHaveBeenCalled();
    });

    test('clearSession should handle database deletion errors gracefully', async () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      const mockSession = {
        id: 'test-session-456',
        roomId: 'TEST-ROOM',
        players: mockPlayers,
        currentPlayerIndex: 0,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: mockSettings,
      };

      act(() => {
        result.current.setSession(mockSession);
      });

      // Mock database delete to fail
      const mockDelete = vi.fn().mockRejectedValue(new Error('Database error'));
      const mockEquals = vi.fn().mockReturnValue({ delete: mockDelete });
      const mockWhere = vi.fn().mockReturnValue({ equals: mockEquals });

      const db = await import('@/stores/store');
      vi.mocked(db.default.localPlayerSessions.where).mockImplementation(mockWhere);

      // Clear should still succeed even if database delete fails
      await act(async () => {
        await result.current.clearSession();
      });

      expect(result.current.session).toBeNull();
      expect(result.current.error).toBeNull();
    });

    test('clearSession should handle null session gracefully', async () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      // Ensure no session exists
      expect(result.current.session).toBeNull();

      // Clear should not throw
      await act(async () => {
        await result.current.clearSession();
      });

      expect(result.current.session).toBeNull();
      expect(result.current.error).toBeNull();
    });

    test('clearSession should remove wizard fields from settings store', async () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      const mockSession = {
        id: 'test-session-789',
        roomId: 'TEST-ROOM',
        players: mockPlayers,
        currentPlayerIndex: 0,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: mockSettings,
      };

      act(() => {
        result.current.setSession(mockSession);
      });

      // Mock settings store with wizard fields
      const mockUpdateSettings = vi.fn();
      const mockSettingsWithWizardFields = {
        gameMode: 'local' as const,
        room: 'TEST',
        localPlayersData: [{ id: '1', name: 'Test' }],
        localPlayerSessionSettings: { showTurnTransitions: true },
        hasLocalPlayers: true,
      };

      const { useSettingsStore } = await import('@/stores/settingsStore');
      vi.mocked(useSettingsStore.getState).mockReturnValue({
        settings: mockSettingsWithWizardFields,
        updateSettings: mockUpdateSettings,
        setLocale: vi.fn(),
        resetSettings: vi.fn(),
        updateSelectedAction: vi.fn(),
        removeSelectedAction: vi.fn(),
        clearSelectedActions: vi.fn(),
        getSelectedActionsByType: vi.fn(),
      });

      // Mock database delete
      const mockDelete = vi.fn().mockResolvedValue(undefined);
      const mockEquals = vi.fn().mockReturnValue({ delete: mockDelete });
      const mockWhere = vi.fn().mockReturnValue({ equals: mockEquals });
      const db = await import('@/stores/store');
      vi.mocked(db.default.localPlayerSessions.where).mockImplementation(mockWhere);

      // Clear session
      await act(async () => {
        await result.current.clearSession();
      });

      // Verify wizard fields were removed from settings
      expect(mockUpdateSettings).toHaveBeenCalled();
      const updatedSettings = mockUpdateSettings.mock.calls[0][0];
      expect(updatedSettings).not.toHaveProperty('localPlayersData');
      expect(updatedSettings).not.toHaveProperty('localPlayerSessionSettings');
      expect(updatedSettings).not.toHaveProperty('hasLocalPlayers');
      expect(updatedSettings).toHaveProperty('gameMode', 'local');
      expect(updatedSettings).toHaveProperty('room', 'TEST');
    });

    test('clearSession should not call updateSettings if no wizard fields present', async () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      const mockSession = {
        id: 'test-session-999',
        roomId: 'TEST-ROOM',
        players: mockPlayers,
        currentPlayerIndex: 0,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: mockSettings,
      };

      act(() => {
        result.current.setSession(mockSession);
      });

      // Mock settings store WITHOUT wizard fields
      const mockUpdateSettings = vi.fn();
      const mockCleanSettings = {
        gameMode: 'local' as const,
        room: 'TEST',
      };

      const { useSettingsStore } = await import('@/stores/settingsStore');
      vi.mocked(useSettingsStore.getState).mockReturnValue({
        settings: mockCleanSettings,
        updateSettings: mockUpdateSettings,
        setLocale: vi.fn(),
        resetSettings: vi.fn(),
        updateSelectedAction: vi.fn(),
        removeSelectedAction: vi.fn(),
        clearSelectedActions: vi.fn(),
        getSelectedActionsByType: vi.fn(),
      });

      // Mock database delete
      const mockDelete = vi.fn().mockResolvedValue(undefined);
      const mockEquals = vi.fn().mockReturnValue({ delete: mockDelete });
      const mockWhere = vi.fn().mockReturnValue({ equals: mockEquals });
      const db = await import('@/stores/store');
      vi.mocked(db.default.localPlayerSessions.where).mockImplementation(mockWhere);

      // Clear session
      await act(async () => {
        await result.current.clearSession();
      });

      // Verify updateSettings was NOT called since no wizard fields exist
      expect(mockUpdateSettings).not.toHaveBeenCalled();
    });
  });
});
