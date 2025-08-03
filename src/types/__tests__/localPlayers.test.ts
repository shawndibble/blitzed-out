import { describe, it, expect } from 'vitest';
import type { LocalPlayer, LocalPlayerSession, LocalSessionSettings } from '../localPlayers';
import type { PlayerRole } from '../Settings';

describe('LocalPlayer Types', () => {
  describe('LocalPlayer Interface', () => {
    it('should accept valid LocalPlayer object with sound field', () => {
      const validLocalPlayer: LocalPlayer = {
        id: 'player1',
        name: 'Test Player',
        role: 'dom',
        order: 0,
        isActive: true,
        deviceId: 'current_device',
        location: 5,
        isFinished: false,
        sound: 'bell',
      };

      expect(validLocalPlayer.id).toBe('player1');
      expect(validLocalPlayer.name).toBe('Test Player');
      expect(validLocalPlayer.role).toBe('dom');
      expect(validLocalPlayer.order).toBe(0);
      expect(validLocalPlayer.isActive).toBe(true);
      expect(validLocalPlayer.deviceId).toBe('current_device');
      expect(validLocalPlayer.location).toBe(5);
      expect(validLocalPlayer.isFinished).toBe(false);
      expect(validLocalPlayer.sound).toBe('bell');
    });

    it('should accept LocalPlayer object without sound field (optional)', () => {
      const validLocalPlayer: LocalPlayer = {
        id: 'player1',
        name: 'Test Player',
        role: 'dom',
        order: 0,
        isActive: true,
        deviceId: 'current_device',
        location: 5,
        isFinished: false,
      };

      expect(validLocalPlayer.id).toBe('player1');
      expect(validLocalPlayer.name).toBe('Test Player');
      expect(validLocalPlayer.role).toBe('dom');
      expect(validLocalPlayer.order).toBe(0);
      expect(validLocalPlayer.isActive).toBe(true);
      expect(validLocalPlayer.deviceId).toBe('current_device');
      expect(validLocalPlayer.location).toBe(5);
      expect(validLocalPlayer.isFinished).toBe(false);
      expect(validLocalPlayer.sound).toBeUndefined();
    });

    it('should support all valid sound values', () => {
      const bellPlayer: LocalPlayer = {
        id: 'player1',
        name: 'Bell Player',
        role: 'dom',
        order: 0,
        isActive: false,
        deviceId: 'device1',
        location: 0,
        isFinished: false,
        sound: 'bell',
      };

      const chimePlayer: LocalPlayer = {
        id: 'player2',
        name: 'Chime Player',
        role: 'sub',
        order: 1,
        isActive: false,
        deviceId: 'device2',
        location: 0,
        isFinished: false,
        sound: 'chime',
      };

      const notificationPlayer: LocalPlayer = {
        id: 'player3',
        name: 'Notification Player',
        role: 'vers',
        order: 2,
        isActive: false,
        deviceId: 'device3',
        location: 0,
        isFinished: false,
        sound: 'notification',
      };

      const noSoundPlayer: LocalPlayer = {
        id: 'player4',
        name: 'No Sound Player',
        role: 'dom',
        order: 3,
        isActive: false,
        deviceId: 'device4',
        location: 0,
        isFinished: false,
        sound: '',
      };

      const undefinedSoundPlayer: LocalPlayer = {
        id: 'player5',
        name: 'Undefined Sound Player',
        role: 'sub',
        order: 4,
        isActive: false,
        deviceId: 'device5',
        location: 0,
        isFinished: false,
      };

      expect(bellPlayer.sound).toBe('bell');
      expect(chimePlayer.sound).toBe('chime');
      expect(notificationPlayer.sound).toBe('notification');
      expect(noSoundPlayer.sound).toBe('');
      expect(undefinedSoundPlayer.sound).toBeUndefined();
    });

    it('should support all valid PlayerRole values', () => {
      const domPlayer: LocalPlayer = {
        id: 'player1',
        name: 'Dom Player',
        role: 'dom',
        order: 0,
        isActive: false,
        deviceId: 'device1',
        location: 0,
        isFinished: false,
        sound: 'bell',
      };

      const subPlayer: LocalPlayer = {
        id: 'player2',
        name: 'Sub Player',
        role: 'sub',
        order: 1,
        isActive: false,
        deviceId: 'device2',
        location: 0,
        isFinished: false,
        sound: 'chime',
      };

      const versPlayer: LocalPlayer = {
        id: 'player3',
        name: 'Vers Player',
        role: 'vers',
        order: 2,
        isActive: false,
        deviceId: 'device3',
        location: 0,
        isFinished: false,
        sound: 'notification',
      };

      expect(domPlayer.role).toBe('dom');
      expect(subPlayer.role).toBe('sub');
      expect(versPlayer.role).toBe('vers');
      expect(domPlayer.sound).toBe('bell');
      expect(subPlayer.sound).toBe('chime');
      expect(versPlayer.sound).toBe('notification');
    });

    it('should handle edge case values correctly', () => {
      const edgeCasePlayer: LocalPlayer = {
        id: '',
        name: '',
        role: 'vers',
        order: -1,
        isActive: false,
        deviceId: '',
        location: -1,
        isFinished: true,
        sound: '',
      };

      expect(edgeCasePlayer.id).toBe('');
      expect(edgeCasePlayer.name).toBe('');
      expect(edgeCasePlayer.order).toBe(-1);
      expect(edgeCasePlayer.location).toBe(-1);
      expect(edgeCasePlayer.isFinished).toBe(true);
      expect(edgeCasePlayer.sound).toBe('');
    });

    it('should support default sound assignment for new players', () => {
      const newPlayerWithDefaultSound: LocalPlayer = {
        id: 'new_player',
        name: 'New Player',
        role: 'dom',
        order: 0,
        isActive: true,
        deviceId: 'device_1',
        location: 0,
        isFinished: false,
        sound: 'bell', // Default sound
      };

      const newPlayerWithoutSound: LocalPlayer = {
        id: 'new_player_2',
        name: 'New Player 2',
        role: 'sub',
        order: 1,
        isActive: false,
        deviceId: 'device_1',
        location: 0,
        isFinished: false,
        // sound field is optional
      };

      expect(newPlayerWithDefaultSound.sound).toBe('bell');
      expect(newPlayerWithoutSound.sound).toBeUndefined();
    });

    it('should handle invalid sound values gracefully', () => {
      const playerWithInvalidSound: LocalPlayer = {
        id: 'invalid_sound_player',
        name: 'Invalid Sound Player',
        role: 'vers',
        order: 0,
        isActive: false,
        deviceId: 'device_1',
        location: 0,
        isFinished: false,
        sound: 'invalid-sound-id',
      };

      // Should accept any string value (validation happens in implementation)
      expect(playerWithInvalidSound.sound).toBe('invalid-sound-id');
      expect(typeof playerWithInvalidSound.sound).toBe('string');
    });

    it('should support very long string values', () => {
      const longStringPlayer: LocalPlayer = {
        id: 'x'.repeat(1000),
        name: 'A very long player name that might exceed normal expectations'.repeat(10),
        role: 'dom',
        order: 999999,
        isActive: true,
        deviceId: 'device_'.repeat(100),
        location: 999999,
        isFinished: false,
        sound: 'very-long-sound-id-'.repeat(50),
      };

      expect(longStringPlayer.id.length).toBe(1000);
      expect(longStringPlayer.name.length).toBeGreaterThan(100);
      expect(longStringPlayer.order).toBe(999999);
      expect(longStringPlayer.location).toBe(999999);
      expect(longStringPlayer.sound?.length).toBeGreaterThan(100);
    });

    it('should support special characters in string fields', () => {
      const specialCharPlayer: LocalPlayer = {
        id: 'player-123_test@domain.com',
        name: 'Player 🎮 with émojis & spëcial chars!',
        role: 'sub',
        order: 0,
        isActive: false,
        deviceId: 'device-123_special',
        location: 0,
        isFinished: false,
        sound: 'sound-with-special-chars_123',
      };

      expect(specialCharPlayer.id).toContain('@');
      expect(specialCharPlayer.name).toContain('🎮');
      expect(specialCharPlayer.name).toContain('ë');
      expect(specialCharPlayer.deviceId).toContain('_');
      expect(specialCharPlayer.sound).toContain('_');
      expect(specialCharPlayer.sound).toContain('-');
    });
  });

  describe('LocalPlayerSession Interface', () => {
    it('should accept valid LocalPlayerSession object', () => {
      const mockPlayers: LocalPlayer[] = [
        {
          id: 'player1',
          name: 'Player One',
          role: 'dom',
          order: 0,
          isActive: true,
          deviceId: 'device1',
          location: 0,
          isFinished: false,
          sound: 'bell',
        },
        {
          id: 'player2',
          name: 'Player Two',
          role: 'sub',
          order: 1,
          isActive: false,
          deviceId: 'device2',
          location: 0,
          isFinished: false,
          sound: 'chime',
        },
      ];

      const mockSettings: LocalSessionSettings = {
        showTurnTransitions: true,

        enableTurnSounds: true,
        showPlayerAvatars: true,
      };

      const validSession: LocalPlayerSession = {
        id: 'session123',
        roomId: 'PRIVATE_ROOM',
        players: mockPlayers,
        currentPlayerIndex: 0,
        isActive: true,
        createdAt: 1234567890000,
        updatedAt: 1234567890001,
        settings: mockSettings,
      };

      expect(validSession.id).toBe('session123');
      expect(validSession.roomId).toBe('PRIVATE_ROOM');
      expect(validSession.players).toHaveLength(2);
      expect(validSession.currentPlayerIndex).toBe(0);
      expect(validSession.isActive).toBe(true);
      expect(validSession.createdAt).toBe(1234567890000);
      expect(validSession.updatedAt).toBe(1234567890001);
      expect(validSession.settings).toBeDefined();
    });

    it('should handle empty players array', () => {
      const emptyPlayersSession: LocalPlayerSession = {
        id: 'empty_session',
        roomId: 'PUBLIC',
        players: [],
        currentPlayerIndex: -1,
        isActive: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: {
          showTurnTransitions: false,

          enableTurnSounds: false,
          showPlayerAvatars: false,
        },
      };

      expect(emptyPlayersSession.players).toHaveLength(0);
      expect(emptyPlayersSession.currentPlayerIndex).toBe(-1);
      expect(emptyPlayersSession.isActive).toBe(false);
    });

    it('should handle large number of players', () => {
      const manyPlayers: LocalPlayer[] = Array.from({ length: 100 }, (_, index) => ({
        id: `player_${index}`,
        name: `Player ${index}`,
        role: (['dom', 'sub', 'vers'] as const)[index % 3],
        order: index,
        isActive: index === 0,
        deviceId: `device_${index}`,
        location: index * 2,
        isFinished: index > 90,
      }));

      const largeSession: LocalPlayerSession = {
        id: 'large_session',
        roomId: 'LARGE_ROOM',
        players: manyPlayers,
        currentPlayerIndex: 50,
        isActive: true,
        createdAt: Date.now() - 1000000,
        updatedAt: Date.now(),
        settings: {
          showTurnTransitions: true,

          enableTurnSounds: true,
          showPlayerAvatars: true,
        },
      };

      expect(largeSession.players).toHaveLength(100);
      expect(largeSession.currentPlayerIndex).toBe(50);
      expect(largeSession.players[99].isFinished).toBe(true);
      expect(largeSession.players[89].isFinished).toBe(false);
    });

    it('should handle extreme timestamp values', () => {
      const extremeTimestamps: LocalPlayerSession = {
        id: 'timestamp_test',
        roomId: 'TIME_ROOM',
        players: [],
        currentPlayerIndex: 0,
        isActive: true,
        createdAt: 0, // Unix epoch start
        updatedAt: Number.MAX_SAFE_INTEGER, // Maximum safe integer
        settings: {
          showTurnTransitions: true,

          enableTurnSounds: false,
          showPlayerAvatars: true,
        },
      };

      expect(extremeTimestamps.createdAt).toBe(0);
      expect(extremeTimestamps.updatedAt).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe('LocalSessionSettings Interface', () => {
    it('should accept valid LocalSessionSettings object', () => {
      const validSettings: LocalSessionSettings = {
        showTurnTransitions: true,

        enableTurnSounds: false,
        showPlayerAvatars: true,
      };

      expect(validSettings.showTurnTransitions).toBe(true);
      expect(validSettings.enableTurnSounds).toBe(false);
      expect(validSettings.showPlayerAvatars).toBe(true);
    });

    it('should handle all boolean combinations', () => {
      const allTrueSettings: LocalSessionSettings = {
        showTurnTransitions: true,

        enableTurnSounds: true,
        showPlayerAvatars: true,
      };

      const allFalseSettings: LocalSessionSettings = {
        showTurnTransitions: false,

        enableTurnSounds: false,
        showPlayerAvatars: false,
      };

      const mixedSettings: LocalSessionSettings = {
        showTurnTransitions: true,

        enableTurnSounds: false,
        showPlayerAvatars: true,
      };

      expect(allTrueSettings.showTurnTransitions).toBe(true);
      expect(allTrueSettings.enableTurnSounds).toBe(true);
      expect(allTrueSettings.showPlayerAvatars).toBe(true);

      expect(allFalseSettings.showTurnTransitions).toBe(false);
      expect(allFalseSettings.enableTurnSounds).toBe(false);
      expect(allFalseSettings.showPlayerAvatars).toBe(false);

      expect(mixedSettings.showTurnTransitions).toBe(true);
      expect(mixedSettings.enableTurnSounds).toBe(false);
    });

    it('should handle edge case settings values', () => {
      const allEnabledSettings: LocalSessionSettings = {
        showTurnTransitions: true,
        enableTurnSounds: true,
        showPlayerAvatars: true,
      };

      const allDisabledSettings: LocalSessionSettings = {
        showTurnTransitions: false,
        enableTurnSounds: false,
        showPlayerAvatars: false,
      };

      expect(allEnabledSettings.showTurnTransitions).toBe(true);
      expect(allDisabledSettings.enableTurnSounds).toBe(false);
    });

    it('should handle boolean setting values', () => {
      const booleanValues = [true, false];

      booleanValues.forEach((value) => {
        const settings: LocalSessionSettings = {
          showTurnTransitions: value,
          enableTurnSounds: value,
          showPlayerAvatars: value,
        };

        expect(settings.showTurnTransitions).toBe(value);
        expect(settings.enableTurnSounds).toBe(value);
        expect(settings.showPlayerAvatars).toBe(value);
      });
    });
  });

  describe('Type Relationships', () => {
    it('should have LocalPlayer compatible with LocalPlayerSession.players', () => {
      const player: LocalPlayer = {
        id: 'test_player',
        name: 'Test Player',
        role: 'dom',
        order: 0,
        isActive: true,
        deviceId: 'test_device',
        location: 0,
        isFinished: false,
      };

      const session: LocalPlayerSession = {
        id: 'test_session',
        roomId: 'TEST_ROOM',
        players: [player], // Should accept LocalPlayer array
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

      expect(session.players[0]).toEqual(player);
    });

    it('should have LocalSessionSettings compatible with LocalPlayerSession.settings', () => {
      const settings: LocalSessionSettings = {
        showTurnTransitions: false,

        enableTurnSounds: true,
        showPlayerAvatars: false,
      };

      const session: LocalPlayerSession = {
        id: 'settings_test',
        roomId: 'SETTINGS_ROOM',
        players: [],
        currentPlayerIndex: 0,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: settings, // Should accept LocalSessionSettings
      };

      expect(session.settings).toEqual(settings);
    });

    it('should support PlayerRole from Settings types', () => {
      const roles: PlayerRole[] = ['dom', 'sub', 'vers'];

      roles.forEach((role, index) => {
        const player: LocalPlayer = {
          id: `player_${index}`,
          name: `Player ${index}`,
          role: role, // Should accept PlayerRole values
          order: index,
          isActive: false,
          deviceId: 'test_device',
          location: 0,
          isFinished: false,
        };

        expect(player.role).toBe(role);
      });
    });
  });

  describe('Type Safety Validation', () => {
    it('should ensure all required fields are present in LocalPlayer', () => {
      // This test validates that TypeScript enforces all required fields
      // Note: 'sound' is optional and not included in required fields
      const requiredFields = [
        'id',
        'name',
        'role',
        'order',
        'isActive',
        'deviceId',
        'location',
        'isFinished',
      ];

      const testPlayer: LocalPlayer = {
        id: 'test',
        name: 'test',
        role: 'dom',
        order: 0,
        isActive: false,
        deviceId: 'test',
        location: 0,
        isFinished: false,
      };

      requiredFields.forEach((field) => {
        expect(testPlayer).toHaveProperty(field);
      });

      // Verify sound field can be optional
      expect(testPlayer.sound).toBeUndefined();
    });

    it('should ensure sound field is properly typed when present', () => {
      const playerWithSound: LocalPlayer = {
        id: 'test',
        name: 'test',
        role: 'dom',
        order: 0,
        isActive: false,
        deviceId: 'test',
        location: 0,
        isFinished: false,
        sound: 'bell',
      };

      expect(playerWithSound).toHaveProperty('sound');
      expect(typeof playerWithSound.sound).toBe('string');
      expect(playerWithSound.sound).toBe('bell');
    });

    it('should ensure all required fields are present in LocalPlayerSession', () => {
      const requiredFields = [
        'id',
        'roomId',
        'players',
        'currentPlayerIndex',
        'isActive',
        'createdAt',
        'updatedAt',
        'settings',
      ];

      const testSession: LocalPlayerSession = {
        id: 'test',
        roomId: 'test',
        players: [],
        currentPlayerIndex: 0,
        isActive: false,
        createdAt: 0,
        updatedAt: 0,
        settings: {
          showTurnTransitions: false,

          enableTurnSounds: false,
          showPlayerAvatars: false,
        },
      };

      requiredFields.forEach((field) => {
        expect(testSession).toHaveProperty(field);
      });
    });

    it('should ensure all required fields are present in LocalSessionSettings', () => {
      const requiredFields = ['showTurnTransitions', 'enableTurnSounds', 'showPlayerAvatars'];

      const testSettings: LocalSessionSettings = {
        showTurnTransitions: false,

        enableTurnSounds: false,
        showPlayerAvatars: false,
      };

      requiredFields.forEach((field) => {
        expect(testSettings).toHaveProperty(field);
      });
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should support typical game session with multiple players and sound settings', () => {
      const gameSession: LocalPlayerSession = {
        id: 'game_session_1',
        roomId: 'FRIENDS_ROOM',
        players: [
          {
            id: 'alice',
            name: 'Alice',
            role: 'dom',
            order: 0,
            isActive: true,
            deviceId: 'phone_1',
            location: 3,
            isFinished: false,
            sound: 'bell',
          },
          {
            id: 'bob',
            name: 'Bob',
            role: 'sub',
            order: 1,
            isActive: false,
            deviceId: 'phone_1',
            location: 1,
            isFinished: false,
            sound: 'chime',
          },
          {
            id: 'charlie',
            name: 'Charlie',
            role: 'vers',
            order: 2,
            isActive: false,
            deviceId: 'phone_1',
            location: 0,
            isFinished: false,
            sound: 'notification',
          },
        ],
        currentPlayerIndex: 0,
        isActive: true,
        createdAt: Date.now() - 300000, // 5 minutes ago
        updatedAt: Date.now(),
        settings: {
          showTurnTransitions: true,

          enableTurnSounds: true,
          showPlayerAvatars: true,
        },
      };

      expect(gameSession.players).toHaveLength(3);
      expect(gameSession.players.find((p) => p.isActive)?.name).toBe('Alice');
      expect(gameSession.players.find((p) => p.isActive)?.sound).toBe('bell');
      expect(gameSession.settings.showTurnTransitions).toBe(true);
      expect(gameSession.settings.enableTurnSounds).toBe(true);

      // Verify all players have different sounds
      const sounds = gameSession.players.map((p) => p.sound);
      expect(sounds).toContain('bell');
      expect(sounds).toContain('chime');
      expect(sounds).toContain('notification');
    });

    it('should support mixed sound settings in a session', () => {
      const mixedSoundSession: LocalPlayerSession = {
        id: 'mixed_sound_session',
        roomId: 'MIXED_ROOM',
        players: [
          {
            id: 'player_with_sound',
            name: 'Player With Sound',
            role: 'dom',
            order: 0,
            isActive: true,
            deviceId: 'device_1',
            location: 0,
            isFinished: false,
            sound: 'bell',
          },
          {
            id: 'player_no_sound',
            name: 'Player No Sound',
            role: 'sub',
            order: 1,
            isActive: false,
            deviceId: 'device_1',
            location: 0,
            isFinished: false,
            sound: '',
          },
          {
            id: 'player_undefined_sound',
            name: 'Player Undefined Sound',
            role: 'vers',
            order: 2,
            isActive: false,
            deviceId: 'device_1',
            location: 0,
            isFinished: false,
            // No sound field
          },
        ],
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

      expect(mixedSoundSession.players[0].sound).toBe('bell');
      expect(mixedSoundSession.players[1].sound).toBe('');
      expect(mixedSoundSession.players[2].sound).toBeUndefined();
    });

    it('should support finished game scenario', () => {
      const finishedPlayer: LocalPlayer = {
        id: 'winner',
        name: 'Winner Player',
        role: 'dom',
        order: 0,
        isActive: false,
        deviceId: 'main_device',
        location: 20, // At the end
        isFinished: true,
        sound: 'bell',
      };

      expect(finishedPlayer.isFinished).toBe(true);
      expect(finishedPlayer.isActive).toBe(false);
      expect(finishedPlayer.location).toBeGreaterThan(15);
      expect(finishedPlayer.sound).toBe('bell');
    });

    it('should support mid-game state transitions', () => {
      const currentPlayer: LocalPlayer = {
        id: 'current',
        name: 'Current Player',
        role: 'sub',
        order: 1,
        isActive: true,
        deviceId: 'shared_device',
        location: 7,
        isFinished: false,
        sound: 'chime',
      };

      const nextPlayer: LocalPlayer = {
        id: 'next',
        name: 'Next Player',
        role: 'vers',
        order: 2,
        isActive: false,
        deviceId: 'shared_device',
        location: 4,
        isFinished: false,
        sound: 'notification',
      };

      // Simulate turn transition
      const afterTurn = {
        current: { ...currentPlayer, isActive: false },
        next: { ...nextPlayer, isActive: true },
      };

      expect(afterTurn.current.isActive).toBe(false);
      expect(afterTurn.next.isActive).toBe(true);
      expect(afterTurn.current.sound).toBe('chime');
      expect(afterTurn.next.sound).toBe('notification');
    });
  });
});
