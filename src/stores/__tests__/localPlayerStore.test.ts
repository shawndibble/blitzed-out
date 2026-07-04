import type { DBLocalPlayerSession, LocalPlayer, LocalPlayerSession } from '@/types';
import { act, renderHook } from '@testing-library/react';
/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';

import db from '@/stores/store';
import { localPlayerService } from '@/services/localPlayerService';
import { useLocalPlayerStore } from '../localPlayerStore';
import { useSettingsStore } from '@/stores/settingsStore';

// Service seam — the store delegates session lifecycle to this service.
vi.mock('@/services/localPlayerService', () => ({
  localPlayerService: {
    createSession: vi.fn(),
    getSession: vi.fn(),
    advanceLocalTurn: vi.fn(),
    clearCurrentSession: vi.fn(),
  },
}));

// The store only reads getState() for wizard-field cleanup on clearSession.
vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: {
    getState: vi.fn(),
  },
}));

const mockPlayers: LocalPlayer[] = [
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

const mockSettings = {
  showTurnTransitions: true,
  enableTurnSounds: true,
  showPlayerAvatars: true,
};

function buildSession(overrides: Partial<LocalPlayerSession> = {}): LocalPlayerSession {
  return {
    id: 'test-session',
    roomId: 'TEST-ROOM',
    players: mockPlayers,
    currentPlayerIndex: 0,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    settings: mockSettings,
    ...overrides,
  };
}

function toDbRow(session: LocalPlayerSession): DBLocalPlayerSession {
  const { id, ...rest } = session;
  return { sessionId: id, ...rest };
}

describe('LocalPlayerStore', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    vi.mocked(useSettingsStore.getState).mockReturnValue({
      settings: { gameMode: 'online' as const, room: 'PUBLIC', boardUpdated: false },
      updateSettings: vi.fn(),
    } as any);

    // The zustand store is a module-level singleton — reset it between tests.
    useLocalPlayerStore.setState({ session: null, error: null, isLoading: false });

    await db.localPlayerSessions.clear();
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
      const mockSession = buildSession();

      act(() => {
        result.current.setSession(mockSession);
      });

      expect(result.current.session).toStrictEqual(mockSession);
      expect(result.current.error).toBeNull();
    });

    test('should clear session correctly', async () => {
      const { result } = renderHook(() => useLocalPlayerStore());
      const mockSession = buildSession();

      act(() => {
        result.current.setSession(mockSession);
      });

      expect(result.current.session).toStrictEqual(mockSession);

      await act(async () => {
        await result.current.clearSession();
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

      act(() => {
        result.current.setSession(buildSession());
      });

      expect(result.current.hasLocalPlayers()).toBe(true);
    });

    test('hasLocalPlayers should return false for inactive session', () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      act(() => {
        result.current.setSession(buildSession({ isActive: false }));
      });

      expect(result.current.hasLocalPlayers()).toBe(false);
    });

    test('isLocalPlayerRoom should return true for active session', () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      act(() => {
        result.current.setSession(buildSession());
      });

      expect(result.current.isLocalPlayerRoom()).toBe(true);
    });

    test('getCurrentPlayer should return current active player', () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      act(() => {
        result.current.setSession(buildSession({ currentPlayerIndex: 1 }));
      });

      expect(result.current.getCurrentPlayer()).toStrictEqual(mockPlayers[1]);
    });

    test('getCurrentPlayer should return null for invalid index', () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      act(() => {
        result.current.setSession(buildSession({ currentPlayerIndex: 99 }));
      });

      expect(result.current.getCurrentPlayer()).toBeNull();
    });
  });

  describe('Async Actions', () => {
    test('initSession should handle success', async () => {
      const { result } = renderHook(() => useLocalPlayerStore());
      const mockSession = buildSession();

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
      const mockSession = buildSession();

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
      const initialSession = buildSession();
      const updatedSession = buildSession({ currentPlayerIndex: 1 });

      act(() => {
        result.current.setSession(initialSession);
      });

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

      expect(result.current.session).toBeNull();

      await act(async () => {
        await result.current.nextLocalPlayer();
      });

      expect(result.current.error).toBe('No active session');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Session Persistence', () => {
    test('clearSession should delete all sessions for the room from Dexie', async () => {
      const { result } = renderHook(() => useLocalPlayerStore());
      const mockSession = buildSession({ id: 'test-session-123' });

      // Seed the current session, a stale session for the same room, and an
      // unrelated room's session that must survive the clear.
      await db.localPlayerSessions.bulkAdd([
        toDbRow(mockSession),
        toDbRow(buildSession({ id: 'stale-session', roomId: 'TEST-ROOM' })),
        toDbRow(buildSession({ id: 'other-session', roomId: 'OTHER-ROOM' })),
      ]);

      act(() => {
        result.current.setSession(mockSession);
      });

      await act(async () => {
        await result.current.clearSession();
      });

      expect(result.current.session).toBeNull();
      expect(result.current.error).toBeNull();

      expect(await db.localPlayerSessions.where('roomId').equals('TEST-ROOM').count()).toBe(0);
      expect(await db.localPlayerSessions.where('roomId').equals('OTHER-ROOM').count()).toBe(1);
    });

    test('clearSession should handle database deletion errors gracefully', async () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      act(() => {
        result.current.setSession(buildSession({ id: 'test-session-456' }));
      });

      const whereSpy = vi.spyOn(db.localPlayerSessions, 'where').mockImplementation(() => {
        throw new Error('Database error');
      });

      try {
        await act(async () => {
          await result.current.clearSession();
        });
      } finally {
        whereSpy.mockRestore();
      }

      expect(result.current.session).toBeNull();
      expect(result.current.error).toBeNull();
    });

    test('clearSession should handle null session gracefully', async () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      expect(result.current.session).toBeNull();

      await act(async () => {
        await result.current.clearSession();
      });

      expect(result.current.session).toBeNull();
      expect(result.current.error).toBeNull();
    });

    test('clearSession should remove wizard fields from settings store', async () => {
      const { result } = renderHook(() => useLocalPlayerStore());

      act(() => {
        result.current.setSession(buildSession({ id: 'test-session-789' }));
      });

      const mockUpdateSettings = vi.fn();
      vi.mocked(useSettingsStore.getState).mockReturnValue({
        settings: {
          gameMode: 'local' as const,
          room: 'TEST',
          boardUpdated: false,
          localPlayersData: [{ id: '1', name: 'Test' }],
          localPlayerSessionSettings: { showTurnTransitions: true },
          hasLocalPlayers: true,
        },
        updateSettings: mockUpdateSettings,
      } as any);

      await act(async () => {
        await result.current.clearSession();
      });

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

      act(() => {
        result.current.setSession(buildSession({ id: 'test-session-999' }));
      });

      const mockUpdateSettings = vi.fn();
      vi.mocked(useSettingsStore.getState).mockReturnValue({
        settings: { gameMode: 'local' as const, room: 'TEST', boardUpdated: false },
        updateSettings: mockUpdateSettings,
      } as any);

      await act(async () => {
        await result.current.clearSession();
      });

      expect(mockUpdateSettings).not.toHaveBeenCalled();
    });
  });
});
