/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi } from 'vitest';
import type {
  LocalPlayer,
  LocalPlayerSession,
  LocalSessionSettings,
  HybridPlayer,
  HybridLocalPlayer,
  RemotePlayer,
  User,
} from '@/types';
import { isLocalPlayer, isRemotePlayer, toHybridLocalPlayer, toRemotePlayer } from '@/types';

// Helper to create mock Firebase User for testing
function createMockUser(overrides: Partial<User> = {}): User {
  return {
    uid: 'test-uid',
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: null,
    phoneNumber: null,
    emailVerified: false,
    isAnonymous: false,
    providerId: 'firebase',
    metadata: {
      creationTime: '2024-01-01T00:00:00.000Z',
      lastSignInTime: '2024-01-01T00:00:00.000Z',
    },
    providerData: [],
    refreshToken: 'test-token',
    tenantId: null,
    delete: vi.fn().mockResolvedValue(undefined),
    getIdToken: vi.fn().mockResolvedValue('test-token'),
    getIdTokenResult: vi.fn().mockResolvedValue({
      token: 'test-token',
      authTime: 'test-time',
      issuedAtTime: 'test-time',
      expirationTime: 'test-time',
      signInProvider: 'test',
      claims: {},
      signInSecondFactor: null,
    }),
    reload: vi.fn().mockResolvedValue(undefined),
    toJSON: vi.fn().mockReturnValue({}),
    ...overrides,
  } as User;
}

describe('Local Player Types', () => {
  test('LocalPlayer interface should have correct structure', () => {
    const localPlayer: LocalPlayer = {
      id: 'player-1',
      name: 'Test Player',
      role: 'sub',
      order: 0,
      isActive: true,
      deviceId: 'device-123',
      location: 0,
      isFinished: false,
    };

    expect(localPlayer.id).toBe('player-1');
    expect(localPlayer.name).toBe('Test Player');
    expect(localPlayer.role).toBe('sub');
    expect(localPlayer.order).toBe(0);
    expect(localPlayer.isActive).toBe(true);
    expect(localPlayer.deviceId).toBe('device-123');
  });

  test('LocalPlayerSession interface should have correct structure', () => {
    const session: LocalPlayerSession = {
      id: 'session-1',
      roomId: 'TEST-ROOM',
      players: [],
      currentPlayerIndex: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: {
        showTurnTransitions: true,
        enableTurnSounds: true,
        showPlayerAvatars: true,
      },
    };

    expect(session.id).toBe('session-1');
    expect(session.roomId).toBe('TEST-ROOM');
    expect(Array.isArray(session.players)).toBe(true);
    expect(session.currentPlayerIndex).toBe(0);
    expect(session.isActive).toBe(true);
    expect(typeof session.createdAt).toBe('number');
    expect(typeof session.updatedAt).toBe('number');
    expect(session.settings.showTurnTransitions).toBe(true);
  });

  test('LocalSessionSettings interface should have correct structure', () => {
    const settings: LocalSessionSettings = {
      showTurnTransitions: true,
      enableTurnSounds: false,
      showPlayerAvatars: true,
    };

    expect(settings.showTurnTransitions).toBe(true);
    expect(settings.enableTurnSounds).toBe(false);
    expect(settings.showPlayerAvatars).toBe(true);
  });
});

describe('Hybrid Player Types', () => {
  test('isLocalPlayer type guard should work correctly', () => {
    const localPlayer: HybridLocalPlayer = {
      id: 'player-1',
      name: 'Local Player',
      role: 'sub',
      order: 0,
      isActive: true,
      deviceId: 'device-123',
      location: 0,
      isFinished: false,
      type: 'local',
    };

    const remotePlayer: RemotePlayer = {
      ...createMockUser({
        uid: 'remote-1',
        displayName: 'Remote Player',
        email: null,
        photoURL: null,
      }),
      type: 'remote',
    };

    expect(isLocalPlayer(localPlayer)).toBe(true);
    expect(isLocalPlayer(remotePlayer)).toBe(false);
  });

  test('isRemotePlayer type guard should work correctly', () => {
    const localPlayer: HybridLocalPlayer = {
      id: 'player-1',
      name: 'Local Player',
      role: 'sub',
      order: 0,
      isActive: true,
      deviceId: 'device-123',
      location: 0,
      isFinished: false,
      type: 'local',
    };

    const remotePlayer: RemotePlayer = {
      ...createMockUser({
        uid: 'remote-1',
        displayName: 'Remote Player',
        email: null,
        photoURL: null,
      }),
      type: 'remote',
    };

    expect(isRemotePlayer(remotePlayer)).toBe(true);
    expect(isRemotePlayer(localPlayer)).toBe(false);
  });

  test('toHybridLocalPlayer helper should work correctly', () => {
    const localPlayer: LocalPlayer = {
      id: 'player-1',
      name: 'Test Player',
      role: 'dom',
      order: 1,
      isActive: false,
      deviceId: 'device-456',
      location: 0,
      isFinished: false,
    };

    const hybridPlayer = toHybridLocalPlayer(localPlayer);

    expect(hybridPlayer.type).toBe('local');
    expect(hybridPlayer.id).toBe('player-1');
    expect(hybridPlayer.name).toBe('Test Player');
    expect(hybridPlayer.role).toBe('dom');
    expect(hybridPlayer.order).toBe(1);
    expect(hybridPlayer.isActive).toBe(false);
    expect(hybridPlayer.deviceId).toBe('device-456');
  });

  test('toRemotePlayer helper should work correctly', () => {
    const user = createMockUser({
      uid: 'user-123',
      displayName: 'Remote User',
      email: 'user@example.com',
      photoURL: 'https://example.com/photo.jpg',
    });

    const remotePlayer = toRemotePlayer(user);

    expect(remotePlayer.type).toBe('remote');
    expect(remotePlayer.uid).toBe('user-123');
    expect(remotePlayer.displayName).toBe('Remote User');
    expect(remotePlayer.email).toBe('user@example.com');
    expect(remotePlayer.photoURL).toBe('https://example.com/photo.jpg');
  });

  test('HybridPlayer union type should support both player types', () => {
    const localPlayer: HybridPlayer = {
      id: 'player-1',
      name: 'Local Player',
      role: 'vers',
      order: 0,
      isActive: true,
      deviceId: 'device-123',
      location: 0,
      isFinished: false,
      type: 'local',
    };

    const remotePlayer: HybridPlayer = {
      ...createMockUser({
        uid: 'remote-1',
        displayName: 'Remote Player',
        email: null,
        photoURL: null,
      }),
      type: 'remote',
    };

    // Type narrowing should work with type guards
    if (isLocalPlayer(localPlayer)) {
      expect(localPlayer.name).toBe('Local Player');
      expect(localPlayer.role).toBe('vers');
    }

    if (isRemotePlayer(remotePlayer)) {
      expect(remotePlayer.uid).toBe('remote-1');
      expect(remotePlayer.displayName).toBe('Remote Player');
    }
  });
});
