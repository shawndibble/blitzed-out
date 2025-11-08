import { describe, it, expect } from 'vitest';
import {
  getAnatomyMappings,
  getAnatomyTerm,
  getGenitalTermForRole,
  replaceAnatomyPlaceholders,
  hasAnatomyPlaceholders,
  getSupportedPlaceholders,
} from '../anatomyPlaceholderService';
import type { PlayerGender } from '@/types/localPlayers';
import type { PlayerRole } from '@/types/Settings';

describe('anatomyPlaceholderService', () => {
  describe('getAnatomyMappings', () => {
    it('returns correct mappings for male gender in English', () => {
      const mappings = getAnatomyMappings('en', 'male');

      expect(mappings.genital).toBe('dick');
      expect(mappings.hole).toBe('hole');
      expect(mappings.chest).toBe('chest');
      expect(mappings.pronoun_subject).toBe('he');
      expect(mappings.pronoun_object).toBe('him');
      expect(mappings.pronoun_possessive).toBe('his');
      expect(mappings.pronoun_reflexive).toBe('himself');
    });

    it('returns correct mappings for female gender in English', () => {
      const mappings = getAnatomyMappings('en', 'female');

      expect(mappings.genital).toBe('pussy');
      expect(mappings.hole).toBe('pussy');
      expect(mappings.chest).toBe('breasts');
      expect(mappings.pronoun_subject).toBe('she');
      expect(mappings.pronoun_object).toBe('her');
      expect(mappings.pronoun_possessive).toBe('her');
      expect(mappings.pronoun_reflexive).toBe('herself');
    });

    it('returns correct mappings for non-binary gender', () => {
      const mappings = getAnatomyMappings('en', 'non-binary');

      expect(mappings.genital).toBe('genitals');
      expect(mappings.hole).toBe('hole');
      expect(mappings.chest).toBe('chest');
      expect(mappings.pronoun_subject).toBe('they');
      expect(mappings.pronoun_object).toBe('them');
      expect(mappings.pronoun_possessive).toBe('their');
      expect(mappings.pronoun_reflexive).toBe('themselves');
    });

    it('returns neutral mappings for prefer-not-say', () => {
      const mappings = getAnatomyMappings('en', 'prefer-not-say');

      expect(mappings.genital).toBe('genitals');
      expect(mappings.pronoun_subject).toBe('they');
    });

    it('defaults to prefer-not-say when gender is undefined', () => {
      const mappings = getAnatomyMappings('en', undefined);

      expect(mappings.genital).toBe('genitals');
      expect(mappings.pronoun_subject).toBe('they');
    });

    it('returns correct mappings for Spanish', () => {
      const mappings = getAnatomyMappings('es', 'male');

      expect(mappings.genital).toBe('polla');
      expect(mappings.pronoun_subject).toBe('él');
    });

    it('returns correct mappings for French', () => {
      const mappings = getAnatomyMappings('fr', 'female');

      expect(mappings.genital).toBe('chatte');
      expect(mappings.pronoun_subject).toBe('elle');
    });

    it('defaults to English if locale not found', () => {
      const mappings = getAnatomyMappings('unknown', 'male');

      expect(mappings.genital).toBe('dick');
      expect(mappings.pronoun_subject).toBe('he');
    });
  });

  describe('getAnatomyTerm', () => {
    it('returns specific anatomy term', () => {
      const term = getAnatomyTerm('en', 'female', 'chest');
      expect(term).toBe('breasts');
    });

    it('returns pronoun term', () => {
      const term = getAnatomyTerm('en', 'male', 'pronoun_subject');
      expect(term).toBe('he');
    });
  });

  describe('getGenitalTermForRole', () => {
    it('returns strapon for female dom', () => {
      const term = getGenitalTermForRole('female', 'dom', 'en');
      expect(term).toBe('strapon');
    });

    it('returns dick for male dom', () => {
      const term = getGenitalTermForRole('male', 'dom', 'en');
      expect(term).toBe('dick');
    });

    it('returns pussy for female sub', () => {
      const term = getGenitalTermForRole('female', 'sub', 'en');
      expect(term).toBe('pussy');
    });

    it('returns genitals for non-binary', () => {
      const term = getGenitalTermForRole('non-binary', 'dom', 'en');
      expect(term).toBe('genitals');
    });

    it('returns localized strapon for female dom in Spanish', () => {
      const term = getGenitalTermForRole('female', 'dom', 'es');
      expect(term).toBe('arnés');
    });

    it('returns localized strapon for female dom in French', () => {
      const term = getGenitalTermForRole('female', 'dom', 'fr');
      expect(term).toBe('gode-ceinture');
    });
  });

  describe('replaceAnatomyPlaceholders', () => {
    it('replaces {genital} for male', () => {
      const result = replaceAnatomyPlaceholders(
        'Touch your {genital}.',
        'male',
        'sub',
        'en'
      );
      expect(result).toBe('Touch your dick.');
    });

    it('replaces {genital} for female', () => {
      const result = replaceAnatomyPlaceholders(
        'Touch your {genital}.',
        'female',
        'sub',
        'en'
      );
      expect(result).toBe('Touch your pussy.');
    });

    it('replaces {genital} with strapon for female dom', () => {
      const result = replaceAnatomyPlaceholders(
        'Use your {genital}.',
        'female',
        'dom',
        'en'
      );
      expect(result).toBe('Use your strapon.');
    });

    it('replaces {hole} placeholder', () => {
      const result = replaceAnatomyPlaceholders(
        'Insert into {hole}.',
        'female',
        'sub',
        'en'
      );
      expect(result).toBe('Insert into pussy.');
    });

    it('replaces {chest} placeholder', () => {
      const result = replaceAnatomyPlaceholders(
        'Touch your {chest}.',
        'female',
        'sub',
        'en'
      );
      expect(result).toBe('Touch your breasts.');
    });

    it('replaces pronoun placeholders', () => {
      const result = replaceAnatomyPlaceholders(
        '{pronoun_subject} touched {pronoun_possessive} {genital} {pronoun_reflexive}.',
        'male',
        'sub',
        'en'
      );
      expect(result).toBe('he touched his dick himself.');
    });

    it('replaces multiple placeholders in one string', () => {
      const result = replaceAnatomyPlaceholders(
        'Touch {pronoun_possessive} {genital} and {pronoun_possessive} {chest}.',
        'female',
        'sub',
        'en'
      );
      expect(result).toBe('Touch her pussy and her breasts.');
    });

    it('handles non-binary gender', () => {
      const result = replaceAnatomyPlaceholders(
        'Touch {pronoun_possessive} {genital}.',
        'non-binary',
        'vers',
        'en'
      );
      expect(result).toBe('Touch their genitals.');
    });

    it('handles undefined gender gracefully', () => {
      const result = replaceAnatomyPlaceholders(
        'Touch your {genital}.',
        undefined,
        'sub',
        'en'
      );
      expect(result).toBe('Touch your genitals.');
    });

    it('leaves non-matching text unchanged', () => {
      const result = replaceAnatomyPlaceholders('No placeholders here.', 'male', 'sub', 'en');
      expect(result).toBe('No placeholders here.');
    });

    it('works with Spanish locale', () => {
      const result = replaceAnatomyPlaceholders(
        'Toca tu {genital}.',
        'male',
        'sub',
        'es'
      );
      expect(result).toBe('Toca tu polla.');
    });
  });

  describe('hasAnatomyPlaceholders', () => {
    it('returns true for {genital}', () => {
      expect(hasAnatomyPlaceholders('Touch your {genital}.')).toBe(true);
    });

    it('returns true for {hole}', () => {
      expect(hasAnatomyPlaceholders('Insert into {hole}.')).toBe(true);
    });

    it('returns true for {chest}', () => {
      expect(hasAnatomyPlaceholders('Touch your {chest}.')).toBe(true);
    });

    it('returns true for pronoun placeholders', () => {
      expect(hasAnatomyPlaceholders('{pronoun_subject} touched it.')).toBe(true);
      expect(hasAnatomyPlaceholders('Give to {pronoun_object}.')).toBe(true);
      expect(hasAnatomyPlaceholders('Touch {pronoun_possessive} hand.')).toBe(true);
      expect(hasAnatomyPlaceholders('Do it {pronoun_reflexive}.')).toBe(true);
    });

    it('returns false for role placeholders only', () => {
      expect(hasAnatomyPlaceholders('{dom} kisses {sub}.')).toBe(false);
    });

    it('returns false for no placeholders', () => {
      expect(hasAnatomyPlaceholders('Plain text with no placeholders.')).toBe(false);
    });

    it('returns false for partial matches', () => {
      expect(hasAnatomyPlaceholders('genital without braces')).toBe(false);
    });
  });

  describe('getSupportedPlaceholders', () => {
    it('returns all supported placeholders', () => {
      const placeholders = getSupportedPlaceholders();

      expect(placeholders).toContain('genital');
      expect(placeholders).toContain('hole');
      expect(placeholders).toContain('chest');
      expect(placeholders).toContain('pronoun_subject');
      expect(placeholders).toContain('pronoun_object');
      expect(placeholders).toContain('pronoun_possessive');
      expect(placeholders).toContain('pronoun_reflexive');
      expect(placeholders).toHaveLength(7);
    });
  });

  describe('edge cases', () => {
    it('handles empty string', () => {
      const result = replaceAnatomyPlaceholders('', 'male', 'sub', 'en');
      expect(result).toBe('');
    });

    it('handles multiple occurrences of same placeholder', () => {
      const result = replaceAnatomyPlaceholders(
        '{genital} {genital} {genital}',
        'male',
        'sub',
        'en'
      );
      expect(result).toBe('dick dick dick');
    });

    it('handles mixed role and anatomy placeholders', () => {
      const result = replaceAnatomyPlaceholders(
        '{dom} touches {genital}.',
        'male',
        'sub',
        'en'
      );
      // Role placeholders are not replaced by anatomy service
      expect(result).toBe('{dom} touches dick.');
    });
  });
});
