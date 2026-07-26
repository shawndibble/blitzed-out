/**
 * The single answer to "which locale are we in?", and the single way to change it.
 *
 * Six sources used to answer that question — `resolvedLanguage`, `language`,
 * `settings.locale`, `localStorage['i18nextLng']`, `navigator.language`, and the
 * OS via `toLocaleString([])` — each re-deciding the resolvedLanguage-vs-language
 * normalisation at its own call site. Worse, only one of three language switches
 * updated the persisted `settings.locale` mirror, so the other two left every
 * reader of that mirror on the previous language.
 *
 * Reads go through `currentLocale()`. Changes go through `changeLocale()`, which
 * owns the mirror, so it cannot go stale by construction.
 */
import i18next from 'i18next';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from './migration/constants';

export const FALLBACK_LOCALE = 'en';

/**
 * i18next exposes both `language` (what was requested, e.g. `en-US`) and
 * `resolvedLanguage` (what actually loaded, e.g. `en`). Content is stored and
 * queried by the resolved form; an `en-US`-vs-`en` mismatch here seeds one locale
 * while queries filter by another.
 */
export function currentLocale(): string {
  return i18next.resolvedLanguage || i18next.language || FALLBACK_LOCALE;
}

/** The current locale, narrowed to one the app ships content for. */
export function currentSupportedLocale(): SupportedLanguage {
  const locale = currentLocale();
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(locale)
    ? (locale as SupportedLanguage)
    : FALLBACK_LOCALE;
}

/** Subscribe to locale changes. Returns an unsubscribe. */
export function onLocaleChange(listener: (locale: string) => void): () => void {
  const handler = () => listener(currentLocale());
  i18next.on('languageChanged', handler);
  return () => i18next.off('languageChanged', handler);
}

/**
 * Wait for i18next to report the change. The event is the signal; the timeout is
 * a floor so a caller can never hang on a switch that silently failed to emit.
 */
function awaitLanguageChanged(timeoutMs = 500): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      i18next.off('languageChanged', finish);
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(finish, timeoutMs);
    i18next.on('languageChanged', finish);
  });
}

export interface ChangeLocaleOptions {
  /** Resolve only once i18next has reported the change. */
  waitForPropagation?: boolean;
}

/**
 * Switch language. Every switch path calls this, so the persisted mirror is
 * updated exactly once per change and can never lag behind the singleton.
 */
export async function changeLocale(
  next: string,
  options: ChangeLocaleOptions = {}
): Promise<string> {
  const propagated = options.waitForPropagation ? awaitLanguageChanged() : Promise.resolve();

  await i18next.changeLanguage(next);
  // Import lazily: the settings store pulls in Dexie, and this module is read by
  // services that must not drag persistence in behind them.
  const { useSettingsStore } = await import('@/stores/settingsStore');
  useSettingsStore.getState().setLocale(currentLocale());

  await propagated;
  return currentLocale();
}
