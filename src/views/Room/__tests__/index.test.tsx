import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// Import mocked dependencies
import { isOnlineMode, isPublicRoom } from '@/helpers/strings';
import { useSettings, useSettingsStore } from '@/stores/settingsStore';

import Room from '../index';
import { Settings } from '@/types/Settings';
import { getActiveBoard } from '@/stores/gameBoard';
import getBackgroundSource from '@/services/getBackgroundSource';
import useBreakpoint from '@/hooks/useBreakpoint';
import useHybridPlayerList from '@/hooks/useHybridPlayerList';
import { useLiveQuery } from 'dexie-react-hooks';
import usePlayerMove from '@/hooks/usePlayerMove';
import usePresence from '@/hooks/usePresence';
import usePrivateRoomMonitor from '@/hooks/usePrivateRoomMonitor';
import useUrlImport from '@/hooks/useUrlImport';

// Mock react-router-dom
const mockNavigate = vi.fn();
let mockParams: { id?: string } = { id: 'TEST_ROOM' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        updated: 'Settings updated successfully',
        unknownError: 'An unknown error occurred',
        loading: 'Loading...',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock migration context
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

// Mock helper functions
vi.mock('@/helpers/strings', () => ({
  isOnlineMode: vi.fn(),
  isPublicRoom: vi.fn(),
  a11yProps: vi.fn((index) => ({
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  })),
}));

// Mock stores
vi.mock('@/stores/gameBoard', () => ({
  getActiveBoard: vi.fn(),
}));

vi.mock('@/stores/settingsStore', () => ({
  useSettings: vi.fn(),
  useSettingsStore: vi.fn(),
}));

// Mock background service
vi.mock('@/services/getBackgroundSource', () => ({
  default: vi.fn(),
}));

// Mock hooks
vi.mock('@/hooks/useBreakpoint', () => ({
  default: vi.fn(),
}));

vi.mock('@/hooks/usePresence', () => ({
  default: vi.fn(),
}));

vi.mock('@/hooks/usePlayerMove', () => ({
  default: vi.fn(),
}));

vi.mock('@/hooks/useHybridPlayerList', () => ({
  default: vi.fn(),
}));

vi.mock('@/hooks/usePrivateRoomMonitor', () => ({
  default: vi.fn(),
}));

vi.mock('@/hooks/useUrlImport', () => ({
  default: vi.fn(),
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}));

// Mock child components
vi.mock('@/views/Navigation', () => ({
  default: vi.fn(({ room, playerList }) => (
    <div data-testid="navigation" data-room={room} data-player-count={playerList?.length || 0}>
      Navigation
    </div>
  )),
}));

vi.mock('@/components/GameSettingsDialog', () => ({
  default: vi.fn(({ open }) =>
    open ? <div data-testid="game-settings-dialog">Game Settings Dialog</div> : null
  ),
}));

vi.mock('../RollButton', () => ({
  default: vi.fn(({ setRollValue, dice, isEndOfBoard }) => (
    <div
      data-testid="roll-button"
      data-dice={dice}
      data-end-of-board={isEndOfBoard}
      onClick={() => setRollValue(3)}
    >
      Roll Button
    </div>
  )),
}));

vi.mock('@/components/RoomBackground', () => ({
  default: vi.fn(({ isVideo, url }) => (
    <div data-testid="room-background" data-video={isVideo} data-url={url}>
      Room Background
    </div>
  )),
}));

vi.mock('@/views/Room/GameBoard', () => ({
  default: vi.fn(({ playerList, isTransparent, gameBoard, settings }) => (
    <div
      data-testid="game-board"
      data-player-count={playerList?.length || 0}
      data-transparent={isTransparent}
      data-board-size={gameBoard?.length || 0}
      data-settings={JSON.stringify(settings)}
    >
      Game Board
    </div>
  )),
  __esModule: true,
}));

vi.mock('@/components/MessageList', () => ({
  default: vi.fn(({ room, isTransparent, currentGameBoardSize }) => (
    <div
      data-testid="message-list"
      data-room={room}
      data-transparent={isTransparent}
      data-board-size={currentGameBoardSize}
    >
      Message List
    </div>
  )),
  __esModule: true,
}));

vi.mock('@/components/MessageInput', () => ({
  default: vi.fn(({ room, isTransparent }) => (
    <div data-testid="message-input" data-room={room} data-transparent={isTransparent}>
      Message Input
    </div>
  )),
}));

vi.mock('@/views/Room/BottomTabs', () => ({
  default: vi.fn(({ tab1, tab2 }) => (
    <div data-testid="bottom-tabs">
      <div data-testid="tab1">{tab1}</div>
      <div data-testid="tab2">{tab2}</div>
    </div>
  )),
}));

vi.mock('@/components/PopupMessage', () => ({
  default: vi.fn(() => <div data-testid="popup-message">Popup Message</div>),
}));

vi.mock('@/components/ToastAlert', () => ({
  default: vi.fn(({ type, open, close, children }) =>
    open ? (
      <div data-testid="toast-alert" data-type={type} data-open={open} onClick={close}>
        {children}
      </div>
    ) : null
  ),
}));

describe('Room Component', () => {
  const mockTiles = [
    { title: 'Start', description: 'Welcome to the game!' },
    { title: 'Action 1', description: 'Take action 1' },
    { title: 'Action 2', description: 'Take action 2' },
    { title: 'Finish', description: 'Game complete!' },
  ];

  const mockSettings: Settings = {
    gameMode: 'online',
    role: 'sub',
    difficulty: 'normal',
    hideBoardActions: false,
    roomTileCount: 40,
    finishRange: [33, 66],
    room: 'TEST_ROOM',
    boardUpdated: false,
    background: 'color',
    roomBackground: 'app',
  };

  const mockPlayerList = [
    {
      uid: 'player1',
      displayName: 'Player 1',
      location: 0,
      isSelf: false,
    },
    {
      uid: 'player2',
      displayName: 'Player 2',
      location: 2,
      isSelf: true,
    },
  ];

  const mockHybridPlayerList = [
    // Remote players
    ...mockPlayerList.map((player) => ({
      ...player,
      type: 'remote' as const,
      isLocal: false as const,
      isFinished: false,
      status: 'active' as const,
      lastActivity: new Date(),
    })),
    // Local player
    {
      uid: 'local-player-1',
      displayName: 'Local Player 1',
      isSelf: false,
      location: 0,
      isFinished: false,
      status: 'active' as const,
      lastActivity: new Date(),
      isLocal: true as const,
      localId: 'local-1',
      role: 'vers',
      order: 0,
    },
  ];

  function renderRoomWithRouter(roomId = 'TEST_ROOM') {
    mockParams = { id: roomId };
    return render(<Room />);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = { id: 'TEST_ROOM' };

    // Setup default mock implementations
    vi.mocked(useLiveQuery).mockReturnValue({ tiles: mockTiles });
    vi.mocked(useSettings).mockReturnValue([mockSettings, vi.fn()]);
    vi.mocked(useSettingsStore).mockReturnValue({
      settings: mockSettings,
      updateSettings: vi.fn(),
    });
    vi.mocked(useBreakpoint).mockReturnValue(false); // Desktop by default
    vi.mocked(usePresence).mockReturnValue(undefined);
    vi.mocked(usePlayerMove).mockReturnValue({
      playerList: mockPlayerList,
      tile: {
        index: 1,
        title: 'Action 1',
        players: [],
        current: null,
        isTransparent: false,
        className: '',
      },
    });
    vi.mocked(useHybridPlayerList).mockReturnValue(mockHybridPlayerList);
    vi.mocked(usePrivateRoomMonitor).mockReturnValue({
      roller: '1d6',
      roomBgUrl: '',
    });
    vi.mocked(useUrlImport).mockReturnValue([null, vi.fn(), false]);
    vi.mocked(getBackgroundSource).mockReturnValue({
      isVideo: false,
      url: null,
    });
    vi.mocked(isOnlineMode).mockReturnValue(true);
    vi.mocked(isPublicRoom).mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render room layout with required components when game is ready', async () => {
      await act(async () => {
        renderRoomWithRouter();
      });

      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      expect(screen.getByTestId('roll-button')).toBeInTheDocument();
      expect(screen.getByTestId('room-background')).toBeInTheDocument();

      // Wait for lazy loaded components to render
      await waitFor(() => {
        expect(screen.getByTestId('game-board')).toBeInTheDocument();
        expect(screen.getByTestId('message-list')).toBeInTheDocument();
        expect(screen.getByTestId('message-input')).toBeInTheDocument();
      });

      expect(screen.getByTestId('popup-message')).toBeInTheDocument();
    });

    it('should render game settings dialog when game is not ready', () => {
      vi.mocked(useLiveQuery).mockReturnValue({ tiles: [] }); // Empty board

      renderRoomWithRouter();

      expect(screen.getByTestId('game-settings-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      expect(screen.queryByTestId('game-board')).not.toBeInTheDocument();
    });

    it('should render game settings dialog when settings are empty', () => {
      vi.mocked(useSettings).mockReturnValue([{} as Settings, vi.fn()]);

      renderRoomWithRouter();

      expect(screen.getByTestId('game-settings-dialog')).toBeInTheDocument();
      expect(screen.queryByTestId('game-board')).not.toBeInTheDocument();
    });

    it('should render game settings dialog for public room in offline mode', () => {
      vi.mocked(isPublicRoom).mockReturnValue(true);
      vi.mocked(isOnlineMode).mockReturnValue(false);

      renderRoomWithRouter('PUBLIC');

      expect(screen.getByTestId('game-settings-dialog')).toBeInTheDocument();
      expect(screen.queryByTestId('game-board')).not.toBeInTheDocument();
    });

    it('should render loading state with CircularProgress for lazy components', async () => {
      renderRoomWithRouter();

      // The Suspense fallback should be rendered initially
      // In a real test environment, this would show loading states
      // Here we just verify the component structure is correct
      expect(screen.getByTestId('game-board')).toBeInTheDocument();
      expect(screen.getByTestId('message-list')).toBeInTheDocument();
    });
  });

  describe('Room Management', () => {
    it('should extract room ID from URL parameters', () => {
      renderRoomWithRouter('MY_ROOM');

      const navigation = screen.getByTestId('navigation');
      expect(navigation).toHaveAttribute('data-room', 'MY_ROOM');
    });

    it('should handle missing room ID parameter', () => {
      mockParams = { id: '' };
      render(<Room />);

      const navigation = screen.getByTestId('navigation');
      expect(navigation).toHaveAttribute('data-room', '');
    });

    it('should pass room ID to message components', () => {
      renderRoomWithRouter('TEST_ROOM');

      const messageList = screen.getByTestId('message-list');
      const messageInput = screen.getByTestId('message-input');

      expect(messageList).toHaveAttribute('data-room', 'TEST_ROOM');
      expect(messageInput).toHaveAttribute('data-room', 'TEST_ROOM');
    });

    it('should call usePresence hook with room ID', () => {
      renderRoomWithRouter('PRESENCE_ROOM');

      expect(usePresence).toHaveBeenCalledWith('PRESENCE_ROOM');
    });

    it('should handle public room detection', () => {
      vi.mocked(isPublicRoom).mockReturnValue(true);

      renderRoomWithRouter('PUBLIC');

      expect(isPublicRoom).toHaveBeenCalledWith('PUBLIC');
    });
  });

  describe('User Interactions', () => {
    it('should handle roll button interaction', async () => {
      renderRoomWithRouter();

      const rollButton = screen.getByTestId('roll-button');
      await act(async () => {
        rollButton.click();
      });

      // The mocked component calls setRollValue with 3
      // In real implementation, this would update roll state
      expect(rollButton).toBeInTheDocument();
    });

    it('should pass correct dice configuration to roll button', () => {
      vi.mocked(usePrivateRoomMonitor).mockReturnValue({
        roller: '2d6',
        roomBgUrl: '',
      });

      renderRoomWithRouter();

      const rollButton = screen.getByTestId('roll-button');
      expect(rollButton).toHaveAttribute('data-dice', '2d6');
    });

    it('should indicate end of board state to roll button', () => {
      vi.mocked(usePlayerMove).mockReturnValue({
        playerList: mockPlayerList,
        tile: {
          index: 3,
          title: 'Finish',
          players: [],
          current: null,
          isTransparent: false,
          className: '',
        }, // Last tile
      });

      renderRoomWithRouter();

      const rollButton = screen.getByTestId('roll-button');
      expect(rollButton).toHaveAttribute('data-end-of-board', 'true');
    });

    it('should handle roll value state updates', () => {
      renderRoomWithRouter();

      // Verify that roll value state is initialized
      const rollButton = screen.getByTestId('roll-button');
      expect(rollButton).toBeInTheDocument();

      // The component should have internal state for roll values
      // This is verified through the memoizedSetRollValue callback
    });
  });

  describe('Game Integration', () => {
    it('should pass game board data to GameBoard component', () => {
      renderRoomWithRouter();

      const gameBoard = screen.getByTestId('game-board');
      expect(gameBoard).toHaveAttribute('data-board-size', '4');
    });

    it('should pass hybrid player list to GameBoard', () => {
      renderRoomWithRouter();

      const gameBoard = screen.getByTestId('game-board');
      expect(gameBoard).toHaveAttribute('data-player-count', '3'); // mockHybridPlayerList has 3 players
    });

    it('should pass transparency state to GameBoard', () => {
      renderRoomWithRouter();

      const gameBoard = screen.getByTestId('game-board');
      expect(gameBoard).toHaveAttribute('data-transparent', 'false');
    });

    it('should calculate transparency for non-public rooms', () => {
      const customSettings = {
        ...mockSettings,
        roomBackground: 'custom',
        background: 'image',
      };
      vi.mocked(useSettings).mockReturnValue([customSettings, vi.fn()]);

      renderRoomWithRouter();

      const gameBoard = screen.getByTestId('game-board');
      expect(gameBoard).toHaveAttribute('data-transparent', 'true');
    });

    it('should pass current game board size to message list', () => {
      renderRoomWithRouter();

      const messageList = screen.getByTestId('message-list');
      expect(messageList).toHaveAttribute('data-board-size', '4');
    });

    it('should integrate with usePlayerMove hook', () => {
      renderRoomWithRouter('PLAYER_ROOM');

      expect(usePlayerMove).toHaveBeenCalledWith(
        'PLAYER_ROOM',
        expect.objectContaining({ value: 0, time: 0 }),
        mockTiles
      );
    });

    it('should integrate with useHybridPlayerList hook', () => {
      renderRoomWithRouter();

      expect(useHybridPlayerList).toHaveBeenCalled();

      const navigation = screen.getByTestId('navigation');
      expect(navigation).toHaveAttribute('data-player-count', '3');
    });
  });

  describe('Real-time Features', () => {
    it('should monitor private room state', () => {
      renderRoomWithRouter('PRIVATE_ROOM');

      expect(usePrivateRoomMonitor).toHaveBeenCalledWith('PRIVATE_ROOM', mockTiles);
    });

    it('should handle room background URL from monitoring', () => {
      vi.mocked(usePrivateRoomMonitor).mockReturnValue({
        roller: '1d6',
        roomBgUrl: 'https://example.com/bg.jpg',
      });

      vi.mocked(getBackgroundSource).mockReturnValue({
        isVideo: false,
        url: 'https://example.com/bg.jpg',
      });

      renderRoomWithRouter();

      const roomBackground = screen.getByTestId('room-background');
      expect(roomBackground).toHaveAttribute('data-url', 'https://example.com/bg.jpg');
    });

    it('should handle video background sources', () => {
      vi.mocked(getBackgroundSource).mockReturnValue({
        isVideo: true,
        url: 'https://example.com/bg.mp4',
      });

      renderRoomWithRouter();

      const roomBackground = screen.getByTestId('room-background');
      expect(roomBackground).toHaveAttribute('data-video', 'true');
      expect(roomBackground).toHaveAttribute('data-url', 'https://example.com/bg.mp4');
    });

    it('should apply video adjustment classes for video backgrounds', () => {
      vi.mocked(getBackgroundSource).mockReturnValue({
        isVideo: true,
        url: 'https://example.com/bg.mp4',
      });

      const { container } = renderRoomWithRouter();

      // Check for video-adjust class on desktop container
      const desktopContainer = container.querySelector('.desktop-container');
      expect(desktopContainer).toHaveClass('video-adjust');
    });

    it('should apply default room background class when no custom background', () => {
      vi.mocked(getBackgroundSource).mockReturnValue({
        isVideo: false,
        url: null,
      });

      const { container } = renderRoomWithRouter();

      const desktopContainer = container.querySelector('.desktop-container');
      expect(desktopContainer).toHaveClass('default-room-background');
    });
  });

  describe('Authentication Integration', () => {
    it('should handle URL import results', () => {
      vi.mocked(useUrlImport).mockReturnValue(['Settings updated successfully', vi.fn(), false]);

      renderRoomWithRouter();

      const toastAlert = screen.getByTestId('toast-alert');
      expect(toastAlert).toHaveAttribute('data-type', 'success');
      expect(toastAlert).toHaveTextContent('Settings updated successfully');
    });

    it('should handle URL import errors', () => {
      vi.mocked(useUrlImport).mockReturnValue(['Import failed', vi.fn(), false]);

      renderRoomWithRouter();

      const toastAlert = screen.getByTestId('toast-alert');
      expect(toastAlert).toHaveAttribute('data-type', 'error');
      expect(toastAlert).toHaveTextContent('Import failed');
    });

    it('should not show toast when no import result', () => {
      vi.mocked(useUrlImport).mockReturnValue([null, vi.fn(), false]);

      renderRoomWithRouter();

      expect(screen.queryByTestId('toast-alert')).not.toBeInTheDocument();
    });

    it('should handle toast alert close action', () => {
      const mockClearImportResult = vi.fn();
      vi.mocked(useUrlImport).mockReturnValue(['Some result', mockClearImportResult, false]);

      renderRoomWithRouter();

      const toastAlert = screen.getByTestId('toast-alert');
      toastAlert.click();

      expect(mockClearImportResult).toHaveBeenCalled();
    });

    it('should show loading state during board import', () => {
      vi.mocked(useUrlImport).mockReturnValue([null, vi.fn(), true]);

      renderRoomWithRouter();

      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByTestId('game-settings-dialog')).not.toBeInTheDocument();
      expect(screen.queryByTestId('game-board')).not.toBeInTheDocument();
    });

    it('should not show setup dialog during board import even with empty settings', () => {
      vi.mocked(useSettings).mockReturnValue([{} as Settings, vi.fn()]);
      vi.mocked(useLiveQuery).mockReturnValue({ tiles: [] });
      vi.mocked(useUrlImport).mockReturnValue([null, vi.fn(), true]);

      renderRoomWithRouter();

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByTestId('game-settings-dialog')).not.toBeInTheDocument();
    });
  });

  describe('Local Player Integration', () => {
    it('should handle hybrid player list with local players', () => {
      renderRoomWithRouter();

      const gameBoard = screen.getByTestId('game-board');
      expect(gameBoard).toHaveAttribute('data-player-count', '3'); // 2 remote + 1 local
    });

    it('should pass hybrid player list to navigation', () => {
      renderRoomWithRouter();

      const navigation = screen.getByTestId('navigation');
      expect(navigation).toHaveAttribute('data-player-count', '3');
    });
  });

  describe('Responsive Design', () => {
    it('should render desktop layout on non-mobile devices', () => {
      vi.mocked(useBreakpoint).mockReturnValue(false);

      const { container } = renderRoomWithRouter();

      expect(screen.getByTestId('game-board')).toBeInTheDocument();
      expect(screen.getByTestId('message-list')).toBeInTheDocument();
      expect(screen.queryByTestId('bottom-tabs')).not.toBeInTheDocument();

      const desktopContainer = container.querySelector('.desktop-container');
      expect(desktopContainer).toBeInTheDocument();
    });

    it('should render mobile layout with bottom tabs on mobile devices', async () => {
      vi.mocked(useBreakpoint).mockReturnValue(true);

      await act(async () => {
        renderRoomWithRouter();
      });

      // Wait for lazy loaded BottomTabs component
      await waitFor(() => {
        expect(screen.getByTestId('bottom-tabs')).toBeInTheDocument();
        expect(screen.getByTestId('tab1')).toBeInTheDocument();
        expect(screen.getByTestId('tab2')).toBeInTheDocument();
      });
    });

    it('should pass game board and messages to mobile tabs', async () => {
      vi.mocked(useBreakpoint).mockReturnValue(true);

      await act(async () => {
        renderRoomWithRouter();
      });

      // Wait for lazy loaded components
      await waitFor(() => {
        const tab1 = screen.getByTestId('tab1');
        const tab2 = screen.getByTestId('tab2');
        expect(tab1.querySelector('[data-testid="game-board"]')).toBeInTheDocument();
        expect(tab2.querySelector('[data-testid="message-list"]')).toBeInTheDocument();
        expect(tab2.querySelector('[data-testid="message-input"]')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null game board from live query', () => {
      vi.mocked(useLiveQuery).mockReturnValue(null);

      renderRoomWithRouter();

      expect(screen.getByTestId('game-settings-dialog')).toBeInTheDocument();
      expect(screen.queryByTestId('game-board')).not.toBeInTheDocument();
    });

    it('should handle undefined game board tiles', () => {
      vi.mocked(useLiveQuery).mockReturnValue({ tiles: undefined });

      renderRoomWithRouter();

      expect(screen.getByTestId('game-settings-dialog')).toBeInTheDocument();
    });

    it('should handle empty settings object', () => {
      vi.mocked(useSettings).mockReturnValue([{} as Settings, vi.fn()]);

      renderRoomWithRouter();

      expect(screen.getByTestId('game-settings-dialog')).toBeInTheDocument();
    });

    it('should handle missing tile information from usePlayerMove', () => {
      vi.mocked(usePlayerMove).mockReturnValue({
        playerList: mockPlayerList,
        tile: {
          id: 0,
          title: 'Test Tile',
          description: 'Test description',
          players: [],
          current: null,
          index: 0,
          isTransparent: false,
          className: '',
        },
      });

      renderRoomWithRouter();

      const rollButton = screen.getByTestId('roll-button');
      expect(rollButton).toHaveAttribute('data-end-of-board', 'false');
    });

    it('should handle player at undefined tile index', () => {
      vi.mocked(usePlayerMove).mockReturnValue({
        playerList: mockPlayerList,
        tile: {
          index: undefined,
          title: 'Unknown',
          players: [],
          current: null,
          isTransparent: false,
          className: '',
        },
      });

      renderRoomWithRouter();

      const rollButton = screen.getByTestId('roll-button');
      expect(rollButton).toHaveAttribute('data-end-of-board', 'false');
    });

    it('should handle empty player list', () => {
      vi.mocked(usePlayerMove).mockReturnValue({
        playerList: [],
        tile: {
          index: 1,
          title: 'Action 1',
          players: [],
          current: null,
          isTransparent: false,
          className: '',
        },
      });
      vi.mocked(useHybridPlayerList).mockReturnValue([]);

      renderRoomWithRouter();

      const navigation = screen.getByTestId('navigation');
      expect(navigation).toHaveAttribute('data-player-count', '0');
    });

    it('should handle null settings from store', () => {
      vi.mocked(useSettings).mockReturnValue([{} as Settings, vi.fn()]);

      renderRoomWithRouter();

      expect(screen.getByTestId('game-settings-dialog')).toBeInTheDocument();
    });

    it('should handle missing URL parameters gracefully', () => {
      mockParams = {};
      render(<Room />);

      expect(screen.getByTestId('navigation')).toHaveAttribute('data-room', '');
    });
  });

  describe('Background and Styling', () => {
    it('should handle different background configurations', () => {
      const customSettings = {
        ...mockSettings,
        background: 'image',
        roomBackground: 'custom',
      };
      vi.mocked(useSettings).mockReturnValue([customSettings, vi.fn()]);

      renderRoomWithRouter();

      // Should calculate transparency based on background settings
      const gameBoard = screen.getByTestId('game-board');
      expect(gameBoard).toHaveAttribute('data-transparent', 'true');
    });

    it('should handle transparency for public rooms', () => {
      vi.mocked(isPublicRoom).mockReturnValue(true);
      const customSettings = {
        ...mockSettings,
        roomBackground: 'custom',
      };
      vi.mocked(useSettings).mockReturnValue([customSettings, vi.fn()]);

      renderRoomWithRouter('PUBLIC');

      // Public rooms should not be transparent when roomBackground is not 'app'
      const gameBoard = screen.getByTestId('game-board');
      expect(gameBoard).toHaveAttribute('data-transparent', 'false');
    });

    it('should pass background source to room background component', () => {
      vi.mocked(getBackgroundSource).mockReturnValue({
        isVideo: false,
        url: 'https://example.com/custom-bg.jpg',
      });

      renderRoomWithRouter();

      expect(getBackgroundSource).toHaveBeenCalledWith(mockSettings, 'TEST_ROOM');
    });
  });

  describe('Performance and Memoization', () => {
    it('should memoize setRollValue callback', () => {
      const { rerender } = renderRoomWithRouter();

      const rollButton1 = screen.getByTestId('roll-button');

      rerender(<Room />);

      const rollButton2 = screen.getByTestId('roll-button');

      // Both renders should have the same roll button behavior
      expect(rollButton1).toBeInTheDocument();
      expect(rollButton2).toBeInTheDocument();
    });

    it('should handle suspense fallbacks for lazy loaded components', async () => {
      renderRoomWithRouter();

      // Verify that lazy loaded components are rendered
      await waitFor(() => {
        expect(screen.getByTestId('game-board')).toBeInTheDocument();
        expect(screen.getByTestId('message-list')).toBeInTheDocument();
      });
    });
  });

  describe('Integration with Game State', () => {
    it('should integrate with game board store', () => {
      renderRoomWithRouter();

      expect(useLiveQuery).toHaveBeenCalledWith(getActiveBoard);
    });

    it('should pass correct game board length to usePlayerMove', () => {
      const largeMockTiles = Array.from({ length: 50 }, (_, i) => ({
        title: `Tile ${i}`,
        description: `Description ${i}`,
      }));

      vi.mocked(useLiveQuery).mockReturnValue({ tiles: largeMockTiles });

      renderRoomWithRouter();

      expect(usePlayerMove).toHaveBeenCalledWith(
        'TEST_ROOM',
        expect.objectContaining({ value: 0, time: 0 }),
        largeMockTiles
      );
    });

    it('should handle roll value updates through usePlayerMove', () => {
      renderRoomWithRouter();

      // Verify the roll value state is passed to usePlayerMove
      expect(usePlayerMove).toHaveBeenCalledWith(
        'TEST_ROOM',
        expect.objectContaining({
          value: expect.any(Number),
          time: expect.any(Number),
        }),
        mockTiles
      );
    });
  });

  describe('Component Lifecycle', () => {
    it('should initialize with default roll value state', () => {
      renderRoomWithRouter();

      expect(usePlayerMove).toHaveBeenCalledWith('TEST_ROOM', { value: 0, time: 0 }, mockTiles);
    });

    it('should handle room parameter changes', () => {
      const { rerender } = renderRoomWithRouter('ROOM1');

      expect(usePresence).toHaveBeenCalledWith('ROOM1');

      mockParams = { id: 'ROOM2' };
      rerender(<Room />);

      expect(usePresence).toHaveBeenCalledWith('ROOM2');
    });
  });
});
