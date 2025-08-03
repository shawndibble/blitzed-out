import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import GameBoard from '../index';
import { Settings } from '@/types/Settings';
import { TileExport } from '@/types/gameBoard';
import type { HybridPlayer, LocalPlayerExtended } from '@/hooks/useHybridPlayerList';

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

// Mock the migration context
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

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn(),
    },
  }),
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

  const createMockTileExport = (overrides: Partial<TileExport>): TileExport => ({
    title: 'Default Title',
    description: 'Default description',
    ...overrides,
  });

  const mockGameBoard: TileExport[] = [
    createMockTileExport({
      title: 'Start',
      description: 'Welcome to the game! You are {player}.',
    }),
    createMockTileExport({
      title: 'Gentle',
      description: 'Take a gentle action as {sub}.',
    }),
    createMockTileExport({
      title: 'Intense',
      description: 'Perform an intense action as {dom}.',
    }),
    createMockTileExport({
      title: 'Finish',
      description: 'Game complete! Well done {player}.',
    }),
  ];

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

    vi.mocked(actionStringReplacement).mockImplementation(
      (description, _role, displayName, _localPlayers, useGenericPlaceholders) =>
        description
          ? useGenericPlaceholders
            ? description
                .replace(/{player}/g, 'the current player')
                .replace(/{dom}/g, 'a dominant')
                .replace(/{sub}/g, 'a submissive')
            : description
                .replace(/{player}/g, displayName || '')
                .replace(/{(sub|dom)}/g, displayName || '')
          : ''
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render game board with tiles', () => {
      const mockPlayerList = [
        {
          uid: 'player1',
          displayName: 'Player 1',
          location: 0,
          isSelf: false,
        },
      ];

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
        <GameBoard playerList={[]} isTransparent={false} gameBoard={[]} settings={mockSettings} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render null when gameBoard is not an array', () => {
      const { container } = render(
        <GameBoard
          playerList={[]}
          isTransparent={false}
          gameBoard={null as any}
          settings={mockSettings}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render gameboard with proper semantic structure', () => {
      const { container } = render(
        <GameBoard
          playerList={[]}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      const gameboardDiv = container.querySelector('.gameboard');
      expect(gameboardDiv).toBeInTheDocument();
      expect(gameboardDiv?.querySelector('ol')).toBeInTheDocument();
      expect(gameboardDiv).toHaveClass('transparent-scrollbar');
    });
  });

  describe('Game Board Layout and Structure', () => {
    it('should generate correct tile titles with index', () => {
      render(
        <GameBoard
          playerList={[]}
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

    it('should create ordered list structure for game progression', () => {
      const { container } = render(
        <GameBoard
          playerList={[]}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      const orderedList = container.querySelector('ol');
      expect(orderedList).toBeInTheDocument();

      const listItems = orderedList?.querySelectorAll('li[data-testid="game-tile"]');
      expect(listItems).toHaveLength(4);
    });

    it('should handle large game boards efficiently', () => {
      const largeGameBoard: TileExport[] = Array.from({ length: 100 }, (_, i) =>
        createMockTileExport({
          title: `Tile ${i + 1}`,
          description: `Description for tile ${i + 1}`,
        })
      );

      render(
        <GameBoard
          playerList={[]}
          isTransparent={false}
          gameBoard={largeGameBoard}
          settings={mockSettings}
        />
      );

      const tiles = screen.getAllByTestId('game-tile');
      expect(tiles).toHaveLength(100);
    });
  });

  describe('Player Positioning and Management', () => {
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

    it('should identify current player correctly', () => {
      render(
        <GameBoard
          playerList={mockPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      const tiles = screen.getAllByTestId('game-tile');

      // Only tile 2 should have current player (not at index 0)
      expect(tiles[0]).toHaveAttribute('data-has-current', 'false'); // Start tile doesn't count as current
      expect(tiles[1]).toHaveAttribute('data-has-current', 'false');
      expect(tiles[2]).toHaveAttribute('data-has-current', 'true');
      expect(tiles[3]).toHaveAttribute('data-has-current', 'false');
    });

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
  });

  describe('Hybrid Player Support', () => {
    const mockHybridPlayerList: HybridPlayer[] = [
      {
        uid: 'local-player1',
        displayName: 'Local Player 1',
        location: 1,
        isSelf: true,
        isFinished: false,
        status: 'active',
        lastActivity: new Date(),
        isLocal: true,
        localId: 'player1',
        role: 'dom',
        order: 1,
      } as LocalPlayerExtended,
      {
        uid: 'local-player2',
        displayName: 'Local Player 2',
        location: 3,
        isSelf: false,
        isFinished: false,
        status: 'active',
        lastActivity: new Date(),
        isLocal: true,
        localId: 'player2',
        role: 'sub',
        order: 2,
      } as LocalPlayerExtended,
      {
        uid: 'remote-player1',
        displayName: 'Remote Player 1',
        location: 2,
        isSelf: false,
        isFinished: false,
        status: 'active',
        lastActivity: new Date(),
        isLocal: false,
      },
    ];

    it('should handle hybrid player list with local and remote players', () => {
      render(
        <GameBoard
          playerList={mockHybridPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      const tiles = screen.getAllByTestId('game-tile');

      // Verify players are distributed correctly
      expect(tiles[1]).toHaveAttribute('data-player-count', '1'); // Local Player 1
      expect(tiles[2]).toHaveAttribute('data-player-count', '1'); // Remote Player 1
      expect(tiles[3]).toHaveAttribute('data-player-count', '1'); // Local Player 2
    });

    it('should extract local players for role-based player selection', () => {
      render(
        <GameBoard
          playerList={mockHybridPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      // Verify actionStringReplacement is called with local players
      expect(actionStringReplacement).toHaveBeenCalledWith(
        expect.any(String),
        'sub',
        'Test User',
        expect.arrayContaining([
          expect.objectContaining({
            id: 'player1',
            name: 'Local Player 1',
            role: 'dom',
            order: 1,
            isActive: true,
            deviceId: 'local-device',
            location: 1,
            isFinished: false,
          }),
          expect.objectContaining({
            id: 'player2',
            name: 'Local Player 2',
            role: 'sub',
            order: 2,
            isActive: false,
            deviceId: 'local-device',
            location: 3,
            isFinished: false,
          }),
        ]),
        true
      );
    });

    it('should handle non-hybrid player list (legacy format)', () => {
      const legacyPlayerList = [
        {
          uid: 'player1',
          displayName: 'Player 1',
          location: 0,
          isSelf: false,
        },
        {
          uid: 'player2',
          displayName: 'Player 2',
          location: 1,
          isSelf: true,
        },
      ];

      render(
        <GameBoard
          playerList={legacyPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      // Should render without crashing
      const tiles = screen.getAllByTestId('game-tile');
      expect(tiles).toHaveLength(4);

      // Should not pass local players to actionStringReplacement
      expect(actionStringReplacement).toHaveBeenCalledWith(
        expect.any(String),
        'sub',
        'Test User',
        undefined,
        true
      );
    });

    it('should handle mixed player types in array', () => {
      const mixedPlayerList = [
        {
          uid: 'regular-player',
          displayName: 'Regular Player',
          location: 0,
          isSelf: false,
        },
        ...mockHybridPlayerList,
      ];

      render(
        <GameBoard
          playerList={mixedPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      const tiles = screen.getAllByTestId('game-tile');
      expect(tiles[0]).toHaveAttribute('data-player-count', '1'); // Regular player at start
      expect(tiles[1]).toHaveAttribute('data-player-count', '1'); // Local Player 1
    });
  });

  describe('Action String Replacement', () => {
    const mockPlayerList = [
      {
        uid: 'user123',
        displayName: 'Test User',
        location: 2,
        isSelf: true,
      },
    ];

    it('should use generic placeholders for GameBoard display', () => {
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
        'sub',
        'Test User',
        undefined,
        true // useGenericPlaceholders should be true for GameBoard
      );
    });

    it('should use settings.role instead of tile role', () => {
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
        expect.any(String),
        'dom',
        'Test User',
        undefined,
        true
      );
    });

    it('should handle vers role correctly', () => {
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
        expect.any(String),
        'vers',
        'Test User',
        undefined,
        true
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
        'sub',
        'Test User',
        undefined,
        true
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

    it('should always show start tile (index 0) actions', () => {
      const settingsWithHidden = { ...mockSettings, hideBoardActions: true };

      render(
        <GameBoard
          playerList={mockPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={settingsWithHidden}
        />
      );

      // Start tile should always show action
      expect(actionStringReplacement).toHaveBeenCalledWith(
        'Welcome to the game! You are {player}.',
        'sub',
        'Test User',
        undefined,
        true
      );
    });
  });

  describe('Tile Type Hue Assignment', () => {
    it('should assign hue classes based on unique tile titles', () => {
      render(
        <GameBoard
          playerList={[]}
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
      const largeBoardWithManyTypes: TileExport[] = [
        createMockTileExport({ title: 'Start', description: 'Start' }),
        ...Array.from({ length: 12 }, (_, i) =>
          createMockTileExport({
            title: `Type${i + 1}`,
            description: `Description ${i + 1}`,
          })
        ),
        createMockTileExport({ title: 'Finish', description: 'Finish' }),
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

    it('should handle duplicate tile titles for hue calculation', () => {
      const boardWithDuplicates: TileExport[] = [
        createMockTileExport({ title: 'Start', description: 'Start' }),
        createMockTileExport({ title: 'Action', description: 'First action' }),
        createMockTileExport({ title: 'Action', description: 'Second action' }),
        createMockTileExport({ title: 'Different', description: 'Different action' }),
        createMockTileExport({ title: 'Finish', description: 'Finish' }),
      ];

      render(
        <GameBoard
          playerList={[]}
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

    it('should exclude start and end tiles from hue calculation', () => {
      const specialBoard: TileExport[] = [
        createMockTileExport({ title: 'Start', description: 'Start' }),
        createMockTileExport({ title: 'UniqueType', description: 'Only unique type' }),
        createMockTileExport({ title: 'Finish', description: 'Finish' }),
      ];

      render(
        <GameBoard
          playerList={[]}
          isTransparent={false}
          gameBoard={specialBoard}
          settings={mockSettings}
        />
      );

      const tiles = screen.getAllByTestId('game-tile');

      // Only the middle tile should get a hue class
      expect(tiles[1]).toHaveAttribute('data-classname', 'hue1');
    });
  });

  describe('Transparency Handling', () => {
    it('should pass transparency prop to all tiles', () => {
      render(
        <GameBoard
          playerList={[]}
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
          playerList={[]}
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

  describe('Edge Cases and Error Handling', () => {
    it('should handle tiles with missing descriptions', () => {
      const boardWithMissingDescriptions: TileExport[] = [
        createMockTileExport({ title: 'Start', description: '' }),
        createMockTileExport({ title: 'Action', description: undefined as any }),
      ];

      render(
        <GameBoard
          playerList={[]}
          isTransparent={false}
          gameBoard={boardWithMissingDescriptions}
          settings={mockSettings}
        />
      );

      expect(actionStringReplacement).toHaveBeenCalledWith('', 'sub', 'Test User', undefined, true);
      expect(actionStringReplacement).toHaveBeenCalledWith('', 'sub', 'Test User', undefined, true);
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
          playerList={[]}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      expect(actionStringReplacement).toHaveBeenCalledWith(
        expect.any(String),
        'sub',
        '',
        undefined,
        true
      );
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

    it('should handle malformed player data', () => {
      const malformedPlayerList = [
        {
          uid: '',
          displayName: '',
          location: 0,
          isSelf: false,
        },
        {
          uid: null as any,
          displayName: null as any,
          location: undefined as any,
          isSelf: undefined as any,
        },
      ];

      render(
        <GameBoard
          playerList={malformedPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      // Should render without crashing
      const tiles = screen.getAllByTestId('game-tile');
      expect(tiles).toHaveLength(4);
    });

    it('should handle very large player counts per tile', () => {
      const manyPlayersOnOneTile = Array.from({ length: 50 }, (_, i) => ({
        uid: `player${i}`,
        displayName: `Player ${i}`,
        location: 1, // All on same tile
        isSelf: i === 0,
      }));

      render(
        <GameBoard
          playerList={manyPlayersOnOneTile}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      const tiles = screen.getAllByTestId('game-tile');
      expect(tiles[1]).toHaveAttribute('data-player-count', '50');
    });
  });

  describe('Performance Considerations', () => {
    it('should efficiently calculate unique tile types for hue assignment', () => {
      // Test with many tiles but few unique types
      const boardWithFewUniqueTypes: TileExport[] = Array.from({ length: 50 }, (_, i) =>
        createMockTileExport({
          title: `Type${i % 5}`, // Only 5 unique types
          description: `Description ${i}`,
        })
      );

      render(
        <GameBoard
          playerList={[]}
          isTransparent={false}
          gameBoard={boardWithFewUniqueTypes}
          settings={mockSettings}
        />
      );

      const tiles = screen.getAllByTestId('game-tile');
      expect(tiles).toHaveLength(50);

      // Check that we have hue classes
      const firstTileClass = tiles[0].getAttribute('data-classname');
      expect(firstTileClass).toMatch(/^hue\d+$/);
    });

    it('should handle rapid re-renders efficiently', () => {
      const { rerender } = render(
        <GameBoard
          playerList={[]}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      // Rapid re-renders with different data
      for (let i = 0; i < 10; i++) {
        rerender(
          <GameBoard
            playerList={[
              {
                uid: `player${i}`,
                displayName: `Player ${i}`,
                location: i % 4,
                isSelf: i === 0,
              },
            ]}
            isTransparent={i % 2 === 0}
            gameBoard={mockGameBoard}
            settings={mockSettings}
          />
        );
      }

      // Should still render correctly
      const tiles = screen.getAllByTestId('game-tile');
      expect(tiles).toHaveLength(4);
    });
  });

  describe('Integration with Game Logic', () => {
    it('should correctly integrate with turn-based gameplay', () => {
      const turnBasedPlayerList = [
        {
          uid: 'player1',
          displayName: 'Player 1',
          location: 5,
          isSelf: false,
        },
        {
          uid: 'player2',
          displayName: 'Player 2',
          location: 5,
          isSelf: true, // Current turn
        },
      ];

      render(
        <GameBoard
          playerList={turnBasedPlayerList}
          isTransparent={false}
          gameBoard={Array.from({ length: 10 }, (_, i) =>
            createMockTileExport({
              title: `Tile ${i + 1}`,
              description: `Action for tile ${i + 1}`,
            })
          )}
          settings={mockSettings}
        />
      );

      const tiles = screen.getAllByTestId('game-tile');
      expect(tiles[5]).toHaveAttribute('data-has-current', 'true');
      expect(tiles[5]).toHaveAttribute('data-player-count', '2');
    });

    it('should handle game state transitions', () => {
      const initialPlayerList = [
        {
          uid: 'player1',
          displayName: 'Player 1',
          location: 0,
          isSelf: true,
        },
      ];

      const { rerender } = render(
        <GameBoard
          playerList={initialPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      // Simulate player movement
      const movedPlayerList = [
        {
          uid: 'player1',
          displayName: 'Player 1',
          location: 2,
          isSelf: true,
        },
      ];

      rerender(
        <GameBoard
          playerList={movedPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      const tiles = screen.getAllByTestId('game-tile');
      expect(tiles[0]).toHaveAttribute('data-has-current', 'false');
      expect(tiles[2]).toHaveAttribute('data-has-current', 'true');
    });
  });

  describe('Accessibility', () => {
    it('should render with proper semantic structure', () => {
      const { container } = render(
        <GameBoard
          playerList={[]}
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

    it('should maintain proper ordered list semantics for screen readers', () => {
      const { container } = render(
        <GameBoard
          playerList={[]}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      const orderedList = container.querySelector('ol');
      expect(orderedList).toBeInTheDocument();
      // Note: itemScope is not currently implemented but could be added for structured data
    });
  });

  describe('Real-time Features', () => {
    it('should handle real-time player position updates', () => {
      const playerList = [
        {
          uid: 'player1',
          displayName: 'Player 1',
          location: 1,
          isSelf: false,
        },
        {
          uid: 'player2',
          displayName: 'Player 2',
          location: 1,
          isSelf: true,
        },
      ];

      const { rerender } = render(
        <GameBoard
          playerList={playerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      let tiles = screen.getAllByTestId('game-tile');
      expect(tiles[1]).toHaveAttribute('data-player-count', '2');

      // Simulate real-time update - players move
      const updatedPlayerList = [
        {
          uid: 'player1',
          displayName: 'Player 1',
          location: 2,
          isSelf: false,
        },
        {
          uid: 'player2',
          displayName: 'Player 2',
          location: 3,
          isSelf: true,
        },
      ];

      rerender(
        <GameBoard
          playerList={updatedPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      tiles = screen.getAllByTestId('game-tile');
      expect(tiles[1]).toHaveAttribute('data-player-count', '0');
      expect(tiles[2]).toHaveAttribute('data-player-count', '1');
      expect(tiles[3]).toHaveAttribute('data-player-count', '1');
    });

    it('should handle concurrent player actions', () => {
      const concurrentPlayerList = [
        {
          uid: 'player1',
          displayName: 'Player 1',
          location: 1,
          isSelf: true,
        },
        {
          uid: 'player2',
          displayName: 'Player 2',
          location: 1,
          isSelf: false,
        },
        {
          uid: 'player3',
          displayName: 'Player 3',
          location: 1,
          isSelf: false,
        },
      ];

      render(
        <GameBoard
          playerList={concurrentPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      const tiles = screen.getAllByTestId('game-tile');
      expect(tiles[1]).toHaveAttribute('data-player-count', '3');
      expect(tiles[1]).toHaveAttribute('data-has-current', 'true');
    });
  });

  describe('Data Validation', () => {
    it('should validate TileExport structure', () => {
      const invalidGameBoard = [
        { title: 'Valid Tile', description: 'Valid description' },
        { title: '', description: 'Empty title' },
        { description: 'Missing title' } as any,
        { title: 'Missing description' } as any,
      ];

      render(
        <GameBoard
          playerList={[]}
          isTransparent={false}
          gameBoard={invalidGameBoard}
          settings={mockSettings}
        />
      );

      // Should render all tiles even with invalid data
      const tiles = screen.getAllByTestId('game-tile');
      expect(tiles).toHaveLength(4);
    });

    it('should handle mixed valid and invalid player data', () => {
      const mixedPlayerList = [
        {
          uid: 'valid-player',
          displayName: 'Valid Player',
          location: 0,
          isSelf: false,
        },
        {
          // Missing required fields
          displayName: 'Incomplete Player',
        } as any,
        null as any,
        undefined as any,
      ].filter(Boolean); // Filter out null/undefined

      render(
        <GameBoard
          playerList={mixedPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      // Should handle gracefully
      const tiles = screen.getAllByTestId('game-tile');
      expect(tiles).toHaveLength(4);
    });
  });
});
