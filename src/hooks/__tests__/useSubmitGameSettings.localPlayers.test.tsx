import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import useSubmitGameSettings from '../useSubmitGameSettings';
import * as settingsStore from '@/stores/settingsStore';
import * as useRoomNavigate from '../useRoomNavigate';

// Mock all dependencies
vi.mock('@/context/hooks/useAuth', () => ({
  default: () => ({
    user: { uid: 'test-user', displayName: 'Test User' },
    updateUser: vi.fn().mockResolvedValue({ uid: 'test-user', displayName: 'Test User' }),
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'PRIVATE' }),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../useGameBoard', () => ({
  default: () =>
    vi.fn().mockResolvedValue({
      settingsBoardUpdated: true,
      gameMode: 'local',
      newBoard: [],
    }),
}));

vi.mock('@/stores/settingsStore', () => ({
  useSettings: () => [{ gameMode: 'local' }, vi.fn()],
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(() => []),
}));

vi.mock('@/stores/gameBoard', () => ({
  getActiveBoard: vi.fn(),
  upsertBoard: vi.fn(),
}));

vi.mock('@/views/GameSettings/submitForm', () => ({
  handleUser: vi.fn().mockResolvedValue({ uid: 'test-user', displayName: 'Test User' }),
  sendRoomSettingsMessage: vi.fn(),
}));

vi.mock('@/context/hooks/useMessages', () => ({
  default: () => ({ messages: [] }),
}));

vi.mock('../useRoomNavigate', () => ({
  default: () => vi.fn(),
}));

vi.mock('@/services/gameSettingsMessage', () => ({
  default: vi.fn(),
}));

vi.mock('../useLocalPlayers', () => ({
  useLocalPlayers: vi.fn(),
}));

import { useLocalPlayers } from '../useLocalPlayers';

describe('useSubmitGameSettings Local Player Integration', () => {
  const mockCreateLocalSession = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useLocalPlayers as any).mockReturnValue({
      createLocalSession: mockCreateLocalSession,
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>{children}</BrowserRouter>
  );

  describe('Local Player Session Creation', () => {
    it('should create local session when local player data exists in formData', async () => {
      const { result } = renderHook(() => useSubmitGameSettings(), { wrapper });

      const formDataWithLocalPlayers = {
        room: 'PRIVATE',
        gameMode: 'local',
        hasLocalPlayers: true,
        localPlayersData: [
          {
            id: 'player1',
            name: 'Player 1',
            role: 'dom' as const,
            isActive: true,
            order: 1,
          },
          {
            id: 'player2',
            name: 'Player 2',
            role: 'sub' as const,
            isActive: false,
            order: 2,
          },
        ],
        localPlayerSessionSettings: {
          showTurnTransitions: true,
          enableTurnSounds: true,
          showPlayerAvatars: true,
        },
      };

      await result.current(formDataWithLocalPlayers as any, {});

      await waitFor(() => {
        expect(mockCreateLocalSession).toHaveBeenCalledWith(
          'PRIVATE',
          formDataWithLocalPlayers.localPlayersData,
          formDataWithLocalPlayers.localPlayerSessionSettings
        );
      });
    });

    it('should not create local session when no local player data exists', async () => {
      const { result } = renderHook(() => useSubmitGameSettings(), { wrapper });

      const formDataWithoutLocalPlayers = {
        room: 'PRIVATE',
        gameMode: 'local',
        hasLocalPlayers: false,
      };

      await result.current(formDataWithoutLocalPlayers as any, {});

      expect(mockCreateLocalSession).not.toHaveBeenCalled();
    });

    it('should not create local session when hasLocalPlayers is false', async () => {
      const { result } = renderHook(() => useSubmitGameSettings(), { wrapper });

      const formDataWithoutLocalPlayersFlag = {
        room: 'PRIVATE',
        gameMode: 'local',
        hasLocalPlayers: false,
        localPlayersData: [
          { id: 'player1', name: 'Player 1', role: 'dom', isActive: true, order: 1 },
        ],
        localPlayerSessionSettings: {},
      };

      await result.current(formDataWithoutLocalPlayersFlag as any, {});

      expect(mockCreateLocalSession).not.toHaveBeenCalled();
    });

    it('should not create local session when localPlayersData is missing', async () => {
      const { result } = renderHook(() => useSubmitGameSettings(), { wrapper });

      const formDataWithMissingData = {
        room: 'PRIVATE',
        gameMode: 'local',
        hasLocalPlayers: true,
        localPlayerSessionSettings: {},
      };

      await result.current(formDataWithMissingData as any, {});

      expect(mockCreateLocalSession).not.toHaveBeenCalled();
    });

    it('should not create local session when localPlayerSessionSettings is missing', async () => {
      const { result } = renderHook(() => useSubmitGameSettings(), { wrapper });

      const formDataWithMissingSettings = {
        room: 'PRIVATE',
        gameMode: 'local',
        hasLocalPlayers: true,
        localPlayersData: [
          { id: 'player1', name: 'Player 1', role: 'dom', isActive: true, order: 1 },
        ],
      };

      await result.current(formDataWithMissingSettings as any, {});

      expect(mockCreateLocalSession).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle local session creation errors gracefully', async () => {
      mockCreateLocalSession.mockRejectedValue(new Error('Session creation failed'));

      const { result } = renderHook(() => useSubmitGameSettings(), { wrapper });

      const formDataWithLocalPlayers = {
        room: 'PRIVATE',
        gameMode: 'local',
        hasLocalPlayers: true,
        localPlayersData: [
          { id: 'player1', name: 'Player 1', role: 'dom', isActive: true, order: 1 },
        ],
        localPlayerSessionSettings: {
          showTurnTransitions: true,
          enableTurnSounds: true,
          showPlayerAvatars: true,
        },
      };

      // Should not throw an error even if local session creation fails
      await expect(result.current(formDataWithLocalPlayers as any, {})).resolves.not.toThrow();

      expect(mockCreateLocalSession).toHaveBeenCalled();
    });

    it('should continue with settings save even if local session creation fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockCreateLocalSession.mockRejectedValue(new Error('Session creation failed'));

      const { result } = renderHook(() => useSubmitGameSettings(), { wrapper });

      const formDataWithLocalPlayers = {
        room: 'PRIVATE',
        gameMode: 'local',
        hasLocalPlayers: true,
        localPlayersData: [
          { id: 'player1', name: 'Player 1', role: 'dom', isActive: true, order: 1 },
        ],
        localPlayerSessionSettings: {},
      };

      // Should complete successfully
      await result.current(formDataWithLocalPlayers as any, {});

      // Should log the error but continue
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error creating local session:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Integration with Settings Store', () => {
    it('should clean formData before storing in settings', async () => {
      const mockUpdateSettings = vi.fn();

      // Mock the settings store
      vi.mocked(settingsStore.useSettings).mockReturnValue([
        {
          gameMode: 'local',
          boardUpdated: false,
          room: 'PRIVATE',
          locale: 'en',
          background: 'color',
          selectedActions: {},
          hasSeenRollButton: false,
          themeMode: 'system',
        },
        mockUpdateSettings,
      ]);

      const { result } = renderHook(() => useSubmitGameSettings(), { wrapper });

      const formDataWithLocalPlayers = {
        room: 'PRIVATE',
        gameMode: 'local',
        hasLocalPlayers: true,
        localPlayersData: [
          { id: 'player1', name: 'Player 1', role: 'dom', isActive: true, order: 1 },
        ],
        localPlayerSessionSettings: {},
        // These should be cleaned out
        someOldActionData: { level: 0 }, // Should be removed by cleanFormData
        selectedActions: {
          validAction: { level: 2 }, // Should be kept
          invalidAction: { level: 0 }, // Should be removed
        },
      };

      await result.current(formDataWithLocalPlayers as any, {});

      expect(mockUpdateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          room: 'PRIVATE',
          gameMode: 'local',
          boardUpdated: false,
          roomUpdated: false,
          selectedActions: {
            validAction: { level: 2 },
          },
        })
      );

      // Local player data should NOT be in the cleaned settings
      expect(mockUpdateSettings).toHaveBeenCalledWith(
        expect.not.objectContaining({
          hasLocalPlayers: expect.anything(),
          localPlayersData: expect.anything(),
          localPlayerSessionSettings: expect.anything(),
        })
      );
    });
  });

  describe('Room Navigation', () => {
    it('should navigate to the specified room after completion', async () => {
      const mockNavigate = vi.fn();

      vi.mocked(useRoomNavigate.default).mockReturnValue(mockNavigate);

      const { result } = renderHook(() => useSubmitGameSettings(), { wrapper });

      const formData = {
        room: 'CUSTOM_ROOM',
        gameMode: 'local',
      };

      await result.current(formData as any, {});

      expect(mockNavigate).toHaveBeenCalledWith('CUSTOM_ROOM');
    });
  });
});
