import { describe, it, expect, beforeEach } from 'vitest';
import actionStringReplacement from '../actionStringReplacement';
import type { LocalPlayer } from '@/types/localPlayers';

// Use the global i18next mock from setupTests.ts which has anatomy data

describe('actionStringReplacement', () => {
  describe('generic placeholders mode', () => {
    it('replaces role placeholders with generic terms', () => {
      const result = actionStringReplacement(
        '{player} kisses {dom}.',
        'sub',
        'TestPlayer',
        undefined,
        true
      );

      expect(result).toBe('The current player kisses a dominant.');
    });

    it('replaces anatomy placeholders with neutral terms', () => {
      const result = actionStringReplacement(
        'Touch your {genital}.',
        'sub',
        'TestPlayer',
        undefined,
        true
      );

      expect(result).toBe('Touch your genitals.');
    });

    it('replaces all anatomy placeholders generically', () => {
      const result = actionStringReplacement(
        '{pronoun_subject} touches {pronoun_possessive} {genital} and {chest}.',
        'sub',
        'TestPlayer',
        undefined,
        true
      );

      expect(result).toBe('They touches their genitals and chest.');
    });
  });

  describe('local multiplayer mode', () => {
    let localPlayers: LocalPlayer[];

    beforeEach(() => {
      localPlayers = [
        {
          id: '1',
          name: 'Mike',
          gender: 'male',
          role: 'dom',
          order: 0,
          isActive: true,
          deviceId: 'device1',
          location: 0,
          isFinished: false,
        },
        {
          id: '2',
          name: 'Jessica',
          gender: 'female',
          role: 'sub',
          order: 1,
          isActive: false,
          deviceId: 'device1',
          location: 0,
          isFinished: false,
        },
      ];
    });

    it('replaces role placeholders with player names', () => {
      const result = actionStringReplacement(
        '{dom} kisses {sub}.',
        'dom',
        'Mike',
        localPlayers,
        false
      );

      expect(result).toBe('Mike kisses Jessica.');
    });

    it('replaces anatomy placeholders for male player', () => {
      const result = actionStringReplacement(
        'Touch your {genital}.',
        'dom',
        'Mike',
        localPlayers,
        false
      );

      expect(result).toBe('Touch your dick.');
    });

    it('replaces anatomy placeholders for female player', () => {
      const result = actionStringReplacement(
        'Touch your {genital}.',
        'sub',
        'Jessica',
        localPlayers,
        false
      );

      expect(result).toBe('Touch your pussy.');
    });

    it('uses strapon for female dom with {genital}', () => {
      const femaleDom: LocalPlayer = {
        ...localPlayers[1],
        role: 'dom',
        name: 'Sarah',
      };
      const players = [femaleDom, localPlayers[0]];

      const result = actionStringReplacement(
        'Use your {genital} on {sub}.',
        'dom',
        'Sarah',
        players,
        false
      );

      expect(result).toContain('strapon');
    });

    it('replaces {hole} placeholder appropriately', () => {
      const result = actionStringReplacement(
        "Finger {sub}'s {hole}.",
        'dom',
        'Mike',
        localPlayers,
        false
      );

      expect(result).toBe("Finger Jessica's pussy.");
    });

    it('replaces {chest} placeholder for female', () => {
      const result = actionStringReplacement(
        "Touch {sub}'s {chest}.",
        'dom',
        'Mike',
        localPlayers,
        false
      );

      expect(result).toBe("Touch Jessica's breasts.");
    });

    it('handles non-binary player', () => {
      const nonBinaryPlayer: LocalPlayer = {
        id: '3',
        name: 'Alex',
        gender: 'non-binary',
        role: 'vers',
        order: 2,
        isActive: false,
        deviceId: 'device1',
        location: 0,
        isFinished: false,
      };
      const players = [nonBinaryPlayer, ...localPlayers];

      const result = actionStringReplacement(
        '{player} touches {pronoun_possessive} {genital}.',
        'vers',
        'Alex',
        players,
        false
      );

      expect(result).toBe('Alex touches their genitals.');
    });

    it('handles player without gender (defaults to neutral)', () => {
      const playerNoGender: LocalPlayer = {
        id: '4',
        name: 'Sam',
        // gender field omitted
        role: 'sub',
        order: 3,
        isActive: false,
        deviceId: 'device1',
        location: 0,
        isFinished: false,
      };
      const players = [playerNoGender];

      const result = actionStringReplacement('Touch your {genital}.', 'sub', 'Sam', players, false);

      expect(result).toBe('Touch your genitals.');
    });

    it('handles vers player choosing dom role', () => {
      const versPlayer: LocalPlayer = {
        id: '5',
        name: 'Pat',
        gender: 'male',
        role: 'vers',
        order: 4,
        isActive: false,
        deviceId: 'device1',
        location: 0,
        isFinished: false,
      };
      const players = [versPlayer, localPlayers[1]];

      // This should randomly choose dom or sub, but name should always appear
      const result = actionStringReplacement('{dom} touches {sub}.', 'vers', 'Pat', players, false);

      expect(result).toContain('Pat');
    });
  });

  describe('online/solo mode', () => {
    it('replaces anatomy placeholders with provided gender (male)', () => {
      const result = actionStringReplacement(
        'Touch your {genital}.',
        'sub',
        'Mike',
        undefined,
        false,
        'male',
        'en'
      );

      expect(result).toBe('Touch your dick.');
    });

    it('replaces anatomy placeholders with provided gender (female)', () => {
      const result = actionStringReplacement(
        'Touch your {genital}.',
        'sub',
        'Jessica',
        undefined,
        false,
        'female',
        'en'
      );

      expect(result).toBe('Touch your pussy.');
    });

    it('uses strapon for female dom', () => {
      const result = actionStringReplacement(
        'Use your {genital}.',
        'dom',
        'Sarah',
        undefined,
        false,
        'female',
        'en'
      );

      expect(result).toBe('Use your strapon.');
    });

    it('handles undefined gender (defaults to neutral)', () => {
      const result = actionStringReplacement(
        'Touch your {genital}.',
        'sub',
        'Player',
        undefined,
        false,
        undefined,
        'en'
      );

      expect(result).toBe('Touch your genitals.');
    });

    it('replaces role placeholder with player name', () => {
      const result = actionStringReplacement(
        '{player} does something.',
        'sub',
        'Mike',
        undefined,
        false,
        'male',
        'en'
      );

      expect(result).toBe('Mike does something.');
    });

    it('replaces {dom} placeholder for dom player', () => {
      const result = actionStringReplacement(
        '{dom} commands {sub}.',
        'dom',
        'Mike',
        undefined,
        false,
        'male',
        'en'
      );

      expect(result).toBe('Mike commands another player.');
    });
  });

  describe('capitalization', () => {
    it('capitalizes first letter', () => {
      const result = actionStringReplacement(
        '{player} does something.',
        'sub',
        'mike',
        undefined,
        false,
        'male',
        'en'
      );

      expect(result.charAt(0)).toBe('M');
    });

    it('capitalizes after period', () => {
      const result = actionStringReplacement(
        '{player} does this. {player} does that.',
        'sub',
        'mike',
        undefined,
        false,
        'male',
        'en'
      );

      expect(result).toMatch(/\. M/);
    });
  });

  describe('edge cases', () => {
    it('handles empty action string', () => {
      const result = actionStringReplacement('', 'sub', 'Mike', undefined, false, 'male', 'en');

      expect(result).toBe('');
    });

    it('handles action with no placeholders', () => {
      const result = actionStringReplacement(
        'No placeholders here.',
        'sub',
        'Mike',
        undefined,
        false,
        'male',
        'en'
      );

      expect(result).toBe('No placeholders here.');
    });

    it('handles mixed placeholder types', () => {
      const result = actionStringReplacement(
        '{player} touches {pronoun_possessive} {genital}.',
        'sub',
        'Mike',
        undefined,
        false,
        'male',
        'en'
      );

      expect(result).toBe('Mike touches his dick.');
    });

    it('handles non-binary gender when explicitly specified', () => {
      const result = actionStringReplacement(
        'Touch {pronoun_possessive} {genital}.',
        'sub',
        'Player',
        undefined,
        false,
        'non-binary',
        'en'
      );

      expect(result).toBe('Touch their genitals.');
    });
  });

  describe('locale support', () => {
    it('uses Spanish anatomy terms', () => {
      const result = actionStringReplacement(
        'Toca tu {genital}.',
        'sub',
        'Juan',
        undefined,
        false,
        'male',
        'es'
      );

      expect(result).toBe('Toca tu polla.');
    });

    it('uses French anatomy terms', () => {
      const result = actionStringReplacement(
        'Touche ton {genital}.',
        'sub',
        'Pierre',
        undefined,
        false,
        'male',
        'fr'
      );

      expect(result).toBe('Touche ton bite.');
    });

    it('defaults to English if locale not specified', () => {
      const result = actionStringReplacement(
        'Touch your {genital}.',
        'sub',
        'Mike',
        undefined,
        false,
        'male'
        // locale omitted
      );

      expect(result).toBe('Touch your dick.');
    });
  });
});
