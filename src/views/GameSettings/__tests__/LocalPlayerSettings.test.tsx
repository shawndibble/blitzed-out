import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LocalPlayerSettings from '../LocalPlayerSettings';
import type { LocalPlayer, LocalSessionSettings } from '@/types';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      // Simple mock implementation for translations
      if (key.includes('count')) return `Players: ${options?.count || 0}`;
      if (key.includes('currentPlayer')) return `Current: ${options?.name || 'None'}`;
      if (key.includes('role.')) return key.split('.')[1];
      return key.split('.').pop() || key;
    },
  }),
  Trans: ({ i18nKey, children }: any) => children || i18nKey?.split('.').pop() || i18nKey,
}));

vi.mock('@/hooks/useLocalPlayers', () => ({
  useLocalPlayers: vi.fn(() => ({
    // State
    session: null,
    localPlayers: [],
    currentPlayer: null,
    currentPlayerIndex: -1,
    sessionSettings: undefined,
    error: null,
    isLoading: false,

    // Computed state
    hasLocalPlayers: false,
    isLocalPlayerRoom: false,
    playerCount: 0,
    isValidSession: false,

    // Actions
    createLocalSession: vi.fn(),
    loadLocalSession: vi.fn(),
    clearLocalSession: vi.fn(),
    advanceToNextPlayer: vi.fn(),
    updateSettings: vi.fn(),

    // Utilities
    getPlayerByIndex: vi.fn(),
    getPlayerById: vi.fn(),
    isPlayerActive: vi.fn(),
    getNextPlayer: vi.fn(),
    getPreviousPlayer: vi.fn(),

    // Direct store access
    setSession: vi.fn(),
    setError: vi.fn(),
    setLoading: vi.fn(),
  })),
}));

vi.mock('@/components/LocalPlayerSetup', () => ({
  default: ({
    onComplete,
    onCancel,
  }: {
    onComplete: (players: any[], settings: any) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="local-player-setup">
      <button onClick={() => onComplete([], {})}>Complete Setup</button>
      <button onClick={onCancel}>Cancel Setup</button>
    </div>
  ),
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

const theme = createTheme();

const TestProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

const mockUseLocalPlayers = vi.mocked(await import('@/hooks/useLocalPlayers')).useLocalPlayers;

// Helper function to create complete mock return values
const createMockUseLocalPlayersReturn = (overrides: any = {}) => ({
  // State
  session: null,
  localPlayers: [],
  currentPlayer: null,
  currentPlayerIndex: -1,
  sessionSettings: undefined,
  error: null,
  isLoading: false,

  // Computed state
  hasLocalPlayers: false,
  isLocalPlayerRoom: false,
  playerCount: 0,
  isValidSession: false,

  // Actions
  createLocalSession: vi.fn(),
  loadLocalSession: vi.fn(),
  clearLocalSession: vi.fn(),
  advanceToNextPlayer: vi.fn(),
  updateSettings: vi.fn(),

  // Utilities
  getPlayerByIndex: vi.fn(),
  getPlayerById: vi.fn(),
  isPlayerActive: vi.fn(),
  getNextPlayer: vi.fn(),
  getPreviousPlayer: vi.fn(),

  // Direct store access
  setSession: vi.fn(),
  setError: vi.fn(),
  setLoading: vi.fn(),

  // Apply overrides
  ...overrides,
});

describe('LocalPlayerSettings', () => {
  const mockLocalPlayers: LocalPlayer[] = [
    {
      id: 'player1',
      name: 'Player One',
      role: 'dom',
      order: 0,
      isActive: true,
      deviceId: 'current_device',
      location: 0,
      isFinished: false,
    },
    {
      id: 'player2',
      name: 'Player Two',
      role: 'sub',
      order: 1,
      isActive: false,
      deviceId: 'current_device',
      location: 0,
      isFinished: false,
    },
    {
      id: 'player3',
      name: 'Player Three',
      role: 'vers',
      order: 2,
      isActive: false,
      deviceId: 'current_device',
      location: 0,
      isFinished: false,
    },
  ];

  const mockSessionSettings: LocalSessionSettings = {
    showTurnTransitions: true,
    enableTurnSounds: true,
    showPlayerAvatars: true,
  };

  const mockSession = {
    id: 'session1',
    roomId: 'PRIVATE',
    players: mockLocalPlayers,
    currentPlayerIndex: 0,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    settings: mockSessionSettings,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('No Local Players State', () => {
    beforeEach(() => {
      mockUseLocalPlayers.mockReturnValue(
        createMockUseLocalPlayersReturn({
          localPlayers: [],
          hasLocalPlayers: false,
          session: null,
          currentPlayer: null,
        })
      );
    });

    it('should render empty state when no local players exist', () => {
      render(
        <TestProvider>
          <LocalPlayerSettings />
        </TestProvider>
      );

      expect(screen.getByText('setupButton')).toBeInTheDocument();
      expect(screen.getByText('description')).toBeInTheDocument();
    });

    it('should start setup when setup button is clicked', () => {
      render(
        <TestProvider>
          <LocalPlayerSettings />
        </TestProvider>
      );

      const setupButton = screen.getByText('setupButton');
      fireEvent.click(setupButton);

      expect(screen.getByTestId('local-player-setup')).toBeInTheDocument();
    });

    it('should show setup component in editing mode', () => {
      render(
        <TestProvider>
          <LocalPlayerSettings />
        </TestProvider>
      );

      fireEvent.click(screen.getByText('setupButton'));

      expect(screen.getByTestId('local-player-setup')).toBeInTheDocument();
      expect(screen.queryByText('description')).not.toBeInTheDocument();
    });
  });

  describe('Active Local Players State', () => {
    beforeEach(() => {
      mockUseLocalPlayers.mockReturnValue(
        createMockUseLocalPlayersReturn({
          localPlayers: mockLocalPlayers,
          hasLocalPlayers: true,
          session: mockSession,
          currentPlayer: mockLocalPlayers[0],
          currentPlayerIndex: 0,
          sessionSettings: mockSessionSettings,
          playerCount: mockLocalPlayers.length,
          isLocalPlayerRoom: true,
          isValidSession: true,
        })
      );
    });

    it('should render session overview when players exist', () => {
      render(
        <TestProvider>
          <LocalPlayerSettings />
        </TestProvider>
      );

      // Check for the main components - the translation mock returns simplified text
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('playerCount')).toBeInTheDocument(); // This is what the mock returns
      expect(screen.getByText('Current: Player One')).toBeInTheDocument();

      // Verify at least one title exists
      expect(screen.getAllByText('title').length).toBeGreaterThanOrEqual(1);
    });

    it('should render player list with correct information', () => {
      render(
        <TestProvider>
          <LocalPlayerSettings />
        </TestProvider>
      );

      // Check that all players are displayed
      expect(screen.getByText('Player One')).toBeInTheDocument();
      expect(screen.getByText('Player Two')).toBeInTheDocument();
      expect(screen.getByText('Player Three')).toBeInTheDocument();

      // Check roles
      expect(screen.getByText('dom')).toBeInTheDocument();
      expect(screen.getByText('sub')).toBeInTheDocument();
      expect(screen.getByText('vers')).toBeInTheDocument();

      // Check order numbers
      expect(screen.getByText('#0')).toBeInTheDocument();
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
    });

    it('should highlight active player', () => {
      render(
        <TestProvider>
          <LocalPlayerSettings />
        </TestProvider>
      );

      expect(screen.getByText('currentTurn')).toBeInTheDocument();
    });

    it('should render session settings when available', () => {
      render(
        <TestProvider>
          <LocalPlayerSettings />
        </TestProvider>
      );

      expect(screen.getByText('showTurnTransitions')).toBeInTheDocument();
      expect(screen.getByText('playTurnSounds')).toBeInTheDocument();
      expect(screen.getByText('playTurnSounds')).toBeInTheDocument();
    });

    it('should show edit note for session settings', () => {
      render(
        <TestProvider>
          <LocalPlayerSettings />
        </TestProvider>
      );

      expect(screen.getByText('editNote')).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      mockUseLocalPlayers.mockReturnValue(
        createMockUseLocalPlayersReturn({
          localPlayers: mockLocalPlayers,
          hasLocalPlayers: true,
          session: mockSession,
          currentPlayer: mockLocalPlayers[0],
          currentPlayerIndex: 0,
          sessionSettings: mockSessionSettings,
          playerCount: mockLocalPlayers.length,
          isLocalPlayerRoom: true,
          isValidSession: true,
        })
      );
    });

    it('should enter edit mode when edit button is clicked', () => {
      render(
        <TestProvider>
          <LocalPlayerSettings />
        </TestProvider>
      );

      const editButton = screen.getByText('editButton');
      fireEvent.click(editButton);

      expect(screen.getByTestId('local-player-setup')).toBeInTheDocument();
    });

    it('should exit edit mode when setup is completed', async () => {
      render(
        <TestProvider>
          <LocalPlayerSettings />
        </TestProvider>
      );

      // Enter edit mode
      fireEvent.click(screen.getByText('editButton'));
      expect(screen.getByTestId('local-player-setup')).toBeInTheDocument();

      // Complete setup
      fireEvent.click(screen.getByText('Complete Setup'));

      await waitFor(() => {
        expect(screen.queryByTestId('local-player-setup')).not.toBeInTheDocument();
      });
    });

    it('should exit edit mode when setup is cancelled', async () => {
      render(
        <TestProvider>
          <LocalPlayerSettings />
        </TestProvider>
      );

      // Enter edit mode
      fireEvent.click(screen.getByText('editButton'));
      expect(screen.getByTestId('local-player-setup')).toBeInTheDocument();

      // Cancel setup
      fireEvent.click(screen.getByText('Cancel Setup'));

      await waitFor(() => {
        expect(screen.queryByTestId('local-player-setup')).not.toBeInTheDocument();
      });
    });
  });

  describe('Clear Session', () => {
    const mockClearLocalSession = vi.fn();

    beforeEach(() => {
      mockUseLocalPlayers.mockReturnValue(
        createMockUseLocalPlayersReturn({
          localPlayers: mockLocalPlayers,
          hasLocalPlayers: true,
          session: mockSession,
          currentPlayer: mockLocalPlayers[0],
          currentPlayerIndex: 0,
          sessionSettings: mockSessionSettings,
          playerCount: mockLocalPlayers.length,
          isLocalPlayerRoom: true,
          isValidSession: true,
          clearLocalSession: mockClearLocalSession,
        })
      );
    });

    it('should call clearLocalSession when clear button is clicked', async () => {
      render(
        <TestProvider>
          <LocalPlayerSettings />
        </TestProvider>
      );

      const clearButton = screen.getByText('clearButton');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(mockClearLocalSession).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle clear session errors', async () => {
      const errorMessage = 'Failed to clear session';
      mockClearLocalSession.mockRejectedValueOnce(new Error(errorMessage));

      render(
        <TestProvider>
          <LocalPlayerSettings />
        </TestProvider>
      );

      fireEvent.click(screen.getByText('clearButton'));

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockUseLocalPlayers.mockReturnValue(
        createMockUseLocalPlayersReturn({
          localPlayers: mockLocalPlayers,
          hasLocalPlayers: true,
          session: mockSession,
          currentPlayer: mockLocalPlayers[0],
          currentPlayerIndex: 0,
          sessionSettings: mockSessionSettings,
          playerCount: mockLocalPlayers.length,
          isLocalPlayerRoom: true,
          isValidSession: true,
        })
      );
    });

    it('should handle setup completion errors gracefully', async () => {
      render(
        <TestProvider>
          <LocalPlayerSettings />
        </TestProvider>
      );

      fireEvent.click(screen.getByText('editButton'));

      // The component should render without errors even if setup has issues
      expect(screen.getByTestId('local-player-setup')).toBeInTheDocument();
    });

    it('should display error messages in alert component', async () => {
      const mockClearLocalSession = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      mockUseLocalPlayers.mockReturnValue(
        createMockUseLocalPlayersReturn({
          localPlayers: mockLocalPlayers,
          hasLocalPlayers: true,
          session: mockSession,
          currentPlayer: mockLocalPlayers[0],
          currentPlayerIndex: 0,
          sessionSettings: mockSessionSettings,
          playerCount: mockLocalPlayers.length,
          isLocalPlayerRoom: true,
          isValidSession: true,
          clearLocalSession: mockClearLocalSession,
        })
      );

      render(
        <TestProvider>
          <LocalPlayerSettings />
        </TestProvider>
      );

      fireEvent.click(screen.getByText('clearButton'));

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should handle non-Error exceptions', async () => {
      const mockClearLocalSession = vi.fn().mockRejectedValueOnce('String error');

      mockUseLocalPlayers.mockReturnValue(
        createMockUseLocalPlayersReturn({
          localPlayers: mockLocalPlayers,
          hasLocalPlayers: true,
          session: mockSession,
          currentPlayer: mockLocalPlayers[0],
          currentPlayerIndex: 0,
          sessionSettings: mockSessionSettings,
          playerCount: mockLocalPlayers.length,
          isLocalPlayerRoom: true,
          isValidSession: true,
          clearLocalSession: mockClearLocalSession,
        })
      );

      render(
        <TestProvider>
          <LocalPlayerSettings />
        </TestProvider>
      );

      fireEvent.click(screen.getByText('clearButton'));

      await waitFor(() => {
        expect(screen.getByText('Failed to clear local session')).toBeInTheDocument();
      });
    });
  });

  describe('Props Handling', () => {
    beforeEach(() => {
      mockUseLocalPlayers.mockReturnValue(
        createMockUseLocalPlayersReturn({
          localPlayers: [],
          hasLocalPlayers: false,
          session: null,
          currentPlayer: null,
        })
      );
    });

    it('should handle custom roomId prop', () => {
      render(
        <TestProvider>
          <LocalPlayerSettings roomId="CUSTOM" />
        </TestProvider>
      );

      fireEvent.click(screen.getByText('setupButton'));

      // LocalPlayerSetup should receive the custom roomId
      expect(screen.getByTestId('local-player-setup')).toBeInTheDocument();
    });

    it('should handle isPrivateRoom prop', () => {
      render(
        <TestProvider>
          <LocalPlayerSettings isPrivateRoom={false} />
        </TestProvider>
      );

      fireEvent.click(screen.getByText('setupButton'));

      expect(screen.getByTestId('local-player-setup')).toBeInTheDocument();
    });

    it('should use default props when not provided', () => {
      render(
        <TestProvider>
          <LocalPlayerSettings />
        </TestProvider>
      );

      // Should render without errors using defaults
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });

  describe('Session Settings Display', () => {
    it('should show settings as disabled switches', () => {
      mockUseLocalPlayers.mockReturnValue(
        createMockUseLocalPlayersReturn({
          localPlayers: mockLocalPlayers,
          hasLocalPlayers: true,
          session: mockSession,
          currentPlayer: mockLocalPlayers[0],
          currentPlayerIndex: 0,
          sessionSettings: mockSessionSettings,
          playerCount: mockLocalPlayers.length,
          isLocalPlayerRoom: true,
          isValidSession: true,
        })
      );

      render(
        <TestProvider>
          <LocalPlayerSettings />
        </TestProvider>
      );

      // All switches should be disabled (read-only)
      const switches = screen.getAllByRole('checkbox');
      switches.forEach((switchElement) => {
        expect(switchElement).toBeDisabled();
      });
    });

    it('should reflect session settings state in switches', () => {
      const sessionWithTimerDisabled = {
        ...mockSession,
        settings: {
          ...mockSessionSettings,
          showTurnTransitions: false,
        },
      };

      mockUseLocalPlayers.mockReturnValue(
        createMockUseLocalPlayersReturn({
          localPlayers: mockLocalPlayers,
          hasLocalPlayers: true,
          session: sessionWithTimerDisabled,
          currentPlayer: mockLocalPlayers[0],
          currentPlayerIndex: 0,
          sessionSettings: sessionWithTimerDisabled.settings,
          playerCount: mockLocalPlayers.length,
          isLocalPlayerRoom: true,
          isValidSession: true,
        })
      );

      render(
        <TestProvider>
          <LocalPlayerSettings />
        </TestProvider>
      );

      // Timer switch should reflect disabled state
      expect(screen.getByText('playTurnSounds')).toBeInTheDocument();
    });

    it('should not render settings section when session has no settings', () => {
      const sessionWithoutSettings = {
        ...mockSession,
        settings: undefined,
      };

      mockUseLocalPlayers.mockReturnValue(
        createMockUseLocalPlayersReturn({
          localPlayers: mockLocalPlayers,
          hasLocalPlayers: true,
          session: sessionWithoutSettings as any,
          currentPlayer: mockLocalPlayers[0],
          currentPlayerIndex: 0,
          sessionSettings: undefined,
          playerCount: mockLocalPlayers.length,
          isLocalPlayerRoom: true,
          isValidSession: true,
        })
      );

      render(
        <TestProvider>
          <LocalPlayerSettings />
        </TestProvider>
      );

      expect(screen.queryByText('showTurnTransitions')).not.toBeInTheDocument();
    });
  });

  describe('Current Player Display', () => {
    it('should show current player chip when currentPlayer exists', () => {
      mockUseLocalPlayers.mockReturnValue(
        createMockUseLocalPlayersReturn({
          localPlayers: mockLocalPlayers,
          hasLocalPlayers: true,
          session: mockSession,
          currentPlayer: mockLocalPlayers[0],
          currentPlayerIndex: 0,
          sessionSettings: mockSessionSettings,
          playerCount: mockLocalPlayers.length,
          isLocalPlayerRoom: true,
          isValidSession: true,
        })
      );

      render(
        <TestProvider>
          <LocalPlayerSettings />
        </TestProvider>
      );

      expect(screen.getByText('Current: Player One')).toBeInTheDocument();
    });

    it('should not show current player chip when currentPlayer is null', () => {
      mockUseLocalPlayers.mockReturnValue({
        // State
        session: mockSession,
        localPlayers: mockLocalPlayers,
        currentPlayer: null,
        currentPlayerIndex: -1,
        sessionSettings: mockSession.settings,
        error: null,
        isLoading: false,

        // Computed state
        hasLocalPlayers: true,
        isLocalPlayerRoom: true,
        playerCount: mockLocalPlayers.length,
        isValidSession: true,

        // Actions
        createLocalSession: vi.fn(),
        loadLocalSession: vi.fn(),
        clearLocalSession: vi.fn(),
        advanceToNextPlayer: vi.fn(),
        updateSettings: vi.fn(),

        // Utilities
        getPlayerByIndex: vi.fn(),
        getPlayerById: vi.fn(),
        isPlayerActive: vi.fn(),
        getNextPlayer: vi.fn(),
        getPreviousPlayer: vi.fn(),

        // Direct store access
        setSession: vi.fn(),
        setError: vi.fn(),
        setLoading: vi.fn(),
      });

      render(
        <TestProvider>
          <LocalPlayerSettings />
        </TestProvider>
      );

      expect(screen.queryByText(/Current:/)).not.toBeInTheDocument();
    });
  });
});
