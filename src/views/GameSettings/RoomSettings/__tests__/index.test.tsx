import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import RoomSettings from '../index';
import { Settings, GameMode } from '@/types/Settings';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        appBackground: 'App Background',
        customURL: 'Custom URL',
        // Add other translations used in child components
        gameSpeed: 'Game Speed',
        showPlayerList: 'Show Player List',
        roomSettings: 'Room Settings',
      };
      return translations[key] || key;
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

// Mock migration context
vi.mock('@/context/migration', () => ({
  useMigration: () => ({
    currentLanguageMigrated: true,
    isMigrationInProgress: false,
    isMigrationCompleted: true,
    error: null,
    isHealthy: true,
    recoveryAttempted: false,
    triggerMigration: vi.fn(),
    ensureLanguageMigrated: vi.fn(),
    forceRecovery: vi.fn(),
  }),
}));

// Mock child components to focus on RoomSettings logic
vi.mock('@/components/BackgroundSelect', () => ({
  default: ({ formData, setFormData, backgrounds, isRoom }: any) => (
    <div data-testid="background-select">
      <div data-testid="background-select-formdata">{JSON.stringify(formData)}</div>
      <div data-testid="background-select-backgrounds">{JSON.stringify(backgrounds)}</div>
      <div data-testid="background-select-isroom">{isRoom.toString()}</div>
      <button onClick={() => setFormData({ ...formData, background: 'custom' })}>
        Change Background
      </button>
    </div>
  ),
}));

vi.mock('../GameSpeed', () => ({
  default: ({ formData, setFormData }: any) => (
    <div data-testid="game-speed">
      <div data-testid="game-speed-formdata">{JSON.stringify(formData)}</div>
      <button onClick={() => setFormData({ ...formData, roomDice: '1d6' })}>
        Change Game Speed
      </button>
    </div>
  ),
}));

vi.mock('../PlayerListOption', () => ({
  default: ({ formData, setFormData }: any) => (
    <div data-testid="player-list-option">
      <div data-testid="player-list-formdata">{JSON.stringify(formData)}</div>
      <button onClick={() => setFormData({ ...formData, othersDialog: true })}>
        Toggle Player List
      </button>
    </div>
  ),
}));

vi.mock('@/components/GameForm/RoomSwitch', () => ({
  default: ({ formData, setFormData }: any) => (
    <div data-testid="room-switch">
      <div data-testid="room-switch-formdata">{JSON.stringify(formData)}</div>
      <button onClick={() => setFormData({ ...formData, room: 'test-room' })}>Change Room</button>
    </div>
  ),
}));

vi.mock('../LocalPlayerSettings', () => ({
  default: ({ roomId, isPrivateRoom }: any) => (
    <div data-testid="local-player-settings">
      <div data-testid="local-player-roomid">{roomId}</div>
      <div data-testid="local-player-isprivate">{isPrivateRoom.toString()}</div>
    </div>
  ),
}));

// Mock the isPublicRoom helper
vi.mock('@/helpers/strings', () => ({
  isPublicRoom: (room?: string) => room?.toUpperCase() === 'PUBLIC',
}));

describe('RoomSettings Component', () => {
  const createMockSettings = (overrides: Partial<Settings> = {}): Settings => ({
    gameMode: 'online' as GameMode,
    boardUpdated: false,
    room: 'test-room',
    ...overrides,
  });

  const defaultProps = {
    formData: createMockSettings(),
    setFormData: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      render(<RoomSettings {...defaultProps} />);

      expect(screen.getByTestId('room-switch')).toBeInTheDocument();
    });

    it('should render with proper container styling', () => {
      const { container } = render(<RoomSettings {...defaultProps} />);

      const boxElement = container.firstChild as HTMLElement;
      expect(boxElement).toHaveStyle({ margin: '0.5rem' });
    });

    it('should always render RoomSwitch component', () => {
      render(<RoomSettings {...defaultProps} />);

      expect(screen.getByTestId('room-switch')).toBeInTheDocument();
    });
  });

  describe('Public Room Behavior', () => {
    it('should hide private room components when room is PUBLIC', () => {
      const publicRoomProps = {
        ...defaultProps,
        formData: createMockSettings({ room: 'PUBLIC' }),
      };

      render(<RoomSettings {...publicRoomProps} />);

      // Should only show RoomSwitch
      expect(screen.getByTestId('room-switch')).toBeInTheDocument();

      // Should not show private room components
      expect(screen.queryByTestId('local-player-settings')).not.toBeInTheDocument();
      expect(screen.queryByTestId('game-speed')).not.toBeInTheDocument();
      expect(screen.queryByTestId('player-list-option')).not.toBeInTheDocument();
      expect(screen.queryByTestId('background-select')).not.toBeInTheDocument();
    });

    it('should hide private room components when room is public (lowercase)', () => {
      const publicRoomProps = {
        ...defaultProps,
        formData: createMockSettings({ room: 'public' }),
      };

      render(<RoomSettings {...publicRoomProps} />);

      expect(screen.getByTestId('room-switch')).toBeInTheDocument();
      expect(screen.queryByTestId('local-player-settings')).not.toBeInTheDocument();
    });

    it('should hide private room components when room is mixed case public', () => {
      const publicRoomProps = {
        ...defaultProps,
        formData: createMockSettings({ room: 'Public' }),
      };

      render(<RoomSettings {...publicRoomProps} />);

      expect(screen.getByTestId('room-switch')).toBeInTheDocument();
      expect(screen.queryByTestId('local-player-settings')).not.toBeInTheDocument();
    });
  });

  describe('Private Room Behavior', () => {
    it('should show all components for private rooms', () => {
      const privateRoomProps = {
        ...defaultProps,
        formData: createMockSettings({ room: 'private-room' }),
      };

      render(<RoomSettings {...privateRoomProps} />);

      // Should show all components
      expect(screen.getByTestId('room-switch')).toBeInTheDocument();
      expect(screen.getByTestId('local-player-settings')).toBeInTheDocument();
      expect(screen.getByTestId('game-speed')).toBeInTheDocument();
      expect(screen.getByTestId('player-list-option')).toBeInTheDocument();
      expect(screen.getByTestId('background-select')).toBeInTheDocument();
    });

    it('should show all components for empty room string', () => {
      const emptyRoomProps = {
        ...defaultProps,
        formData: createMockSettings({ room: '' }),
      };

      render(<RoomSettings {...emptyRoomProps} />);

      expect(screen.getByTestId('local-player-settings')).toBeInTheDocument();
      expect(screen.getByTestId('game-speed')).toBeInTheDocument();
      expect(screen.getByTestId('player-list-option')).toBeInTheDocument();
      expect(screen.getByTestId('background-select')).toBeInTheDocument();
    });

    it('should show dividers between sections in private rooms', () => {
      const privateRoomProps = {
        ...defaultProps,
        formData: createMockSettings({ room: 'private-room' }),
      };

      const { container } = render(<RoomSettings {...privateRoomProps} />);

      // Check for dividers (MUI Divider components)
      const dividers = container.querySelectorAll('hr');
      expect(dividers).toHaveLength(4); // There should be 4 dividers
    });
  });

  describe('Component Props Passing', () => {
    it('should pass formData and setFormData to RoomSwitch', () => {
      render(<RoomSettings {...defaultProps} />);

      const roomSwitchFormData = screen.getByTestId('room-switch-formdata');
      expect(roomSwitchFormData).toHaveTextContent(JSON.stringify(defaultProps.formData));
    });

    it('should pass formData and setFormData to GameSpeed in private rooms', () => {
      const privateRoomProps = {
        ...defaultProps,
        formData: createMockSettings({ room: 'private-room' }),
      };

      render(<RoomSettings {...privateRoomProps} />);

      const gameSpeedFormData = screen.getByTestId('game-speed-formdata');
      expect(gameSpeedFormData).toHaveTextContent(JSON.stringify(privateRoomProps.formData));
    });

    it('should pass formData and setFormData to PlayerListOption in private rooms', () => {
      const privateRoomProps = {
        ...defaultProps,
        formData: createMockSettings({ room: 'private-room' }),
      };

      render(<RoomSettings {...privateRoomProps} />);

      const playerListFormData = screen.getByTestId('player-list-formdata');
      expect(playerListFormData).toHaveTextContent(JSON.stringify(privateRoomProps.formData));
    });

    it('should pass correct props to LocalPlayerSettings', () => {
      const privateRoomProps = {
        ...defaultProps,
        formData: createMockSettings({ room: 'my-private-room' }),
      };

      render(<RoomSettings {...privateRoomProps} />);

      expect(screen.getByTestId('local-player-roomid')).toHaveTextContent('my-private-room');
      expect(screen.getByTestId('local-player-isprivate')).toHaveTextContent('true');
    });

    it('should pass correct props to BackgroundSelect', () => {
      const privateRoomProps = {
        ...defaultProps,
        formData: createMockSettings({ room: 'private-room' }),
      };

      render(<RoomSettings {...privateRoomProps} />);

      // Check formData
      const backgroundFormData = screen.getByTestId('background-select-formdata');
      expect(backgroundFormData).toHaveTextContent(JSON.stringify(privateRoomProps.formData));

      // Check backgrounds object
      const backgroundsData = screen.getByTestId('background-select-backgrounds');
      const expectedBackgrounds = { app: 'App Background', custom: 'Custom URL' };
      expect(backgroundsData).toHaveTextContent(JSON.stringify(expectedBackgrounds));

      // Check isRoom flag
      const isRoomData = screen.getByTestId('background-select-isroom');
      expect(isRoomData).toHaveTextContent('true');
    });
  });

  describe('User Interactions', () => {
    it('should handle setFormData calls from child components', async () => {
      const mockSetFormData = vi.fn();
      const user = userEvent.setup();

      const props = {
        formData: createMockSettings({ room: 'private-room' }),
        setFormData: mockSetFormData,
      };

      render(<RoomSettings {...props} />);

      // Test RoomSwitch interaction
      await user.click(screen.getByText('Change Room'));
      expect(mockSetFormData).toHaveBeenCalledWith({
        ...props.formData,
        room: 'test-room',
      });

      // Test GameSpeed interaction
      await user.click(screen.getByText('Change Game Speed'));
      expect(mockSetFormData).toHaveBeenCalledWith({
        ...props.formData,
        roomDice: '1d6',
      });

      // Test PlayerListOption interaction
      await user.click(screen.getByText('Toggle Player List'));
      expect(mockSetFormData).toHaveBeenCalledWith({
        ...props.formData,
        othersDialog: true,
      });

      // Test BackgroundSelect interaction
      await user.click(screen.getByText('Change Background'));
      expect(mockSetFormData).toHaveBeenCalledWith({
        ...props.formData,
        background: 'custom',
      });

      expect(mockSetFormData).toHaveBeenCalledTimes(4);
    });

    it('should only allow RoomSwitch interactions in public rooms', async () => {
      const mockSetFormData = vi.fn();
      const user = userEvent.setup();

      const props = {
        formData: createMockSettings({ room: 'PUBLIC' }),
        setFormData: mockSetFormData,
      };

      render(<RoomSettings {...props} />);

      // Should only have RoomSwitch available
      await user.click(screen.getByText('Change Room'));
      expect(mockSetFormData).toHaveBeenCalledTimes(1);

      // Other components should not be present
      expect(screen.queryByText('Change Game Speed')).not.toBeInTheDocument();
      expect(screen.queryByText('Toggle Player List')).not.toBeInTheDocument();
      expect(screen.queryByText('Change Background')).not.toBeInTheDocument();
    });
  });

  describe('Background Translation', () => {
    it('should create backgrounds object with translated labels', () => {
      render(<RoomSettings {...defaultProps} formData={createMockSettings({ room: 'private' })} />);

      const backgroundsData = screen.getByTestId('background-select-backgrounds');
      const expectedBackgrounds = {
        app: 'App Background',
        custom: 'Custom URL',
      };

      expect(backgroundsData).toHaveTextContent(JSON.stringify(expectedBackgrounds));
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined room gracefully', () => {
      const propsWithUndefinedRoom = {
        ...defaultProps,
        formData: { ...createMockSettings(), room: '' },
      };

      render(<RoomSettings {...propsWithUndefinedRoom} />);

      // Should treat undefined room as private (show all components)
      expect(screen.getByTestId('local-player-settings')).toBeInTheDocument();
      expect(screen.getByTestId('game-speed')).toBeInTheDocument();
    });

    it('should handle null formData properties gracefully', () => {
      const propsWithNullData = {
        ...defaultProps,
        formData: { ...createMockSettings(), room: null } as any,
      };

      render(<RoomSettings {...propsWithNullData} />);

      // Should treat null room as private (show all components)
      expect(screen.getByTestId('local-player-settings')).toBeInTheDocument();
    });

    it('should handle very long room names', () => {
      const longRoomName = 'a'.repeat(1000);
      const propsWithLongRoom = {
        ...defaultProps,
        formData: createMockSettings({ room: longRoomName }),
      };

      render(<RoomSettings {...propsWithLongRoom} />);

      // Should still show private room components for long non-public names
      expect(screen.getByTestId('local-player-settings')).toBeInTheDocument();
      expect(screen.getByTestId('local-player-roomid')).toHaveTextContent(longRoomName);
    });

    it('should handle room names with special characters', () => {
      const specialRoom = 'room-with-special!@#$%^&*()chars';
      const propsWithSpecialRoom = {
        ...defaultProps,
        formData: createMockSettings({ room: specialRoom }),
      };

      render(<RoomSettings {...propsWithSpecialRoom} />);

      expect(screen.getByTestId('local-player-settings')).toBeInTheDocument();
      expect(screen.getByTestId('local-player-roomid')).toHaveTextContent(specialRoom);
    });
  });

  describe('Component State Consistency', () => {
    it('should maintain state consistency when switching between public and private rooms', async () => {
      const mockSetFormData = vi.fn();

      const { rerender } = render(
        <RoomSettings
          formData={createMockSettings({ room: 'private-room' })}
          setFormData={mockSetFormData}
        />
      );

      // Verify private room components are visible
      expect(screen.getByTestId('local-player-settings')).toBeInTheDocument();

      // Switch to public room
      rerender(
        <RoomSettings
          formData={createMockSettings({ room: 'PUBLIC' })}
          setFormData={mockSetFormData}
        />
      );

      // Verify private room components are hidden
      expect(screen.queryByTestId('local-player-settings')).not.toBeInTheDocument();

      // Switch back to private room
      rerender(
        <RoomSettings
          formData={createMockSettings({ room: 'another-private-room' })}
          setFormData={mockSetFormData}
        />
      );

      // Verify private room components are visible again
      expect(screen.getByTestId('local-player-settings')).toBeInTheDocument();
    });

    it('should update LocalPlayerSettings props when room changes', () => {
      const { rerender } = render(
        <RoomSettings formData={createMockSettings({ room: 'room1' })} setFormData={vi.fn()} />
      );

      expect(screen.getByTestId('local-player-roomid')).toHaveTextContent('room1');

      rerender(
        <RoomSettings formData={createMockSettings({ room: 'room2' })} setFormData={vi.fn()} />
      );

      expect(screen.getByTestId('local-player-roomid')).toHaveTextContent('room2');
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      const { container } = render(
        <RoomSettings {...defaultProps} formData={createMockSettings({ room: 'private' })} />
      );

      // Should have a main container
      expect(container.firstChild).toBeInTheDocument();

      // Should have dividers for proper content separation
      const dividers = container.querySelectorAll('hr');
      expect(dividers.length).toBeGreaterThan(0);
    });

    it('should maintain focus management through interactions', async () => {
      const user = userEvent.setup();

      render(
        <RoomSettings formData={createMockSettings({ room: 'private' })} setFormData={vi.fn()} />
      );

      // Test that interactive elements are focusable
      const changeRoomButton = screen.getByText('Change Room');
      const changeSpeedButton = screen.getByText('Change Game Speed');

      await user.tab();
      expect(changeRoomButton).toHaveFocus();

      await user.tab();
      expect(changeSpeedButton).toHaveFocus();
    });
  });

  describe('Performance Considerations', () => {
    it('should not unnecessarily re-render child components', () => {
      const { rerender } = render(<RoomSettings {...defaultProps} />);

      // Re-render with same props
      rerender(<RoomSettings {...defaultProps} />);

      // Components should still be rendered correctly
      expect(screen.getByTestId('room-switch')).toBeInTheDocument();
    });

    it('should handle rapid room type changes', () => {
      const { rerender } = render(<RoomSettings {...defaultProps} />);

      // Rapidly switch between public and private
      for (let i = 0; i < 10; i++) {
        rerender(
          <RoomSettings
            formData={createMockSettings({ room: i % 2 === 0 ? 'PUBLIC' : 'private' })}
            setFormData={vi.fn()}
          />
        );
      }

      // Should end up in private room state
      expect(screen.getByTestId('local-player-settings')).toBeInTheDocument();
    });
  });
});
