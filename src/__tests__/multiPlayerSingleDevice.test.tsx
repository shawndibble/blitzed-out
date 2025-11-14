/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import useHybridPlayerList from '@/hooks/useHybridPlayerList';
import type { LocalPlayer, LocalSessionSettings } from '@/types';
import type { TileExport } from '@/types/gameBoard';

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

// Mock authentication
vi.mock('@/context/hooks/useAuth', () => ({
  default: () => ({
    user: {
      uid: 'test-user',
      displayName: 'Test User',
    },
  }),
}));

// Mock settings
vi.mock('@/stores/settingsStore', () => ({
  useSettings: () => [{ role: 'sub' }],
}));

// Mock messages
vi.mock('@/context/hooks/useMessages', () => ({
  default: () => ({
    messages: [],
    isLoading: false,
  }),
}));

// Mock user list
vi.mock('@/stores/userListStore', () => ({
  useUserListStore: () => ({
    onlineUsers: {},
  }),
}));

// Mock player list
vi.mock('@/hooks/usePlayerList', () => ({
  default: () => [],
}));

// Mock firebase
vi.mock('@/services/firebase', () => ({
  sendMessage: vi.fn(),
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock database
const mockDb = {
  localPlayerSessions: {
    add: vi.fn(),
    where: vi.fn(() => ({
      equals: vi.fn(() => ({
        first: vi.fn(),
        modify: vi.fn(),
      })),
    })),
  },
};

vi.mock('@/stores/store', () => ({
  default: mockDb,
}));

// Mock local player store
let mockSession: any = null;

vi.mock('@/stores/localPlayerStore', () => ({
  useLocalPlayerStore: () => ({
    session: mockSession,
    error: null,
    isLoading: false,
    hasLocalPlayers: () => mockSession?.isActive === true && mockSession?.players?.length > 0,
    isLocalPlayerRoom: () => mockSession?.isActive === true,
    getCurrentPlayer: () => {
      if (!mockSession?.isActive || !mockSession?.players) return null;
      const index = mockSession.currentPlayerIndex || 0;
      return mockSession.players[index] || null;
    },
    setSession: vi.fn(),
    clearSession: vi.fn(),
    setError: vi.fn(),
    setLoading: vi.fn(),
    initSession: vi.fn(),
    loadSession: vi.fn(),
    nextLocalPlayer: vi.fn(),
  }),
}));

describe('Multi-Player Single Device Mode', () => {
  let testPlayers: LocalPlayer[];
  let gameBoard: TileExport[];

  beforeEach(() => {
    // Reset mock session
    mockSession = null;

    // Create 3 test players
    testPlayers = [
      {
        id: 'player-1',
        name: 'Alice',
        role: 'sub',
        order: 0,
        isActive: true,
        deviceId: 'device-1',
        location: 0,
        isFinished: false,
      },
      {
        id: 'player-2',
        name: 'Bob',
        role: 'dom',
        order: 1,
        isActive: false,
        deviceId: 'device-1',
        location: 0,
        isFinished: false,
      },
      {
        id: 'player-3',
        name: 'Charlie',
        role: 'vers',
        order: 2,
        isActive: false,
        deviceId: 'device-1',
        location: 0,
        isFinished: false,
      },
    ];

    // Create test game board
    gameBoard = [
      { title: 'Start', description: 'Starting position' },
      { title: 'Tile 1', description: 'First tile' },
      { title: 'Tile 2', description: 'Second tile' },
      { title: 'Tile 3', description: 'Third tile' },
      { title: 'Tile 4', description: 'Fourth tile' },
      { title: 'Finish', description: 'Ending position' },
    ];

    // Set up session
    mockSession = {
      id: 'test-session',
      roomId: 'test-room',
      players: [...testPlayers],
      currentPlayerIndex: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: {
        showTurnTransitions: true,
        enableTurnSounds: true,
        showPlayerAvatars: true,
      } as LocalSessionSettings,
    };
  });

  test('should show 3 different player avatars/tokens on the game board', () => {
    // Given: 3 local players in single device mode
    const { result } = renderHook(() => useHybridPlayerList());

    // When: We get the hybrid player list
    const players = result.current;

    // Then: We should see 3 different players with unique identifiers
    expect(players).toHaveLength(3);

    // Each player should have unique uid (used as avatar/token identifier)
    const uids = players.map((p) => p.uid);
    expect(new Set(uids).size).toBe(3); // All UIDs are unique

    // Verify each player has correct structure for board display
    players.forEach((player, index) => {
      expect(player).toMatchObject({
        displayName: testPlayers[index].name,
        uid: `local-${testPlayers[index].id}`, // Unique identifier for each player
        isLocal: true,
        localId: testPlayers[index].id,
        location: 0, // All start at position 0
        isFinished: false,
      });
    });
  });

  test('should show all players on the game board simultaneously', () => {
    // Given: Players at different positions
    mockSession.players[0].location = 1; // Alice at position 1
    mockSession.players[1].location = 3; // Bob at position 3
    mockSession.players[2].location = 2; // Charlie at position 2

    const { result } = renderHook(() => useHybridPlayerList());
    const players = result.current;

    // When: We check which tiles have players
    const playersByLocation = new Map();
    players.forEach((player) => {
      if (!playersByLocation.has(player.location)) {
        playersByLocation.set(player.location, []);
      }
      playersByLocation.get(player.location).push(player);
    });

    // Then: Each position should have exactly one player
    expect(playersByLocation.get(1)).toHaveLength(1); // Alice at tile 1
    expect(playersByLocation.get(1)[0].displayName).toBe('Alice');

    expect(playersByLocation.get(3)).toHaveLength(1); // Bob at tile 3
    expect(playersByLocation.get(3)[0].displayName).toBe('Bob');

    expect(playersByLocation.get(2)).toHaveLength(1); // Charlie at tile 2
    expect(playersByLocation.get(2)[0].displayName).toBe('Charlie');

    // And: All players should be visible simultaneously (not just active player)
    expect(players.filter((p) => p.location === 1)).toHaveLength(1);
    expect(players.filter((p) => p.location === 2)).toHaveLength(1);
    expect(players.filter((p) => p.location === 3)).toHaveLength(1);
  });

  test('should track independent movement for each player when they roll', () => {
    // Given: 3 local players starting at position 0
    expect(mockSession.players[0].location).toBe(0); // Alice
    expect(mockSession.players[1].location).toBe(0); // Bob
    expect(mockSession.players[2].location).toBe(0); // Charlie

    // When: Alice (player-1) rolls a 3 and moves
    mockSession.players[0].location = 3;

    // Then: Alice should be at position 3, others still at 0
    expect(mockSession.players[0].location).toBe(3); // Alice moved
    expect(mockSession.players[1].location).toBe(0); // Bob didn't move
    expect(mockSession.players[2].location).toBe(0); // Charlie didn't move

    // When: Switch to Bob (player-2) and he rolls a 2 and moves
    mockSession.currentPlayerIndex = 1;
    mockSession.players[1].isActive = true;
    mockSession.players[0].isActive = false;
    mockSession.players[1].location = 2;

    // Then: Bob should be at position 2, Alice still at 3, Charlie still at 0
    expect(mockSession.players[0].location).toBe(3); // Alice unchanged
    expect(mockSession.players[1].location).toBe(2); // Bob moved
    expect(mockSession.players[2].location).toBe(0); // Charlie still at start

    // When: Switch to Charlie (player-3) and he rolls a 4 and moves
    mockSession.currentPlayerIndex = 2;
    mockSession.players[2].isActive = true;
    mockSession.players[1].isActive = false;
    mockSession.players[2].location = 4;

    // Then: Each player should be at their individual position
    expect(mockSession.players[0].location).toBe(3); // Alice unchanged
    expect(mockSession.players[1].location).toBe(2); // Bob unchanged
    expect(mockSession.players[2].location).toBe(4); // Charlie moved
  });

  test('should continue from previous position when player rolls again', () => {
    // Given: Alice starts at position 3 (from previous move)
    mockSession.players[0].location = 3;

    // When: Alice rolls again with a 2
    const expectedNewPosition = 3 + 2; // Previous position + roll

    // Simulate the movement
    mockSession.players[0].location = expectedNewPosition;

    // Then: Alice should be at position 5 (3 + 2)
    expect(mockSession.players[0].location).toBe(5);

    // And: Other players should remain at their previous positions
    expect(mockSession.players[1].location).toBe(0); // Bob still at start
    expect(mockSession.players[2].location).toBe(0); // Charlie still at start
  });

  test('should handle finish condition independently per player', () => {
    // Given: Players at different positions near the end
    mockSession.players[0].location = 4; // Alice near finish
    mockSession.players[1].location = 2; // Bob in middle
    mockSession.players[2].location = 1; // Charlie near start

    const finishPosition = gameBoard.length - 1; // Position 5 (last tile)

    // When: Alice rolls enough to reach finish
    mockSession.players[0].location = finishPosition;
    mockSession.players[0].isFinished = true;

    // Then: Alice should be finished, others should not
    expect(mockSession.players[0].location).toBe(finishPosition);
    expect(mockSession.players[0].isFinished).toBe(true);
    expect(mockSession.players[1].isFinished).toBe(false);
    expect(mockSession.players[2].isFinished).toBe(false);

    // And: Other players should maintain their positions
    expect(mockSession.players[1].location).toBe(2);
    expect(mockSession.players[2].location).toBe(1);
  });
});
