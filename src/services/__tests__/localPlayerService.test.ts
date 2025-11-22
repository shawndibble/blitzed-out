/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalPlayerService, localPlayerService } from '../localPlayerService';
import type { LocalPlayer, LocalSessionSettings } from '@/types';
import db from '@/stores/store';

describe('LocalPlayerService', () => {
  let service: LocalPlayerService;
  let mockPlayers: LocalPlayer[];
  let mockSettings: LocalSessionSettings;

  beforeEach(async () => {
    service = LocalPlayerService.getInstance();
    service.clearCurrentSession();

    // Clear the database before each test
    await db.localPlayerSessions.clear();
    await db.localPlayerMoves.clear();
    await db.localPlayerStats.clear();

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

  afterEach(async () => {
    service.clearCurrentSession();
    // Clear the database after each test
    await db.localPlayerSessions.clear();
    await db.localPlayerMoves.clear();
    await db.localPlayerStats.clear();
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

      // Verify it was saved to the database
      const savedSession = await db.localPlayerSessions
        .where('sessionId')
        .equals(session.id)
        .first();
      expect(savedSession).toBeDefined();
      expect(savedSession?.roomId).toBe('TEST-ROOM');
      expect(savedSession?.players).toEqual(mockPlayers);
      expect(savedSession?.isActive).toBe(true);
    });

    test('should set session as current session', async () => {
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
      const session = await service.getSession('non-existent');
      expect(session).toBeNull();
    });

    test('should retrieve existing session', async () => {
      // Create a session first
      const createdSession = await service.createSession('TEST-ROOM', mockPlayers, mockSettings);

      // Now retrieve it
      const session = await service.getSession(createdSession.id);

      expect(session).toBeDefined();
      expect(session?.id).toBe(createdSession.id);
      expect(session?.roomId).toBe('TEST-ROOM');
      expect(session?.players).toEqual(mockPlayers);
    });

    test('should validate session ID', async () => {
      await expect(service.getSession('')).rejects.toThrow('Session ID is required');
    });
  });

  describe('Turn Advancement', () => {
    test('should advance to next player', async () => {
      // Create a real session
      const session = await service.createSession('TEST-ROOM', mockPlayers, mockSettings);

      const nextPlayer = await service.advanceLocalTurn(session.id);

      expect(nextPlayer).toBeDefined();
      expect(nextPlayer.name).toBe('Player Two'); // Should be second player

      // Verify the database was updated
      const updatedSession = await db.localPlayerSessions
        .where('sessionId')
        .equals(session.id)
        .first();
      expect(updatedSession?.currentPlayerIndex).toBe(1);
    });

    test('should wrap around to first player', async () => {
      // Create a session
      const session = await service.createSession('TEST-ROOM', mockPlayers, mockSettings);

      // Advance to second player
      await service.advanceLocalTurn(session.id);

      // Advance again - should wrap to first player
      const nextPlayer = await service.advanceLocalTurn(session.id);

      expect(nextPlayer.name).toBe('Player One'); // Should wrap to first player

      // Verify the database was updated
      const updatedSession = await db.localPlayerSessions
        .where('sessionId')
        .equals(session.id)
        .first();
      expect(updatedSession?.currentPlayerIndex).toBe(0);
    });

    test('should reject inactive session', async () => {
      // Create a session
      const session = await service.createSession('TEST-ROOM', mockPlayers, mockSettings);

      // Mark it as inactive in the database
      await db.localPlayerSessions
        .where('sessionId')
        .equals(session.id)
        .modify({ isActive: false });

      await expect(service.advanceLocalTurn(session.id)).rejects.toThrow(
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
