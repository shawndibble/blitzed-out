import { describe, it, expect, vi, afterEach } from 'vitest';
import i18next from 'i18next';
import {
  replaceTokenNames,
  normalizePlaceholders,
  localizePlaceholders,
} from '../placeholderAliasService';
import enPlaceholders from '@/locales/en/placeholders.json';
import esPlaceholders from '@/locales/es/placeholders.json';
import frPlaceholders from '@/locales/fr/placeholders.json';
import dePlaceholders from '@/locales/de/placeholders.json';
import zhPlaceholders from '@/locales/zh/placeholders.json';
import hiPlaceholders from '@/locales/hi/placeholders.json';

// Spanish canonical -> localized token map (single source of truth in JSON at runtime)
const ES_TOKENS: Record<string, string> = {
  genital: 'genitales',
  hole: 'agujero',
  chest: 'pecho',
  pronoun_subject: 'pronombre_sujeto',
  pronoun_object: 'pronombre_objeto',
  pronoun_possessive: 'pronombre_posesivo',
  pronoun_reflexive: 'pronombre_reflexivo',
  player: 'jugador',
  dom: 'dominante',
  sub: 'sumiso',
};

function reverse(map: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k]));
}

describe('placeholderAliasService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('replaceTokenNames (pure)', () => {
    it('replaces a bare token name', () => {
      expect(replaceTokenNames('Touch your {genitales}.', reverse(ES_TOKENS))).toBe(
        'Touch your {genital}.'
      );
    });

    it('preserves a |role suffix and leaves the target English', () => {
      expect(replaceTokenNames('Lick {genitales|dom}.', reverse(ES_TOKENS))).toBe(
        'Lick {genital|dom}.'
      );
    });

    it('handles the possessive form as two independent brace groups', () => {
      expect(replaceTokenNames("Stroke {dominante}'s {genitales}.", reverse(ES_TOKENS))).toBe(
        "Stroke {dom}'s {genital}."
      );
    });

    it('passes unknown tokens through untouched', () => {
      expect(replaceTokenNames('Kiss {foo} and {jugador}.', reverse(ES_TOKENS))).toBe(
        'Kiss {foo} and {player}.'
      );
    });

    it('handles adjacent tokens and brace-free text', () => {
      expect(replaceTokenNames('{jugador}{dominante}', reverse(ES_TOKENS))).toBe('{player}{dom}');
      expect(replaceTokenNames('no tokens here', reverse(ES_TOKENS))).toBe('no tokens here');
    });

    it('matches mixed-case localized tokens (case-insensitive)', () => {
      // German-style capitalized nouns, or any casing, still normalize.
      expect(replaceTokenNames('Toca tus {Genitales}.', reverse(ES_TOKENS))).toBe(
        'Toca tus {genital}.'
      );
      expect(replaceTokenNames('Obedece al {DOMINANTE}.', reverse(ES_TOKENS))).toBe(
        'Obedece al {dom}.'
      );
    });

    it('is a no-op for an identity map (en)', () => {
      const identity = Object.fromEntries(Object.keys(ES_TOKENS).map((k) => [k, k]));
      const text = 'Touch your {genital} and {pronoun_possessive} {chest}.';
      expect(replaceTokenNames(text, identity)).toBe(text);
    });
  });

  describe('normalize/localize round-trip', () => {
    function mockLocale(tokens: Record<string, string>) {
      vi.spyOn(i18next, 't').mockImplementation(((key: string, opts?: any) => {
        if (key === 'placeholders:tokens' && opts?.returnObjects) return tokens;
        return key;
      }) as typeof i18next.t);
    }

    it('normalizes localized tokens to canonical English', () => {
      mockLocale(ES_TOKENS);
      expect(normalizePlaceholders('Edge {dominante} with {genitales|self}.', 'es')).toBe(
        'Edge {dom} with {genital|self}.'
      );
    });

    it('localizes canonical English back to the locale', () => {
      mockLocale(ES_TOKENS);
      expect(localizePlaceholders('Edge {dom} with {genital|self}.', 'es')).toBe(
        'Edge {dominante} with {genitales|self}.'
      );
    });

    it('round-trips normalize(localize(x)) === x for canonical input', () => {
      mockLocale(ES_TOKENS);
      const canonical = "Tease {dom}'s {chest} while {pronoun_subject} watches.";
      expect(normalizePlaceholders(localizePlaceholders(canonical, 'es'), 'es')).toBe(canonical);
    });

    it('is a no-op when the locale has no token map', () => {
      vi.spyOn(i18next, 't').mockImplementation(((key: string) => key) as typeof i18next.t);
      const text = 'Touch your {genital}.';
      expect(normalizePlaceholders(text, 'en')).toBe(text);
      expect(localizePlaceholders(text, 'en')).toBe(text);
    });
  });

  // The customTiles intake normalizes on every write, so text normalized once
  // (by a dialog, pack import, or sync) passes through again. That is only safe
  // if canonical tokens are fixed points of every shipped locale's alias map.
  describe('canonical stability across shipped locales (intake idempotency)', () => {
    const shipped: Record<string, Record<string, string>> = {
      en: enPlaceholders.tokens,
      es: esPlaceholders.tokens,
      fr: frPlaceholders.tokens,
      de: dePlaceholders.tokens,
      zh: zhPlaceholders.tokens,
      hi: hiPlaceholders.tokens,
    };

    function mockLocale(tokens: Record<string, string>) {
      vi.spyOn(i18next, 't').mockImplementation(((key: string, opts?: any) => {
        if (key === 'placeholders:tokens' && opts?.returnObjects) return tokens;
        return key;
      }) as typeof i18next.t);
    }

    it.each(Object.keys(shipped))('normalize leaves canonical text unchanged for %s', (locale) => {
      const tokens = shipped[locale];
      mockLocale(tokens);
      const canonicalText = Object.keys(tokens)
        .map((name) => `{${name}}`)
        .join(' ');
      expect(normalizePlaceholders(canonicalText, locale)).toBe(canonicalText);
    });

    it.each(Object.keys(shipped))('normalize is idempotent for localized text in %s', (locale) => {
      const tokens = shipped[locale];
      mockLocale(tokens);
      const localizedText = Object.values(tokens)
        .map((name) => `{${name}}`)
        .join(' ');
      const once = normalizePlaceholders(localizedText, locale);
      expect(normalizePlaceholders(once, locale)).toBe(once);
    });
  });
});
