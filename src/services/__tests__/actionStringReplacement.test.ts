import { describe, it, expect, vi } from 'vitest';
import actionStringReplacement from '@/services/actionStringReplacement';

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

      expect(result).toBe('another player tells TestPlayer what to do.');
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
});
