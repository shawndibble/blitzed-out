/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalPlayerService, localPlayerService } from '../localPlayerService';
import type { LocalPlayer, LocalSessionSettings } from '@/types';
import db from '@/stores/store';

// Mock the database
vi.mock('@/stores/store', () => ({
  default: {
    localPlayerSessions: {
      add: vi.fn(),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          first: vi.fn(),
          modify: vi.fn(),
        })),
      })),
    },
  },
}));

describe('LocalPlayerService', () => {
  let service: LocalPlayerService;
  let mockPlayers: LocalPlayer[];
  let mockSettings: LocalSessionSettings;

  beforeEach(() => {
    service = LocalPlayerService.getInstance();
    service.clearCurrentSession();

    mockPlayers = [
      {
        id: 'player-1',
        name: 'Player One',
        role: 'sub',
        order: 0,
        isActive: true,
        deviceId: 'device-123',
        location: 0,
        isFinished: false,
      },
      {
        id: 'player-2',
        name: 'Player Two',
        role: 'dom',
        order: 1,
        isActive: false,
        deviceId: 'device-123',
        location: 0,
        isFinished: false,
      },
    ];

    mockSettings = {
      showTurnTransitions: true,
      enableTurnSounds: true,
      showPlayerAvatars: true,
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    service.clearCurrentSession();
  });

  describe('Singleton Pattern', () => {
    test('should return the same instance', () => {
      const instance1 = LocalPlayerService.getInstance();
      const instance2 = LocalPlayerService.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('should return the same instance as the exported service', () => {
      const instance = LocalPlayerService.getInstance();
      expect(instance).toBe(localPlayerService);
    });
  });

  describe('Session Creation', () => {
    test('should create a valid session with correct data', async () => {
      const mockAdd = vi.mocked(db.localPlayerSessions.add);
      mockAdd.mockResolvedValue(1);

      const session = await service.createSession('TEST-ROOM', mockPlayers, mockSettings);

      expect(session).toBeDefined();
      expect(session.roomId).toBe('TEST-ROOM');
      expect(session.players).toHaveLength(2);
      expect(session.players[0].name).toBe('Player One');
      expect(session.players[1].name).toBe('Player Two');
      expect(session.currentPlayerIndex).toBe(0);
      expect(session.isActive).toBe(true);
      expect(session.settings).toEqual(mockSettings);
      expect(typeof session.id).toBe('string');
      expect(typeof session.createdAt).toBe('number');
      expect(typeof session.updatedAt).toBe('number');

      // Should call database add
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: session.id,
          roomId: 'TEST-ROOM',
          players: mockPlayers,
          isActive: true,
        })
      );
    });

    test('should set session as current session', async () => {
      const mockAdd = vi.mocked(db.localPlayerSessions.add);
      mockAdd.mockResolvedValue(1);

      const session = await service.createSession('TEST-ROOM', mockPlayers, mockSettings);
      const currentSession = service.getCurrentSession();

      expect(currentSession).toBe(session);
    });

    test('should validate room ID', async () => {
      await expect(service.createSession('', mockPlayers, mockSettings)).rejects.toThrow(
        'Valid room ID is required'
      );

      await expect(service.createSession(null as any, mockPlayers, mockSettings)).rejects.toThrow(
        'Valid room ID is required'
      );
    });

    test('should validate player count', async () => {
      // Too few players
      await expect(
        service.createSession('TEST-ROOM', [mockPlayers[0]], mockSettings)
      ).rejects.toThrow('Session must have between 2 and 4 players');

      // Too many players
      const tooManyPlayers = [...mockPlayers, ...mockPlayers, mockPlayers[0]];
      await expect(
        service.createSession('TEST-ROOM', tooManyPlayers, mockSettings)
      ).rejects.toThrow('Session must have between 2 and 4 players');
    });

    test('should validate player data', async () => {
      const invalidPlayers = [
        { ...mockPlayers[0], id: '' }, // Invalid ID
        mockPlayers[1],
      ];

      await expect(
        service.createSession('TEST-ROOM', invalidPlayers, mockSettings)
      ).rejects.toThrow('Player at index 0 must have a valid ID');
    });

    test('should validate unique player IDs', async () => {
      const duplicateIdPlayers = [
        mockPlayers[0],
        { ...mockPlayers[1], id: mockPlayers[0].id }, // Duplicate ID
      ];

      await expect(
        service.createSession('TEST-ROOM', duplicateIdPlayers, mockSettings)
      ).rejects.toThrow('All players must have unique IDs');
    });

    test('should validate unique player names', async () => {
      const duplicateNamePlayers = [
        mockPlayers[0],
        { ...mockPlayers[1], name: mockPlayers[0].name }, // Duplicate name
      ];

      await expect(
        service.createSession('TEST-ROOM', duplicateNamePlayers, mockSettings)
      ).rejects.toThrow('All players must have unique names');
    });
  });

  describe('Session Retrieval', () => {
    test('should return null for non-existent session', async () => {
      const mockFirst = vi.fn().mockResolvedValue(null);
      const mockEquals = vi.fn().mockReturnValue({ first: mockFirst });
      const mockWhere = vi.mocked(db.localPlayerSessions.where);
      mockWhere.mockReturnValue({ equals: mockEquals } as any);

      const session = await service.getSession('non-existent');
      expect(session).toBeNull();
      expect(mockWhere).toHaveBeenCalledWith('sessionId');
      expect(mockEquals).toHaveBeenCalledWith('non-existent');
    });

    test('should retrieve existing session', async () => {
      const mockDbSession = {
        id: 1,
        sessionId: 'test-session',
        roomId: 'TEST-ROOM',
        players: mockPlayers,
        currentPlayerIndex: 0,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: mockSettings,
      };

      const mockFirst = vi.fn().mockResolvedValue(mockDbSession);
      const mockEquals = vi.fn().mockReturnValue({ first: mockFirst });
      const mockWhere = vi.mocked(db.localPlayerSessions.where);
      mockWhere.mockReturnValue({ equals: mockEquals } as any);

      const session = await service.getSession('test-session');

      expect(session).toBeDefined();
      expect(session?.id).toBe('test-session');
      expect(session?.roomId).toBe('TEST-ROOM');
      expect(session?.players).toEqual(mockPlayers);
    });

    test('should validate session ID', async () => {
      await expect(service.getSession('')).rejects.toThrow('Session ID is required');
    });
  });

  describe('Turn Advancement', () => {
    test('should advance to next player', async () => {
      // Setup existing session
      const mockDbSession = {
        id: 1,
        sessionId: 'test-session',
        roomId: 'TEST-ROOM',
        players: mockPlayers,
        currentPlayerIndex: 0,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: mockSettings,
      };

      const mockFirst = vi.fn().mockResolvedValue(mockDbSession);
      const mockEquals = vi.fn().mockReturnValue({ first: mockFirst });
      const mockModify = vi.fn().mockResolvedValue(1);
      const mockWhere = vi.mocked(db.localPlayerSessions.where);

      // Mock both retrieval calls
      mockWhere.mockReturnValue({ equals: mockEquals } as any);
      mockEquals.mockReturnValue({
        first: mockFirst,
        modify: mockModify,
      } as any);

      const nextPlayer = await service.advanceLocalTurn('test-session');

      expect(nextPlayer).toBeDefined();
      expect(nextPlayer.name).toBe('Player Two'); // Should be second player
      expect(mockModify).toHaveBeenCalled();
    });

    test('should wrap around to first player', async () => {
      // Setup session with second player active
      const mockDbSession = {
        id: 1,
        sessionId: 'test-session',
        roomId: 'TEST-ROOM',
        players: mockPlayers,
        currentPlayerIndex: 1, // Second player is current
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: mockSettings,
      };

      const mockFirst = vi.fn().mockResolvedValue(mockDbSession);
      const mockEquals = vi.fn().mockReturnValue({ first: mockFirst });
      const mockModify = vi.fn().mockResolvedValue(1);
      const mockWhere = vi.mocked(db.localPlayerSessions.where);

      mockWhere.mockReturnValue({ equals: mockEquals } as any);
      mockEquals.mockReturnValue({
        first: mockFirst,
        modify: mockModify,
      } as any);

      const nextPlayer = await service.advanceLocalTurn('test-session');

      expect(nextPlayer.name).toBe('Player One'); // Should wrap to first player
    });

    test('should reject inactive session', async () => {
      const mockDbSession = {
        id: 1,
        sessionId: 'test-session',
        roomId: 'TEST-ROOM',
        players: mockPlayers,
        currentPlayerIndex: 0,
        isActive: false, // Inactive session
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: mockSettings,
      };

      const mockFirst = vi.fn().mockResolvedValue(mockDbSession);
      const mockEquals = vi.fn().mockReturnValue({ first: mockFirst });
      const mockWhere = vi.mocked(db.localPlayerSessions.where);
      mockWhere.mockReturnValue({ equals: mockEquals } as any);

      await expect(service.advanceLocalTurn('test-session')).rejects.toThrow(
        'Cannot advance turn on inactive session'
      );
    });
  });

  describe('Current Session Management', () => {
    test('should return null when no current session', () => {
      const currentSession = service.getCurrentSession();
      expect(currentSession).toBeNull();
    });

    test('should clear current session', () => {
      // Set a mock current session
      service['currentSession'] = {
        id: 'test',
        roomId: 'TEST-ROOM',
        players: mockPlayers,
        currentPlayerIndex: 0,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: mockSettings,
      };

      service.clearCurrentSession();
      const currentSession = service.getCurrentSession();
      expect(currentSession).toBeNull();
    });
  });
});
