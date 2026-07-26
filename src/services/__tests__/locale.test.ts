import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18next from 'i18next';
import { changeLocale, currentLocale, currentSupportedLocale, onLocaleChange } from '../locale';
import { useSettingsStore } from '@/stores/settingsStore';

const mutable = i18next as unknown as { language?: string; resolvedLanguage?: string };

beforeEach(() => {
  vi.mocked(i18next.changeLanguage).mockImplementation((async (next?: string) => {
    mutable.language = next;
    mutable.resolvedLanguage = next?.split('-')[0];
    return ((key: string) => key) as any;
  }) as typeof i18next.changeLanguage);
  useSettingsStore.getState().setLocale('en');
});

afterEach(() => {
  mutable.language = 'en';
  mutable.resolvedLanguage = 'en';
  vi.restoreAllMocks();
});

describe('currentLocale', () => {
  it('prefers what actually loaded over what was requested', () => {
    mutable.language = 'en-US';
    mutable.resolvedLanguage = 'en';

    // The en-US-vs-en mismatch is the one that seeds one locale and queries another.
    expect(currentLocale()).toBe('en');
  });

  it('falls back to the requested language, then to en', () => {
    mutable.resolvedLanguage = undefined;
    mutable.language = 'fr';
    expect(currentLocale()).toBe('fr');

    mutable.language = undefined;
    expect(currentLocale()).toBe('en');
  });

  it('narrows an unshipped locale to en', () => {
    mutable.resolvedLanguage = 'pt';
    expect(currentLocale()).toBe('pt');
    expect(currentSupportedLocale()).toBe('en');

    mutable.resolvedLanguage = 'de';
    expect(currentSupportedLocale()).toBe('de');
  });
});

describe('changeLocale', () => {
  it('updates the persisted mirror on every switch', async () => {
    await changeLocale('de');

    expect(i18next.changeLanguage).toHaveBeenCalledWith('de');
    // The defect this seam exists to prevent: two of three switch paths changed
    // the language without touching the mirror, stranding its readers.
    expect(useSettingsStore.getState().settings.locale).toBe('de');
  });

  it('mirrors the resolved locale, not the requested one', async () => {
    await changeLocale('en-US');

    expect(useSettingsStore.getState().settings.locale).toBe('en');
  });

  it('returns the locale in effect afterwards', async () => {
    await expect(changeLocale('fr')).resolves.toBe('fr');
  });

  it('can wait for propagation without hanging when the event never fires', async () => {
    vi.useFakeTimers();
    try {
      const pending = changeLocale('zh', { waitForPropagation: true });
      await vi.advanceTimersByTimeAsync(600);
      await expect(pending).resolves.toBe('zh');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('onLocaleChange', () => {
  it('subscribes and unsubscribes through one place', () => {
    const listener = vi.fn();
    const off = onLocaleChange(listener);

    expect(i18next.on).toHaveBeenCalledWith('languageChanged', expect.any(Function));

    off();
    expect(i18next.off).toHaveBeenCalledWith('languageChanged', expect.any(Function));
  });
});

describe('the shipped language list', () => {
  it('matches i18next config and the locale directories', async () => {
    const { SUPPORTED_LANGUAGES } = await import('@/services/migration/constants');
    const languages = (await import('@/locales/languages.json')).default;

    // German shipped in i18n.ts, in src/locales/de and in languages.json, but not
    // here — so export/pack locale filters and browser detection silently treated
    // German as unsupported. Keep the lists tied together.
    expect([...SUPPORTED_LANGUAGES].sort()).toEqual(Object.keys(languages).sort());
    expect(SUPPORTED_LANGUAGES).toContain('de');
  });
});
