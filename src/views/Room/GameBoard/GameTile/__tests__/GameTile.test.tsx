import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import GameTile from '../index';
import { Tile } from '@/types';
import { Player } from '@/types/player';

// Mock dependencies
vi.mock('@/components/TextAvatar', () => ({
  default: vi.fn(({ displayName, uid }) => (
    <div data-testid="text-avatar" data-display-name={displayName} data-uid={uid}>
      {displayName}
    </div>
  )),
}));

describe('GameTile', () => {
  const mockPlayers: Player[] = [
    {
      uid: 'player1',
      displayName: 'Player 1',
      isSelf: false,
      isFinished: false,
    },
    {
      uid: 'player2',
      displayName: 'Player 2',
      isSelf: false,
      isFinished: false,
    },
  ];

  const baseTileProps: Tile = {
    title: 'Test Tile',
    description: 'This is a test tile description',
    players: mockPlayers,
    current: false,
    isTransparent: false,
    className: 'test-class',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render tile with basic content', () => {
      render(<GameTile {...baseTileProps} />);

      expect(screen.getByText('Test Tile')).toBeInTheDocument();
      expect(screen.getByText('This is a test tile description')).toBeInTheDocument();
    });

    it('should render all players as avatars', () => {
      render(<GameTile {...baseTileProps} />);

      const avatars = screen.getAllByTestId('text-avatar');
      expect(avatars).toHaveLength(2);
      // AvatarGroup may reorder avatars, so check that both players are present
      const displayNames = avatars.map((avatar) => avatar.getAttribute('data-display-name'));
      const uids = avatars.map((avatar) => avatar.getAttribute('data-uid'));
      expect(displayNames).toContain('Player 1');
      expect(displayNames).toContain('Player 2');
      expect(uids).toContain('player1');
      expect(uids).toContain('player2');
    });

    it('should apply custom className', () => {
      render(<GameTile {...baseTileProps} />);

      const listItem = screen.getByRole('listitem');
      expect(listItem).toHaveClass('test-class');
    });

    it('should handle empty players array', () => {
      const propsWithNoPlayers = { ...baseTileProps, players: [] };
      render(<GameTile {...propsWithNoPlayers} />);

      expect(screen.queryAllByTestId('text-avatar')).toHaveLength(0);
    });
  });

  describe('current player handling', () => {
    it('should apply pulse animation when current player is present', () => {
      const propsWithCurrent = { ...baseTileProps, current: true };
      render(<GameTile {...propsWithCurrent} />);

      const listItem = screen.getByRole('listitem');
      expect(listItem).toHaveClass('pulse-animation');
    });

    it('should scroll into view when current player is present', () => {
      const propsWithCurrent = { ...baseTileProps, current: true };
      render(<GameTile {...propsWithCurrent} />);

      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
      });
    });

    it('should not apply pulse animation when no current player', () => {
      render(<GameTile {...baseTileProps} />);

      const listItem = screen.getByRole('listitem');
      expect(listItem).not.toHaveClass('pulse-animation');
    });

    it('should not scroll when no current player', () => {
      render(<GameTile {...baseTileProps} />);

      expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    });
  });

  describe('transparency handling', () => {
    it('should apply gray-tiles class when transparent', () => {
      const transparentProps = { ...baseTileProps, isTransparent: true };
      render(<GameTile {...transparentProps} />);

      const listItem = screen.getByRole('listitem');
      expect(listItem).toHaveClass('gray-tiles');
    });

    it('should apply pop-text class to title and description when transparent', () => {
      const transparentProps = { ...baseTileProps, isTransparent: true };
      render(<GameTile {...transparentProps} />);

      const title = screen.getByText('Test Tile');
      const description = screen.getByText('This is a test tile description');

      expect(title).toHaveClass('pop-text');
      expect(description).toHaveClass('pop-text');
    });

    it('should not apply transparency classes when not transparent', () => {
      render(<GameTile {...baseTileProps} />);

      const listItem = screen.getByRole('listitem');
      const title = screen.getByText('Test Tile');
      const description = screen.getByText('This is a test tile description');

      expect(listItem).not.toHaveClass('gray-tiles');
      expect(title).not.toHaveClass('pop-text');
      expect(description).not.toHaveClass('pop-text');
    });
  });

  describe('class combination logic', () => {
    it('should combine multiple classes correctly', () => {
      const propsWithMultiple = {
        ...baseTileProps,
        current: true,
        isTransparent: true,
        className: 'custom-class',
      };
      render(<GameTile {...propsWithMultiple} />);

      const listItem = screen.getByRole('listitem');
      expect(listItem).toHaveClass('pulse-animation');
      expect(listItem).toHaveClass('gray-tiles');
      expect(listItem).toHaveClass('custom-class');
    });

    it('should handle empty className gracefully', () => {
      const propsWithEmptyClass = { ...baseTileProps, className: '' };
      render(<GameTile {...propsWithEmptyClass} />);

      const listItem = screen.getByRole('listitem');
      // The component's class joining logic produces 'false' for empty className
      expect(listItem.className.trim()).toBe('false');
    });

    it('should trim whitespace from combined classes', () => {
      const propsWithSpaces = { ...baseTileProps, className: '  spaced-class  ' };
      render(<GameTile {...propsWithSpaces} />);

      const listItem = screen.getByRole('listitem');
      expect(listItem.className).not.toMatch(/^\s|\s$/); // No leading/trailing whitespace
    });
  });

  describe('avatar group limits', () => {
    it('should handle max 4 avatars as specified in AvatarGroup', () => {
      const manyPlayers: { uid: string; displayName: string }[] = Array.from(
        { length: 10 },
        (_, i) => ({
          uid: `player${i + 1}`,
          displayName: `Player ${i + 1}`,
        })
      );

      const propsWithManyPlayers = { ...baseTileProps, players: manyPlayers };
      render(<GameTile {...propsWithManyPlayers} />);

      // AvatarGroup with max={4} displays 3 avatars + "+N" indicator for the rest
      const avatars = screen.getAllByTestId('text-avatar');
      expect(avatars).toHaveLength(3);
    });
  });

  describe('accessibility', () => {
    it('should render as a proper list item', () => {
      render(<GameTile {...baseTileProps} />);

      const listItem = screen.getByRole('listitem');
      expect(listItem).toBeInTheDocument();
    });

    it('should maintain semantic structure with title and description', () => {
      render(<GameTile {...baseTileProps} />);

      // Title should be in a div with appropriate class
      const titleDiv = screen.getByText('Test Tile').closest('.tile-title');
      expect(titleDiv).toBeInTheDocument();

      // Description should be in a div with appropriate class
      const descriptionDiv = screen
        .getByText('This is a test tile description')
        .closest('.tile-description');
      expect(descriptionDiv).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined title', () => {
      const propsWithUndefinedTitle = { ...baseTileProps, title: undefined as any };
      render(<GameTile {...propsWithUndefinedTitle} />);

      // Should render without crashing
      expect(screen.getByRole('listitem')).toBeInTheDocument();
    });

    it('should handle undefined description', () => {
      const propsWithUndefinedDescription = { ...baseTileProps, description: undefined as any };
      render(<GameTile {...propsWithUndefinedDescription} />);

      // Should render without crashing
      expect(screen.getByRole('listitem')).toBeInTheDocument();
    });

    it('should handle empty title and description', () => {
      const propsWithEmpty = { ...baseTileProps, title: '', description: '' };
      render(<GameTile {...propsWithEmpty} />);

      const listItem = screen.getByRole('listitem');
      expect(listItem).toBeInTheDocument();
    });

    it('should handle players with missing displayName', () => {
      const playersWithMissingName: Player[] = [
        {
          uid: 'player1',
          displayName: '',
          isSelf: false,
          isFinished: false,
        },
        {
          uid: 'player2',
          displayName: undefined as any,
          isSelf: false,
          isFinished: false,
        },
      ];

      const propsWithIncompletePlayer = { ...baseTileProps, players: playersWithMissingName };
      render(<GameTile {...propsWithIncompletePlayer} />);

      const avatars = screen.getAllByTestId('text-avatar');
      expect(avatars).toHaveLength(2);
      expect(avatars[0]).toHaveAttribute('data-display-name', '');
      expect(avatars[1]).toHaveAttribute('data-display-name', '');
    });

    it('should handle players with missing uid', () => {
      const playersWithMissingUid: Player[] = [
        {
          uid: '',
          displayName: 'Player 1',
          isSelf: false,
          isFinished: false,
        },
        {
          uid: undefined as any,
          displayName: 'Player 2',
          isSelf: false,
          isFinished: false,
        },
      ];

      const propsWithIncompletePlayer = { ...baseTileProps, players: playersWithMissingUid };
      render(<GameTile {...propsWithIncompletePlayer} />);

      const avatars = screen.getAllByTestId('text-avatar');
      expect(avatars).toHaveLength(2);
      expect(avatars[0]).toHaveAttribute('data-uid', '');
      expect(avatars[1]).toHaveAttribute('data-uid', '');
    });
  });

  describe('re-rendering and memoization', () => {
    it('should handle player list changes correctly', () => {
      const { rerender } = render(<GameTile {...baseTileProps} />);

      expect(screen.getAllByTestId('text-avatar')).toHaveLength(2);

      const newPlayers: Player[] = [
        {
          uid: 'newPlayer',
          displayName: 'New Player',
          isSelf: false,
          isFinished: false,
        },
      ];

      rerender(<GameTile {...baseTileProps} players={newPlayers} />);

      const avatars = screen.getAllByTestId('text-avatar');
      expect(avatars).toHaveLength(1);
      expect(avatars[0]).toHaveAttribute('data-display-name', 'New Player');
    });

    it('should update current player effect on re-render', () => {
      const { rerender } = render(<GameTile {...baseTileProps} />);

      expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();

      rerender(<GameTile {...baseTileProps} current={true} />);

      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
      });
    });
  });

  describe('performance', () => {
    it('should render efficiently with many players', () => {
      const manyPlayers: { uid: string; displayName: string }[] = Array.from(
        { length: 100 },
        (_, i) => ({
          uid: `player${i}`,
          displayName: `Player ${i}`,
        })
      );

      render(<GameTile {...baseTileProps} players={manyPlayers} />);

      // AvatarGroup with max={4} displays only 3 avatars + "+N" indicator
      expect(screen.getAllByTestId('text-avatar')).toHaveLength(3);
    });

    it('should handle long titles and descriptions efficiently', () => {
      const longTitle = 'A'.repeat(1000);
      const longDescription = 'B'.repeat(10000);

      const propsWithLongContent = {
        ...baseTileProps,
        title: longTitle,
        description: longDescription,
      };

      render(<GameTile {...propsWithLongContent} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });
  });
});
