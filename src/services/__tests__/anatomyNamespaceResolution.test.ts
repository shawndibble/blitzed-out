/**
 * Regression guard for the female-dom strapon namespace bug.
 *
 * The global i18next mock in setupTests collapses dot-form and colon-form keys
 * to the same path, so it cannot detect a wrong-namespace lookup. This guard
 * builds a REAL i18next instance configured exactly like production
 * (`defaultNS: 'translation'`, no `fallbackNS`) loaded with the real
 * `anatomy.json` resources, then routes the production resolvers through it by
 * spying on the mocked singleton's `t`.
 *
 * With faithful namespace semantics, the previously-shipped dot-form lookup
 * (`anatomy.straponTerms.strapon`) resolves against the `translation` namespace,
 * misses, and echoes the literal key — so this test FAILS against the old bug
 * and PASSES with the colon-form fix. anatomyPlaceholderService owns that lookup;
 * actionStringReplacement delegates to it.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import i18next, { type InitOptions } from 'i18next';

import actionStringReplacement from '../actionStringReplacement';
import { getRoleAwareAnatomyTerm } from '../anatomyPlaceholderService';

import enAnatomy from '@/locales/en/anatomy.json';
import esAnatomy from '@/locales/es/anatomy.json';
import frAnatomy from '@/locales/fr/anatomy.json';
import zhAnatomy from '@/locales/zh/anatomy.json';
import hiAnatomy from '@/locales/hi/anatomy.json';
import deAnatomy from '@/locales/de/anatomy.json';

const locales: Record<string, unknown> = {
  en: enAnatomy,
  es: esAnatomy,
  fr: frAnatomy,
  zh: zhAnatomy,
  hi: hiAnatomy,
  de: deAnatomy,
};

let spy: ReturnType<typeof vi.spyOn>;

beforeAll(async () => {
  // Bypass the hoisted global i18next mock with the genuine module to build a
  // production-faithful instance (defaultNS:'translation', no fallbackNS).
  const actual = await vi.importActual<typeof import('i18next')>('i18next');
  const instance = actual.default.createInstance();

  const resources: Record<string, Record<string, object>> = {};
  for (const [lng, anatomy] of Object.entries(locales)) {
    resources[lng] = { translation: {}, anatomy: anatomy as object };
  }

  const initOptions: InitOptions = {
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: Object.keys(locales),
    ns: ['translation', 'anatomy'],
    defaultNS: 'translation',
    preload: Object.keys(locales),
    interpolation: { escapeValue: false },
    resources,
  };
  await instance.init(initOptions);

  // Route the production code's i18next.t calls through the faithful instance.
  const faithfulT = (key: string, opts?: Record<string, unknown>): unknown => instance.t(key, opts);
  spy = vi.spyOn(i18next, 't').mockImplementation(faithfulT as unknown as typeof i18next.t);
});

afterAll(() => {
  spy.mockRestore();
});

describe('anatomy namespace resolution (production resolvers, faithful i18next)', () => {
  it('female dom + penetrative genital resolves to the real strapon term, not the literal key', () => {
    const term = getRoleAwareAnatomyTerm('genital', 'female', 'dom', 'en', true);
    expect(term).toBe('strapon');
    expect(term).not.toBe('anatomy.straponTerms.strapon');
  });

  it('resolves the localized strapon term in es/fr', () => {
    expect(getRoleAwareAnatomyTerm('genital', 'female', 'dom', 'es', true)).toBe('arnés');
    expect(getRoleAwareAnatomyTerm('genital', 'female', 'dom', 'fr', true)).toBe('gode-ceinture');
  });

  it('resolves a non-empty, non-key strapon term in zh/hi/de', () => {
    for (const lng of ['zh', 'hi', 'de']) {
      const term = getRoleAwareAnatomyTerm('genital', 'female', 'dom', lng, true);
      expect(term).not.toBe('anatomy.straponTerms.strapon');
      expect(term).not.toBe('anatomy:straponTerms.strapon');
      expect(term.length).toBeGreaterThan(0);
    }
  });

  // {tip} follows {genital} onto the strapon, so it needs the same key-leakage
  // guard in every locale — a missing straponTerms.tip renders the raw key.
  it('resolves a non-empty, non-key strapon tip term in every locale', () => {
    for (const lng of ['en', 'es', 'fr', 'zh', 'hi', 'de']) {
      const term = getRoleAwareAnatomyTerm('tip', 'female', 'dom', lng, true);
      expect(term).not.toBe('anatomy.straponTerms.tip');
      expect(term).not.toBe('anatomy:straponTerms.tip');
      expect(term.length).toBeGreaterThan(0);
    }
  });

  it('resolves a real tip term for every gender and locale', () => {
    for (const lng of ['en', 'es', 'fr', 'zh', 'hi', 'de']) {
      for (const gender of ['male', 'female', 'non-binary'] as const) {
        const term = getRoleAwareAnatomyTerm('tip', gender, 'sub', lng, false);
        // A missing mapping surfaces as the namespaced key or an empty string.
        expect(term).not.toContain('anatomy');
        expect(term.length).toBeGreaterThan(0);
      }
    }
  });

  it('distinguishes the tip by anatomy in English', () => {
    expect(getRoleAwareAnatomyTerm('tip', 'male', 'sub', 'en', false)).toBe('tip');
    expect(getRoleAwareAnatomyTerm('tip', 'female', 'sub', 'en', false)).toBe('clit');
  });

  it('end-to-end: female dom penetrative {genital} renders strapon through actionStringReplacement', () => {
    const result = actionStringReplacement(
      'Use your {genital}.',
      'dom',
      'Sarah',
      undefined,
      false,
      'female',
      'en',
      true
    );
    expect(result).toBe('Use your strapon.');
  });

  it('non-penetrative female dom keeps real anatomy (no over-strapping)', () => {
    expect(getRoleAwareAnatomyTerm('genital', 'female', 'dom', 'en', false)).toBe('pussy');
  });
});
