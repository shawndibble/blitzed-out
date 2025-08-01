import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import GameBoard from '../index';
import { Settings } from '@/types/Settings';
import { Tile } from '@/types/gameBoard';

// Mock dependencies
vi.mock('@/context/hooks/useAuth', () => ({
  default: vi.fn(),
}));

vi.mock('@/services/actionStringReplacement', () => ({
  default: vi.fn(),
}));

vi.mock('../GameTile', () => ({
  default: vi.fn(({ title, description, players, current, isTransparent, className }) => (
    <li
      data-testid="game-tile"
      data-title={title}
      data-description={description}
      data-player-count={players.length}
      data-has-current={!!current}
      data-transparent={isTransparent}
      data-classname={className}
    >
      {title} - {description}
    </li>
  )),
}));

import useAuth from '@/context/hooks/useAuth';
import actionStringReplacement from '@/services/actionStringReplacement';

describe('GameBoard', () => {
  const mockUser = {
    uid: 'user123',
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: null,
  };

  const mockPlayerList = [
    {
      uid: 'player1',
      displayName: 'Player 1',
      location: 0,
      isSelf: false,
    },
    {
      uid: 'user123',
      displayName: 'Test User',
      location: 2,
      isSelf: true,
    },
    {
      uid: 'player2',
      displayName: 'Player 2',
      location: 2,
      isSelf: false,
    },
  ];

  const createMockTile = (overrides: Partial<Tile>): Tile => ({
    title: 'Default Title',
    description: 'Default description',
    players: [],
    current: null,
    isTransparent: false,
    className: '',
    ...overrides,
  });

  const mockGameBoard: Tile[] = [
    createMockTile({
      title: 'Start',
      description: 'Welcome to the game! You are {player}.',
      role: 'player',
    }),
    createMockTile({
      title: 'Gentle',
      description: 'Take a gentle action as {sub}.',
      role: 'sub',
    }),
    createMockTile({
      title: 'Intense',
      description: 'Perform an intense action as {dom}.',
      role: 'dom',
    }),
    createMockTile({
      title: 'Finish',
      description: 'Game complete! Well done {player}.',
      role: 'player',
    }),
  ];

  const mockSettings: Settings = {
    hideBoardActions: false,
    roomTileCount: 40,
    finishRange: [33, 66],
    room: 'testroom',
    gameMode: 'online',
    role: 'sub',
    difficulty: 'normal',
    boardUpdated: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      // @ts-expect-error Mock user object with simplified type for testing
      user: mockUser,
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      resetPassword: vi.fn(),
      updateUserProfile: vi.fn(),
    });

    vi.mocked(actionStringReplacement).mockImplementation((description, _role, displayName) =>
      description
        ? description
            .replace(/{player}/g, displayName || '')
            .replace(/{(sub|dom)}/g, displayName || '')
        : ''
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render game board with tiles', () => {
      render(
        <GameBoard
          playerList={mockPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      const gameTiles = screen.getAllByTestId('game-tile');
      expect(gameTiles).toHaveLength(4);
    });

    it('should render null when gameBoard is empty', () => {
      const { container } = render(
        <GameBoard
          playerList={mockPlayerList}
          isTransparent={false}
          gameBoard={[]}
          settings={mockSettings}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render null when gameBoard is not an array', () => {
      const { container } = render(
        <GameBoard
          playerList={mockPlayerList}
          isTransparent={false}
          gameBoard={null as any}
          settings={mockSettings}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render gameboard with proper structure', () => {
      const { container } = render(
        <GameBoard
          playerList={mockPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      const gameboardDiv = container.querySelector('.gameboard');
      expect(gameboardDiv).toBeInTheDocument();
      expect(gameboardDiv?.querySelector('ol')).toBeInTheDocument();
    });
  });

  describe('tile title generation', () => {
    it('should generate correct tile titles with index', () => {
      render(
        <GameBoard
          playerList={mockPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      const tiles = screen.getAllByTestId('game-tile');

      expect(tiles[0]).toHaveAttribute('data-title', '#1: Start');
      expect(tiles[1]).toHaveAttribute('data-title', '#2: Gentle');
      expect(tiles[2]).toHaveAttribute('data-title', '#3: Intense');
      expect(tiles[3]).toHaveAttribute('data-title', '#4: Finish');
    });
  });

  describe('player positioning', () => {
    it('should correctly assign players to tiles based on location', () => {
      render(
        <GameBoard
          playerList={mockPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      const tiles = screen.getAllByTestId('game-tile');

      // Tile 0 should have player1
      expect(tiles[0]).toHaveAttribute('data-player-count', '1');

      // Tile 2 should have both user123 and player2
      expect(tiles[2]).toHaveAttribute('data-player-count', '2');
      expect(tiles[2]).toHaveAttribute('data-has-current', 'true');
    });

    it('should handle tiles with no players', () => {
      render(
        <GameBoard
          playerList={mockPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      const tiles = screen.getAllByTestId('game-tile');

      // Tile 1 should have no players
      expect(tiles[1]).toHaveAttribute('data-player-count', '0');
      expect(tiles[1]).toHaveAttribute('data-has-current', 'false');
    });
  });

  describe('action string replacement', () => {
    it('should replace action strings for visible tiles', () => {
      render(
        <GameBoard
          playerList={mockPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      expect(actionStringReplacement).toHaveBeenCalledWith(
        'Welcome to the game! You are {player}.',
        'sub', // Now uses settings.role instead of tile.role
        'Test User'
      );
      expect(actionStringReplacement).toHaveBeenCalledWith(
        'Take a gentle action as {sub}.',
        'sub', // Now uses settings.role instead of tile.role
        'Test User'
      );
    });

    it('should use different roles from settings', () => {
      const domSettings = { ...mockSettings, role: 'dom' as const };

      render(
        <GameBoard
          playerList={mockPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={domSettings}
        />
      );

      expect(actionStringReplacement).toHaveBeenCalledWith(
        'Welcome to the game! You are {player}.',
        'dom', // Uses settings.role = 'dom'
        'Test User'
      );

      const versSettings = { ...mockSettings, role: 'vers' as const };

      render(
        <GameBoard
          playerList={mockPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={versSettings}
        />
      );

      expect(actionStringReplacement).toHaveBeenCalledWith(
        'Welcome to the game! You are {player}.',
        'vers', // Uses settings.role = 'vers'
        'Test User'
      );
    });

    it('should show action for current player tile regardless of hideBoardActions', () => {
      const settingsWithHidden = { ...mockSettings, hideBoardActions: true };

      render(
        <GameBoard
          playerList={mockPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={settingsWithHidden}
        />
      );

      // Should still call actionStringReplacement for tile where current player is located
      expect(actionStringReplacement).toHaveBeenCalledWith(
        'Perform an intense action as {dom}.',
        'sub', // Now uses settings.role instead of tile.role
        'Test User'
      );
    });

    it('should hide actions when hideBoardActions is true and player not current', () => {
      const settingsWithHidden = { ...mockSettings, hideBoardActions: true };

      render(
        <GameBoard
          playerList={mockPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={settingsWithHidden}
        />
      );

      const tiles = screen.getAllByTestId('game-tile');

      // Check that hidden descriptions contain question marks
      const hiddenTile = tiles[1]; // Tile where player is not current
      const description = hiddenTile.getAttribute('data-description');
      expect(description).toMatch(/\?+/); // Should contain question marks
    });
  });

  describe('tile type hue assignment', () => {
    it('should assign hue classes based on unique tile titles', () => {
      render(
        <GameBoard
          playerList={mockPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      const tiles = screen.getAllByTestId('game-tile');

      // Start and Finish tiles (index 0 and last) should not contribute to hue calculation
      // So Gentle should get hue1 and Intense should get hue2
      expect(tiles[1]).toHaveAttribute('data-classname', 'hue1');
      expect(tiles[2]).toHaveAttribute('data-classname', 'hue2');
    });

    it('should cycle hue classes for more than 10 unique types', () => {
      const largeBoardWithManyTypes: Tile[] = [
        createMockTile({ title: 'Start', description: 'Start' }),
        ...Array.from({ length: 12 }, (_, i) =>
          createMockTile({
            title: `Type${i + 1}`,
            description: `Description ${i + 1}`,
          })
        ),
        createMockTile({ title: 'Finish', description: 'Finish' }),
      ];

      render(
        <GameBoard
          playerList={[]}
          isTransparent={false}
          gameBoard={largeBoardWithManyTypes}
          settings={mockSettings}
        />
      );

      const tiles = screen.getAllByTestId('game-tile');

      // 11th unique type should cycle back to hue1 (10 % 10 + 1 = 1)
      expect(tiles[11]).toHaveAttribute('data-classname', 'hue1');
      // 12th unique type should be hue2
      expect(tiles[12]).toHaveAttribute('data-classname', 'hue2');
    });
  });

  describe('transparency handling', () => {
    it('should pass transparency prop to all tiles', () => {
      render(
        <GameBoard
          playerList={mockPlayerList}
          isTransparent={true}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      const tiles = screen.getAllByTestId('game-tile');
      tiles.forEach((tile) => {
        expect(tile).toHaveAttribute('data-transparent', 'true');
      });
    });

    it('should handle non-transparent state', () => {
      render(
        <GameBoard
          playerList={mockPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      const tiles = screen.getAllByTestId('game-tile');
      tiles.forEach((tile) => {
        expect(tile).toHaveAttribute('data-transparent', 'false');
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty player list', () => {
      render(
        <GameBoard
          playerList={[]}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      const tiles = screen.getAllByTestId('game-tile');
      tiles.forEach((tile) => {
        expect(tile).toHaveAttribute('data-player-count', '0');
        expect(tile).toHaveAttribute('data-has-current', 'false');
      });
    });

    it('should handle tiles with missing descriptions', () => {
      const boardWithMissingDescriptions: Tile[] = [
        createMockTile({ title: 'Start', description: '' }),
        createMockTile({ title: 'Action', description: undefined as any }),
      ];

      render(
        <GameBoard
          playerList={mockPlayerList}
          isTransparent={false}
          gameBoard={boardWithMissingDescriptions}
          settings={mockSettings}
        />
      );

      expect(actionStringReplacement).toHaveBeenCalledWith('', 'sub', 'Test User');
      expect(actionStringReplacement).toHaveBeenCalledWith('', 'sub', 'Test User');
    });

    it('should handle user without display name', () => {
      vi.mocked(useAuth).mockReturnValue({
        // @ts-expect-error Mock user object with null displayName for testing
        user: { ...mockUser, displayName: null },
        loading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        signUp: vi.fn(),
        resetPassword: vi.fn(),
        updateUserProfile: vi.fn(),
      });

      render(
        <GameBoard
          playerList={mockPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      expect(actionStringReplacement).toHaveBeenCalledWith(
        expect.any(String),
        'sub', // Now uses settings.role instead of tile.role
        ''
      );
    });

    it('should handle duplicate tile titles for hue calculation', () => {
      const boardWithDuplicates: Tile[] = [
        createMockTile({ title: 'Start', description: 'Start' }),
        createMockTile({ title: 'Action', description: 'First action' }),
        createMockTile({ title: 'Action', description: 'Second action' }),
        createMockTile({ title: 'Different', description: 'Different action' }),
        createMockTile({ title: 'Finish', description: 'Finish' }),
      ];

      render(
        <GameBoard
          playerList={mockPlayerList}
          isTransparent={false}
          gameBoard={boardWithDuplicates}
          settings={mockSettings}
        />
      );

      const tiles = screen.getAllByTestId('game-tile');

      // Both Action tiles should have the same hue
      expect(tiles[1]).toHaveAttribute('data-classname', 'hue1');
      expect(tiles[2]).toHaveAttribute('data-classname', 'hue1');
      expect(tiles[3]).toHaveAttribute('data-classname', 'hue2');
    });

    it('should handle players at the start tile (index 0)', () => {
      const playerAtStart = [
        {
          uid: 'player1',
          displayName: 'Player 1',
          location: 0,
          isSelf: true,
        },
      ];

      render(
        <GameBoard
          playerList={playerAtStart}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      const tiles = screen.getAllByTestId('game-tile');
      expect(tiles[0]).toHaveAttribute('data-has-current', 'false'); // Not current for start tile
    });
  });

  describe('performance considerations', () => {
    it('should efficiently calculate unique tile types for hue assignment', () => {
      // Test with many tiles but few unique types
      const boardWithFewUniqueTypes: Tile[] = Array.from({ length: 50 }, (_, i) =>
        createMockTile({
          title: `Type${i % 5}`, // Only 5 unique types
          description: `Description ${i}`,
        })
      );

      render(
        <GameBoard
          playerList={mockPlayerList}
          isTransparent={false}
          gameBoard={boardWithFewUniqueTypes}
          settings={mockSettings}
        />
      );

      const tiles = screen.getAllByTestId('game-tile');
      expect(tiles).toHaveLength(50);

      // Check that we have hue classes (the exact values may vary due to array indexing)
      const firstTileClass = tiles[0].getAttribute('data-classname');
      const secondTileClass = tiles[1].getAttribute('data-classname');

      expect(firstTileClass).toMatch(/^hue\d+$/);
      expect(secondTileClass).toMatch(/^hue\d+$/);
    });
  });

  describe('accessibility', () => {
    it('should render with proper semantic structure', () => {
      const { container } = render(
        <GameBoard
          playerList={mockPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      const gameboardContainer = container.querySelector('.gameboard');
      expect(gameboardContainer).toBeInTheDocument();

      const orderList = gameboardContainer?.querySelector('ol');
      expect(orderList).toBeInTheDocument();
    });
  });
});
