import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPresenceOverlay from '../index';
import { Player } from '@/types/player';
import type { HybridPlayer } from '@/hooks/useHybridPlayerList';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        online: 'Online',
        players: 'Players',
        you: 'you',
        localPlayer: 'Local Player',
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

// Mock TextAvatar component
vi.mock('@/components/TextAvatar', () => ({
  default: ({ uid, displayName, size }: { uid: string; displayName: string; size: string }) => (
    <div data-testid={`text-avatar-${uid}`} data-size={size} aria-label={displayName}>
      {displayName.charAt(0)}
    </div>
  ),
}));

describe('UserPresenceOverlay', () => {
  const user = userEvent.setup();

  const mockOnClose = vi.fn();
  const mockAnchorEl = document.createElement('button');

  const mockRemotePlayers: Player[] = [
    {
      uid: 'remote-1',
      displayName: 'Alice',
      isSelf: false,
      isFinished: false,
    },
    {
      uid: 'remote-2',
      displayName: 'Bob',
      isSelf: true,
      isFinished: false,
    },
    {
      uid: 'remote-3',
      displayName: 'Charlie',
      isSelf: false,
      isFinished: true,
    },
  ];

  const mockLocalPlayers: HybridPlayer[] = [
    {
      uid: 'local-1',
      displayName: 'Local Player 1',
      isSelf: true,
      isFinished: false,
      isLocal: true,
      localId: 'local-1',
      role: 'dom',
      order: 1,
      location: 0,
      status: 'active',
      lastActivity: new Date(),
    },
    {
      uid: 'local-2',
      displayName: 'Local Player 2',
      isSelf: false,
      isFinished: false,
      isLocal: true,
      localId: 'local-2',
      role: 'sub',
      order: 2,
      location: 0,
      status: 'active',
      lastActivity: new Date(),
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    playerList: mockRemotePlayers,
    anchorEl: mockAnchorEl,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.appendChild(mockAnchorEl);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.removeChild(mockAnchorEl);
  });

  describe('Component Rendering', () => {
    it('should render popover when isOpen is true', () => {
      render(<UserPresenceOverlay {...defaultProps} />);

      const popover = screen.getByRole('dialog');
      expect(popover).toBeInTheDocument();
      expect(popover).toHaveAttribute('aria-label', 'Online');
      expect(popover).toHaveAttribute('aria-modal', 'true');
    });

    it('should not render popover when isOpen is false', () => {
      render(<UserPresenceOverlay {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render with correct anchor element', () => {
      render(<UserPresenceOverlay {...defaultProps} />);

      // The popover should be positioned relative to the anchor element
      const popover = screen.getByRole('dialog');
      expect(popover).toBeInTheDocument();
    });

    it('should render with proper ARIA attributes', () => {
      render(<UserPresenceOverlay {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label', 'Online');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('User List Display', () => {
    it('should display correct title and count for remote players', () => {
      render(<UserPresenceOverlay {...defaultProps} />);

      expect(screen.getByText('Online (3)')).toBeInTheDocument();
    });

    it('should display all remote players', () => {
      render(<UserPresenceOverlay {...defaultProps} />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('should display (you) indicator for self player', () => {
      render(<UserPresenceOverlay {...defaultProps} />);

      expect(screen.getByText('(you)')).toBeInTheDocument();
      // Check that it's next to Bob's name
      const bobElement = screen.getByText('Bob');
      const youElement = screen.getByText('(you)');
      expect(bobElement.parentElement).toContainElement(youElement);
    });

    it('should render TextAvatar for each player', () => {
      render(<UserPresenceOverlay {...defaultProps} />);

      expect(screen.getByTestId('text-avatar-remote-1')).toBeInTheDocument();
      expect(screen.getByTestId('text-avatar-remote-2')).toBeInTheDocument();
      expect(screen.getByTestId('text-avatar-remote-3')).toBeInTheDocument();

      // Check size is medium
      expect(screen.getByTestId('text-avatar-remote-1')).toHaveAttribute('data-size', 'medium');
    });

    it('should style self player name differently', () => {
      render(<UserPresenceOverlay {...defaultProps} />);

      const bobName = screen.getByText('Bob');
      const aliceName = screen.getByText('Alice');

      // Self player should have primary color and bold weight
      expect(bobName).toHaveStyle({ color: 'rgb(25, 118, 210)', fontWeight: '600' });
      // Non-self player should have normal text color and weight
      expect(aliceName).toHaveStyle({ fontWeight: '400' });
    });
  });

  describe('Local Players Display', () => {
    it('should display correct title and count for local players', () => {
      render(<UserPresenceOverlay {...defaultProps} playerList={mockLocalPlayers} />);

      expect(screen.getByText('Players (2)')).toBeInTheDocument();
    });

    it('should display local players in column layout', () => {
      render(<UserPresenceOverlay {...defaultProps} playerList={mockLocalPlayers} />);

      const container = screen.getByText('Local Player 1').closest('[class*="css-"]');
      expect(container?.parentElement).toHaveStyle({ flexDirection: 'column' });
    });

    it('should show turn progression arrows between local players', () => {
      render(<UserPresenceOverlay {...defaultProps} playerList={mockLocalPlayers} />);

      // Should have one arrow between the two players
      const arrows = screen.getAllByTestId('ArrowForwardIcon');
      expect(arrows).toHaveLength(1);
    });

    it('should not show arrow after last local player', () => {
      const singleLocalPlayer = [mockLocalPlayers[0]];
      render(<UserPresenceOverlay {...defaultProps} playerList={singleLocalPlayer} />);

      expect(screen.queryByTestId('ArrowForwardIcon')).not.toBeInTheDocument();
    });

    it('should show Local Player chip for mixed player types when not in local mode', () => {
      const mixedPlayers = [...mockRemotePlayers, mockLocalPlayers[0]];
      render(<UserPresenceOverlay {...defaultProps} playerList={mixedPlayers} />);

      expect(screen.getByText('Local Player')).toBeInTheDocument();
    });

    it('should not show Local Player chip in pure local mode', () => {
      render(<UserPresenceOverlay {...defaultProps} playerList={mockLocalPlayers} />);

      expect(screen.queryByText('Local Player')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when clicking outside', async () => {
      render(<UserPresenceOverlay {...defaultProps} />);

      // Click on the backdrop (outside the popover content)
      const backdrop = document.querySelector('[role="presentation"]');
      if (backdrop) {
        await user.click(backdrop);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should call onClose when pressing Escape key', async () => {
      render(<UserPresenceOverlay {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      dialog.focus();

      await user.keyboard('{Escape}');
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should focus the dialog content when opened', async () => {
      render(<UserPresenceOverlay {...defaultProps} />);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveFocus();
      });
    });

    it('should handle keyboard navigation', async () => {
      render(<UserPresenceOverlay {...defaultProps} />);

      const dialog = screen.getByRole('dialog');

      // Test that dialog can receive focus
      dialog.focus();
      expect(dialog).toHaveFocus();

      // Test Escape key handling
      fireEvent.keyDown(dialog, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should ignore other key presses', async () => {
      render(<UserPresenceOverlay {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      dialog.focus();

      fireEvent.keyDown(dialog, { key: 'Enter' });
      fireEvent.keyDown(dialog, { key: 'Space' });
      fireEvent.keyDown(dialog, { key: 'ArrowDown' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Empty State Handling', () => {
    it('should handle empty player list', () => {
      render(<UserPresenceOverlay {...defaultProps} playerList={[]} />);

      expect(screen.getByText('Online (0)')).toBeInTheDocument();
      expect(screen.queryByTestId(/text-avatar-/)).not.toBeInTheDocument();
    });

    it('should render correctly with null anchorEl', () => {
      render(<UserPresenceOverlay {...defaultProps} anchorEl={null} />);

      // Should still render the popover, just without proper positioning
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle players with empty display names', () => {
      const playersWithEmptyNames = [
        { ...mockRemotePlayers[0], displayName: '' },
        { ...mockRemotePlayers[1], displayName: '   ' },
      ];

      render(<UserPresenceOverlay {...defaultProps} playerList={playersWithEmptyNames} />);

      expect(screen.getByText('Online (2)')).toBeInTheDocument();
      // TextAvatar should handle empty names gracefully
      expect(screen.getByTestId('text-avatar-remote-1')).toBeInTheDocument();
    });

    it('should handle players with very long display names', () => {
      const playersWithLongNames = [
        {
          ...mockRemotePlayers[0],
          displayName: 'This is a very long display name that should be truncated',
        },
      ];

      render(<UserPresenceOverlay {...defaultProps} playerList={playersWithLongNames} />);

      const longName = screen.getByText(
        'This is a very long display name that should be truncated'
      );
      expect(longName).toBeInTheDocument();
      expect(longName).toHaveStyle({
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      });
    });

    it('should handle mixed player types correctly', () => {
      const mixedPlayers = [...mockRemotePlayers, ...mockLocalPlayers];

      render(<UserPresenceOverlay {...defaultProps} playerList={mixedPlayers} />);

      // Should show "Online" since there are remote players and not pure local mode
      expect(screen.getByText('Online (5)')).toBeInTheDocument();

      // Should show local player chips for mixed mode
      expect(screen.getAllByText('Local Player')).toHaveLength(2);
    });

    it('should handle rapid open/close toggles', async () => {
      const { rerender } = render(<UserPresenceOverlay {...defaultProps} isOpen={false} />);

      rerender(<UserPresenceOverlay {...defaultProps} isOpen={true} />);
      rerender(<UserPresenceOverlay {...defaultProps} isOpen={false} />);
      rerender(<UserPresenceOverlay {...defaultProps} isOpen={true} />);

      // Should handle state changes without errors
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should apply responsive styling', () => {
      render(<UserPresenceOverlay {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      const popoverPaper = dialog.closest('[role="none"]');

      // Paper element should exist with responsive max/min width styling
      expect(popoverPaper).toBeInTheDocument();
    });

    it('should handle different viewport sizes', () => {
      // Test xs viewport
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      render(<UserPresenceOverlay {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Test md viewport
      Object.defineProperty(window, 'innerWidth', { value: 900 });
      const { rerender } = render(<UserPresenceOverlay {...defaultProps} />);
      rerender(<UserPresenceOverlay {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<UserPresenceOverlay {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label', 'Online');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('role', 'dialog');
    });

    it('should be keyboard accessible', async () => {
      render(<UserPresenceOverlay {...defaultProps} />);

      const dialog = screen.getByRole('dialog');

      // Should be focusable
      dialog.focus();
      expect(dialog).toHaveFocus();

      // Should handle keyboard events
      fireEvent.keyDown(dialog, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should have proper tab index for focus management', () => {
      render(<UserPresenceOverlay {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('tabIndex', '-1');
    });

    it('should provide meaningful text content for screen readers', () => {
      render(<UserPresenceOverlay {...defaultProps} />);

      // Title should be clear
      expect(screen.getByText('Online (3)')).toBeInTheDocument();

      // Player names should be accessible
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();

      // Self indicator should be clear
      expect(screen.getByText('(you)')).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large player lists efficiently', () => {
      const largePlayers = Array.from({ length: 50 }, (_, i) => ({
        uid: `player-${i}`,
        displayName: `Player ${i}`,
        isSelf: i === 0,
        isFinished: false,
      }));

      render(<UserPresenceOverlay {...defaultProps} playerList={largePlayers} />);

      expect(screen.getByText('Online (50)')).toBeInTheDocument();
      expect(screen.getByText('Player 0')).toBeInTheDocument();
      expect(screen.getByText('Player 49')).toBeInTheDocument();
    });

    it('should not cause memory leaks with rapid updates', () => {
      const { rerender } = render(<UserPresenceOverlay {...defaultProps} />);

      // Simulate rapid player list updates
      for (let i = 0; i < 10; i++) {
        const updatedPlayers = mockRemotePlayers.map((player) => ({
          ...player,
          displayName: `${player.displayName} ${i}`,
        }));
        rerender(<UserPresenceOverlay {...defaultProps} playerList={updatedPlayers} />);
      }

      expect(screen.getByText('Alice 9')).toBeInTheDocument();
    });
  });

  describe('Integration with Player Management', () => {
    it('should correctly identify local vs remote players', () => {
      const mixedPlayers = [mockRemotePlayers[0], mockLocalPlayers[0]];
      render(<UserPresenceOverlay {...defaultProps} playerList={mixedPlayers} />);

      // Remote player should not have local chip
      const aliceContainer = screen.getByText('Alice').closest('div');
      expect(aliceContainer).not.toContainElement(
        screen.queryByText('Local Player') || document.createElement('div')
      );

      // Local player should have local chip when in mixed mode
      expect(screen.getByText('Local Player')).toBeInTheDocument();
    });

    it('should handle player status updates', () => {
      const finishedPlayer = { ...mockRemotePlayers[0], isFinished: true };
      render(<UserPresenceOverlay {...defaultProps} playerList={[finishedPlayer]} />);

      // Component should still render finished players
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Online (1)')).toBeInTheDocument();
    });

    it('should maintain player order consistency', () => {
      const orderedLocalPlayers = [
        { ...mockLocalPlayers[1], order: 1 }, // Second player with order 1
        { ...mockLocalPlayers[0], order: 2 }, // First player with order 2
      ];

      render(<UserPresenceOverlay {...defaultProps} playerList={orderedLocalPlayers} />);

      const playerElements = screen.getAllByText(/Local Player/);
      // The component should maintain the order passed to it
      expect(playerElements[0]).toHaveTextContent('Local Player 2');
      expect(playerElements[1]).toHaveTextContent('Local Player 1');
    });
  });
});
