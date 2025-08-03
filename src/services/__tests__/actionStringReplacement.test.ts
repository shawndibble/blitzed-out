import { describe, it, expect, vi } from 'vitest';
import actionStringReplacement from '@/services/actionStringReplacement';
import type { LocalPlayer } from '@/types/localPlayers';

// Mock i18next
vi.mock('i18next', () => ({
  default: {
    t: vi.fn((key: string) => {
      const translations: Record<string, string> = {
        anotherPlayer: 'another player',
      };
      return translations[key] || key;
    }),
  },
}));

describe('actionStringReplacement', () => {
  const displayName = 'TestPlayer';

  describe('player role placeholders', () => {
    it('should replace {player} with display name for any role', () => {
      const action = 'You are {player}, ready to play!';

      expect(actionStringReplacement(action, 'dom', displayName)).toBe(
        'You are TestPlayer, ready to play!'
      );
      expect(actionStringReplacement(action, 'sub', displayName)).toBe(
        'You are TestPlayer, ready to play!'
      );
      expect(actionStringReplacement(action, 'vers', displayName)).toBe(
        'You are TestPlayer, ready to play!'
      );
    });
  });

  describe('dom role', () => {
    it('should replace {dom} with player name and {sub} with "another player"', () => {
      const action = '{dom} tells {sub} what to do.';

      const result = actionStringReplacement(action, 'dom', displayName);

      expect(result).toBe('TestPlayer tells another player what to do.');
    });

    it('should replace multiple {dom} instances with player name', () => {
      const action = '{dom} instructs {sub} while {dom} maintains control.';

      const result = actionStringReplacement(action, 'dom', displayName);

      expect(result).toBe(
        'TestPlayer instructs another player while TestPlayer maintains control.'
      );
    });

    it('should handle actions with only {dom} placeholders', () => {
      const action = '{dom} takes charge and {dom} leads the scene.';

      const result = actionStringReplacement(action, 'dom', displayName);

      expect(result).toBe('TestPlayer takes charge and TestPlayer leads the scene.');
    });

    it('should handle actions with only {sub} placeholders', () => {
      const action = '{sub} follows instructions from the dominant partner.';

      const result = actionStringReplacement(action, 'dom', displayName);

      // Fallback behavior: since dom role doesn't have {dom} placeholder, {sub} gets player name
      expect(result).toBe('TestPlayer follows instructions from the dominant partner.');
    });
  });

  describe('sub role', () => {
    it('should replace {sub} with player name and {dom} with "another player"', () => {
      const action = '{dom} tells {sub} what to do.';

      const result = actionStringReplacement(action, 'sub', displayName);

      expect(result).toBe('Another player tells TestPlayer what to do.');
    });

    it('should replace multiple {sub} instances with player name', () => {
      const action = '{sub} obeys while {dom} watches {sub} carefully.';

      const result = actionStringReplacement(action, 'sub', displayName);

      expect(result).toBe('TestPlayer obeys while another player watches TestPlayer carefully.');
    });

    it('should handle actions with only {sub} placeholders', () => {
      const action = '{sub} kneels and {sub} waits for instructions.';

      const result = actionStringReplacement(action, 'sub', displayName);

      expect(result).toBe('TestPlayer kneels and TestPlayer waits for instructions.');
    });

    it('should handle actions with only {dom} placeholders', () => {
      const action = '{dom} gives commands to the submissive partner.';

      const result = actionStringReplacement(action, 'sub', displayName);

      // Fallback behavior: since sub role doesn't have {sub} placeholder, {dom} gets player name
      expect(result).toBe('TestPlayer gives commands to the submissive partner.');
    });
  });

  describe('vers role', () => {
    it('should randomly replace either {dom} or {sub} with player name when both present', () => {
      const action = '{dom} and {sub} switch roles.';

      // Run multiple times to test randomness
      const results = Array.from({ length: 10 }, () =>
        actionStringReplacement(action, 'vers', displayName)
      );

      // Should have both possible outcomes
      const hasPlayerAsDom = results.some((r) => r.includes('TestPlayer and another player'));
      const hasPlayerAsSub = results.some((r) => r.includes('Another player and TestPlayer'));

      expect(hasPlayerAsDom || hasPlayerAsSub).toBe(true);

      // All results should contain the player name once
      results.forEach((result) => {
        const playerCount = (result.match(/TestPlayer/g) || []).length;
        expect(playerCount).toBe(1);
      });
    });

    it('should replace {dom} with player name when only {dom} present', () => {
      const action = '{dom} takes control of the situation.';

      const result = actionStringReplacement(action, 'vers', displayName);

      expect(result).toBe('TestPlayer takes control of the situation.');
    });

    it('should replace {sub} with player name when only {sub} present', () => {
      const action = '{sub} follows the lead.';

      const result = actionStringReplacement(action, 'vers', displayName);

      expect(result).toBe('TestPlayer follows the lead.');
    });
  });

  describe('edge cases', () => {
    it('should handle empty action string', () => {
      const result = actionStringReplacement('', 'dom', displayName);

      expect(result).toBe('');
    });

    it('should handle action with no placeholders', () => {
      const action = 'This is a simple action.';

      const result = actionStringReplacement(action, 'dom', displayName);

      expect(result).toBe('This is a simple action.');
    });

    it('should handle undefined role gracefully', () => {
      const action = '{dom} tells {sub} what to do.';

      const result = actionStringReplacement(action, '', displayName);

      // Fallback behavior: empty role gets player name on first occurrence
      expect(result).toBe('TestPlayer tells another player what to do.');
    });

    it('should handle empty display name', () => {
      const action = '{dom} tells {sub} what to do.';

      const result = actionStringReplacement(action, 'dom', '');

      expect(result).toBe(' tells another player what to do.');
    });

    it('should capitalize first letter correctly', () => {
      const action = '{dom} tells {sub} what to do. {dom} is in charge.';

      const result = actionStringReplacement(action, 'dom', displayName);

      expect(result).toBe('TestPlayer tells another player what to do. TestPlayer is in charge.');
    });

    it('should handle mixed case placeholders', () => {
      const action = '{player} and {DOM} and {SUB}';

      const result = actionStringReplacement(action, 'dom', displayName);

      // Should only replace exact case matches
      expect(result).toBe('TestPlayer and {DOM} and {SUB}');
    });
  });

  describe('fallback behavior', () => {
    it('should ensure at least one placeholder becomes player name for dom role', () => {
      const action = '{sub} receives instructions.';

      const result = actionStringReplacement(action, 'dom', displayName);

      // Since dom role doesn't have {dom} placeholder, should still replace {sub} with player name
      expect(result).toBe('TestPlayer receives instructions.');
    });

    it('should ensure at least one placeholder becomes player name for sub role', () => {
      const action = '{dom} gives instructions.';

      const result = actionStringReplacement(action, 'sub', displayName);

      // Since sub role doesn't have {sub} placeholder, should still replace {dom} with player name
      expect(result).toBe('TestPlayer gives instructions.');
    });

    it('should not apply fallback for vers role', () => {
      const action = '{dom} gives instructions.';

      const result = actionStringReplacement(action, 'vers', displayName);

      // Vers role should use its own logic, replacing {dom} with player name
      expect(result).toBe('TestPlayer gives instructions.');
    });
  });

  describe('local multiplayer role-based selection', () => {
    const localPlayers: LocalPlayer[] = [
      {
        id: '1',
        name: 'Alice',
        role: 'dom',
        order: 0,
        isActive: true,
        deviceId: 'device1',
        location: 0,
        isFinished: false,
      },
      {
        id: '2',
        name: 'Bob',
        role: 'sub',
        order: 1,
        isActive: false,
        deviceId: 'device1',
        location: 2,
        isFinished: false,
      },
      {
        id: '3',
        name: 'Charlie',
        role: 'vers',
        order: 2,
        isActive: false,
        deviceId: 'device1',
        location: 1,
        isFinished: false,
      },
    ];

    it('should replace {dom} with a random dom or vers player name (excluding current player)', () => {
      const action = 'Current player follows {dom} instructions.';

      const result = actionStringReplacement(action, 'sub', 'Bob', localPlayers);

      // Should replace {dom} with either Alice or Charlie (both can be dom), but NOT Bob
      expect(result).toMatch(/Current player follows (Alice|Charlie) instructions\./);
      expect(result).not.toContain('{dom}');
      expect(result).not.toContain('another player');
      expect(result).not.toContain('Bob'); // Current player should not appear twice
    });

    it('should replace {sub} with a random sub or vers player name (excluding current player)', () => {
      const action = 'Current player dominates {sub} completely.';

      const result = actionStringReplacement(action, 'dom', 'Alice', localPlayers);

      // Should replace {sub} with either Bob or Charlie (both can be sub), but NOT Alice
      expect(result).toMatch(/Current player dominates (Bob|Charlie) completely\./);
      expect(result).not.toContain('{sub}');
      expect(result).not.toContain('another player');
      expect(result).not.toContain('Alice'); // Current player should not appear twice
    });

    it('should handle multiple placeholders with different role requirements', () => {
      const action = '{dom} instructs {sub} to obey.';

      const result = actionStringReplacement(action, 'vers', 'Charlie', localPlayers);

      // Charlie should take one role, and other players should take the remaining role
      expect(result).toMatch(/(Alice|Charlie) instructs (Bob|Charlie) to obey\./);
      expect(result).not.toContain('{dom}');
      expect(result).not.toContain('{sub}');
      expect(result).not.toContain('another player');

      // Ensure Charlie doesn't appear twice
      const charlieCount = (result.match(/Charlie/g) || []).length;
      expect(charlieCount).toBeLessThanOrEqual(1);
    });

    it('should prioritize current player for their matching role', () => {
      const action = '{dom} commands {sub} to submit.';

      const result = actionStringReplacement(action, 'dom', 'Alice', localPlayers);

      // Alice (dom) should be placed in the {dom} position first
      expect(result).toMatch(/Alice commands (Bob|Charlie) to submit\./);
      expect(result).not.toContain('{dom}');
      expect(result).not.toContain('{sub}');

      // Ensure Alice doesn't appear twice
      const aliceCount = (result.match(/Alice/g) || []).length;
      expect(aliceCount).toBe(1);
    });

    it('should fall back to "another player" when no suitable role found', () => {
      const limitedPlayers: LocalPlayer[] = [
        {
          id: '1',
          name: 'OnlyDom',
          role: 'dom',
          order: 0,
          isActive: true,
          deviceId: 'device1',
          location: 0,
          isFinished: false,
        },
      ];

      const action = 'Current player follows {sub} instructions.';

      const result = actionStringReplacement(action, 'dom', 'OnlyDom', limitedPlayers);

      // Should fall back to "another player" since no sub/vers players available
      expect(result).toBe('Current player follows another player instructions.');
    });

    it('should work without local players (backward compatibility)', () => {
      const action = '{dom} gives instructions to {sub}.';

      const result = actionStringReplacement(action, 'sub', 'TestPlayer');

      // Should replace current player's role and use "another player" for others
      expect(result).toBe('Another player gives instructions to TestPlayer.');
    });

    it('should handle empty local players array', () => {
      const action = '{dom} gives instructions to {sub}.';

      const result = actionStringReplacement(action, 'sub', 'TestPlayer', []);

      // Should fall back to "another player" behavior
      expect(result).toBe('Another player gives instructions to TestPlayer.');
    });
  });

  describe('generic placeholders mode', () => {
    it('should use generic placeholders when useGenericPlaceholders is true', () => {
      const action = '{player} follows {dom} instructions and pleasures {sub}.';

      const result = actionStringReplacement(action, 'dom', 'TestPlayer', undefined, true);

      expect(result).toBe(
        'The current player follows a dominant instructions and pleasures a submissive.'
      );
    });

    it('should handle actions with only player placeholder', () => {
      const action = 'Welcome {player}! You are ready to begin.';

      const result = actionStringReplacement(action, 'sub', 'TestPlayer', undefined, true);

      expect(result).toBe('Welcome the current player! You are ready to begin.');
    });

    it('should handle actions with only role placeholders', () => {
      const action = '{dom} commands {sub} to submit completely.';

      const result = actionStringReplacement(action, 'vers', 'TestPlayer', undefined, true);

      expect(result).toBe('A dominant commands a submissive to submit completely.');
    });

    it('should not use actual player names when useGenericPlaceholders is true', () => {
      const action = '{player} dominates {sub} while {dom} watches.';
      const localPlayers = [
        {
          id: '1',
          name: 'Alice',
          role: 'dom' as const,
          order: 0,
          isActive: true,
          deviceId: 'device1',
          location: 0,
          isFinished: false,
        },
        {
          id: '2',
          name: 'Bob',
          role: 'sub' as const,
          order: 1,
          isActive: false,
          deviceId: 'device1',
          location: 1,
          isFinished: false,
        },
      ];

      const result = actionStringReplacement(action, 'dom', 'Alice', localPlayers, true);

      // Should use generic placeholders instead of actual names
      expect(result).toBe('The current player dominates a submissive while a dominant watches.');
      expect(result).not.toContain('Alice');
      expect(result).not.toContain('Bob');
    });
  });
});
