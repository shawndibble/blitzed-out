import type { HybridPlayer, LocalPlayerExtended } from '@/hooks/useHybridPlayerList';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import GameBoard from '../index';
import { Settings } from '@/types/Settings';
import { TileExport } from '@/types/gameBoard';
import actionStringReplacement from '@/services/actionStringReplacement';
import useAuth from '@/context/hooks/useAuth';

// Mock dependencies
vi.mock('@/context/hooks/useAuth', () => ({
  default: vi.fn(() => ({
    user: null,
    signInWithGoogle: vi.fn(),
    linkWithGoogle: vi.fn(),
    signInAnonymously: vi.fn(),
    signOut: vi.fn(),
    loading: false,
    error: null,
  })),
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

vi.mock('./TokenAnimationLayer', () => ({
  default: React.forwardRef<any, any>((_props, ref) => (
    <div data-testid="token-animation-layer" ref={ref} />
  )),
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

vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef<any, any>((props, ref) => {
      const {
        onUpdate: _onUpdate,
        onAnimationComplete: _onAnimationComplete,
        ...restProps
      } = props;
      return React.createElement('div', { ...restProps, ref });
    }),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
  useTransform: () => ({ get: () => 0 }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

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
    boardUpdated: false,
  };

  const createMockTileExport = (overrides: Partial<TileExport>): TileExport => ({
    title: 'Default Title',
    description: 'Default description',
    ...overrides,
  });

  const mockGameBoard: TileExport[] = [
    createMockTileExport({ title: 'Start', description: 'Welcome to the game! You are {player}.' }),
    createMockTileExport({ title: 'Gentle', description: 'Take a gentle action as {sub}.' }),
    createMockTileExport({ title: 'Intense', description: 'Perform an intense action as {dom}.' }),
    createMockTileExport({ title: 'Finish', description: 'Game complete! Well done {player}.' }),
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

  describe('Core Rendering', () => {
    it('should render game board with correct structure and tiles', () => {
      const mockPlayerList = [
        { uid: 'player1', displayName: 'Player 1', location: 0, isSelf: false },
      ];

      const { container } = render(
        <GameBoard
          playerList={mockPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      // Verify semantic structure
      const gameboardDiv = container.querySelector('.gameboard');
      expect(gameboardDiv).toBeInTheDocument();
      expect(gameboardDiv?.querySelector('ol')).toBeInTheDocument();
      expect(gameboardDiv).toHaveClass('transparent-scrollbar');

      // Verify tiles rendered
      const gameTiles = screen.getAllByTestId('game-tile');
      expect(gameTiles).toHaveLength(4);

      // Verify tile titles include index
      expect(gameTiles[0]).toHaveAttribute('data-title', '#1: Start');
      expect(gameTiles[1]).toHaveAttribute('data-title', '#2: Gentle');
      expect(gameTiles[2]).toHaveAttribute('data-title', '#3: Intense');
      expect(gameTiles[3]).toHaveAttribute('data-title', '#4: Finish');
    });

    it('should return null for empty or invalid gameBoard', () => {
      const { container, rerender } = render(
        <GameBoard playerList={[]} isTransparent={false} gameBoard={[]} settings={mockSettings} />
      );
      expect(container.firstChild).toBeNull();

      rerender(
        <GameBoard
          playerList={[]}
          isTransparent={false}
          gameBoard={null as any}
          settings={mockSettings}
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Player Management', () => {
    it('should correctly assign players to tiles and identify current player', () => {
      const mockPlayerList = [
        { uid: 'player1', displayName: 'Player 1', location: 0, isSelf: false },
        { uid: 'user123', displayName: 'Test User', location: 2, isSelf: true },
        { uid: 'player2', displayName: 'Player 2', location: 2, isSelf: false },
      ];

      render(
        <GameBoard
          playerList={mockPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      const tiles = screen.getAllByTestId('game-tile');

      // Tile 0 should have player1, but not marked as current (start tile exception)
      expect(tiles[0]).toHaveAttribute('data-player-count', '1');
      expect(tiles[0]).toHaveAttribute('data-has-current', 'false');

      // Tile 1 should have no players
      expect(tiles[1]).toHaveAttribute('data-player-count', '0');
      expect(tiles[1]).toHaveAttribute('data-has-current', 'false');

      // Tile 2 should have both user123 and player2, marked as current
      expect(tiles[2]).toHaveAttribute('data-player-count', '2');
      expect(tiles[2]).toHaveAttribute('data-has-current', 'true');
    });

    it('should handle empty player list and player movement', () => {
      const { rerender } = render(
        <GameBoard
          playerList={[]}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      let tiles = screen.getAllByTestId('game-tile');
      tiles.forEach((tile) => {
        expect(tile).toHaveAttribute('data-player-count', '0');
        expect(tile).toHaveAttribute('data-has-current', 'false');
      });

      // Simulate player movement
      const movedPlayerList = [
        { uid: 'player1', displayName: 'Player 1', location: 2, isSelf: true },
      ];

      rerender(
        <GameBoard
          playerList={movedPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      tiles = screen.getAllByTestId('game-tile');
      expect(tiles[0]).toHaveAttribute('data-has-current', 'false');
      expect(tiles[2]).toHaveAttribute('data-has-current', 'true');
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

      expect(tiles[1]).toHaveAttribute('data-player-count', '1'); // Local Player 1
      expect(tiles[2]).toHaveAttribute('data-player-count', '1'); // Remote Player 1
      expect(tiles[3]).toHaveAttribute('data-player-count', '1'); // Local Player 2

      // Verify actionStringReplacement receives local players
      expect(actionStringReplacement).toHaveBeenCalledWith(
        expect.any(String),
        'sub',
        'Test User',
        expect.arrayContaining([
          expect.objectContaining({ id: 'player1', name: 'Local Player 1', role: 'dom' }),
          expect.objectContaining({ id: 'player2', name: 'Local Player 2', role: 'sub' }),
        ]),
        true,
        undefined,
        undefined
      );
    });

    it('should handle legacy player format without local players', () => {
      const legacyPlayerList = [
        { uid: 'player1', displayName: 'Player 1', location: 0, isSelf: false },
        { uid: 'player2', displayName: 'Player 2', location: 1, isSelf: true },
      ];

      render(
        <GameBoard
          playerList={legacyPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      const tiles = screen.getAllByTestId('game-tile');
      expect(tiles).toHaveLength(4);

      // Should not pass local players to actionStringReplacement
      expect(actionStringReplacement).toHaveBeenCalledWith(
        expect.any(String),
        'sub',
        'Test User',
        undefined,
        true,
        undefined,
        undefined
      );
    });
  });

  describe('Action String Replacement and Settings', () => {
    const mockPlayerList = [
      { uid: 'user123', displayName: 'Test User', location: 2, isSelf: true },
    ];

    it('should use generic placeholders and respect role settings', () => {
      const { rerender } = render(
        <GameBoard
          playerList={mockPlayerList}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      // Should use generic placeholders and default role
      expect(actionStringReplacement).toHaveBeenCalledWith(
        'Welcome to the game! You are {player}.',
        'sub',
        'Test User',
        undefined,
        true,
        undefined,
        undefined
      );

      // Test with different role
      const domSettings = { ...mockSettings, role: 'dom' as const };
      rerender(
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
        true,
        undefined,
        undefined
      );

      // Test with vers role
      const versSettings = { ...mockSettings, role: 'vers' as const };
      rerender(
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
        true,
        undefined,
        undefined
      );
    });

    it('should handle hideBoardActions setting correctly', () => {
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

      // Start tile (index 0) should always show action
      expect(actionStringReplacement).toHaveBeenCalledWith(
        'Welcome to the game! You are {player}.',
        'sub',
        'Test User',
        undefined,
        true,
        undefined,
        undefined
      );

      // Current player tile (index 2) should show action
      expect(actionStringReplacement).toHaveBeenCalledWith(
        'Perform an intense action as {dom}.',
        'sub',
        'Test User',
        undefined,
        true,
        undefined,
        undefined
      );

      // Non-current tile should have hidden description (question marks)
      const hiddenTile = tiles[1];
      const description = hiddenTile.getAttribute('data-description');
      expect(description).toMatch(/\?+/);
    });
  });

  describe('Tile Styling and Hue Assignment', () => {
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

      // Start and Finish tiles (index 0 and last) excluded from hue calculation
      expect(tiles[1]).toHaveAttribute('data-classname', 'hue1'); // Gentle
      expect(tiles[2]).toHaveAttribute('data-classname', 'hue2'); // Intense
    });

    it('should handle duplicate titles and cycle hue classes for many types', () => {
      const boardWithDuplicates: TileExport[] = [
        createMockTileExport({ title: 'Start', description: 'Start' }),
        createMockTileExport({ title: 'Action', description: 'First action' }),
        createMockTileExport({ title: 'Action', description: 'Second action' }),
        createMockTileExport({ title: 'Different', description: 'Different action' }),
        ...Array.from({ length: 10 }, (_, i) =>
          createMockTileExport({ title: `Type${i}`, description: `Description ${i}` })
        ),
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

      // Both Action tiles should have same hue
      expect(tiles[1]).toHaveAttribute('data-classname', 'hue1');
      expect(tiles[2]).toHaveAttribute('data-classname', 'hue1');
      expect(tiles[3]).toHaveAttribute('data-classname', 'hue2');

      // Type7 is the 10th unique type (after Action, Different, Type0-Type6), should get hue10
      expect(tiles[11]).toHaveAttribute('data-classname', 'hue10');
    });

    it('should apply transparency prop to all tiles', () => {
      const { rerender } = render(
        <GameBoard
          playerList={[]}
          isTransparent={true}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      let tiles = screen.getAllByTestId('game-tile');
      tiles.forEach((tile) => {
        expect(tile).toHaveAttribute('data-transparent', 'true');
      });

      rerender(
        <GameBoard
          playerList={[]}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      tiles = screen.getAllByTestId('game-tile');
      tiles.forEach((tile) => {
        expect(tile).toHaveAttribute('data-transparent', 'false');
      });
    });
  });

  describe('Performance and Scale', () => {
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

      // Verify hue classes are assigned
      const firstTileClass = tiles[0].getAttribute('data-classname');
      expect(firstTileClass).toMatch(/^hue\d+$/);
    });

    it('should handle multiple rapid player updates', () => {
      const { rerender } = render(
        <GameBoard
          playerList={[]}
          isTransparent={false}
          gameBoard={mockGameBoard}
          settings={mockSettings}
        />
      );

      // Simulate rapid updates
      for (let i = 0; i < 5; i++) {
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

      const tiles = screen.getAllByTestId('game-tile');
      expect(tiles).toHaveLength(4);
    });
  });
});
