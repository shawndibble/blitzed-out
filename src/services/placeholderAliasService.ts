/**
 * Placeholder Alias Service
 *
 * Lets authors write custom-tile placeholders in their own language
 * (e.g. `{genitales}`, `{Loch}`) while the gameplay replacement pipeline
 * stays 100% canonical English.
 *
 * Tokens are normalized to canonical English on save and localized back to the
 * author's language on edit. The gameplay pipeline (actionStringReplacement,
 * anatomyPlaceholderService) never imports this module and never sees aliases.
 *
 * @module placeholderAliasService
 */

import i18next from 'i18next';

/**
 * Load the canonical -> localized token map for a locale from the
 * `placeholders` i18n namespace. Returns an empty map when absent (no-op).
 */
function loadTokenMap(locale: string): Record<string, string> {
  const tokens = i18next.t('placeholders:tokens', { lng: locale, returnObjects: true });
  return tokens && typeof tokens === 'object' ? (tokens as Record<string, string>) : {};
}

/**
 * Replace the token *name* inside each `{...}` group using `nameMap`, preserving
 * any `|role` suffix verbatim (pipe targets stay English). Unknown names pass
 * through untouched. This single rule covers bare tokens, piped tokens
 * (`{genital|dom}`), and the possessive form (`{dom}'s {genital}` — two groups).
 *
 * Exported for unit testing of the pure transform.
 */
export function replaceTokenNames(text: string, nameMap: Record<string, string>): string {
  return text.replace(/\{([^}|]+)(\|[^}]+)?\}/g, (full, name: string, suffix?: string) => {
    const mapped = nameMap[name];
    return mapped ? `{${mapped}${suffix ?? ''}}` : full;
  });
}

/**
 * Convert an author's localized tokens to canonical English (normalize on save).
 */
export function normalizePlaceholders(text: string, locale: string): string {
  const tokenMap = loadTokenMap(locale);
  const localizedToCanonical: Record<string, string> = {};
  for (const [canonical, localized] of Object.entries(tokenMap)) {
    localizedToCanonical[localized] = canonical;
  }
  return replaceTokenNames(text, localizedToCanonical);
}

/**
 * Convert canonical English tokens to the locale's tokens (de-normalize on edit).
 */
export function localizePlaceholders(text: string, locale: string): string {
  return replaceTokenNames(text, loadTokenMap(locale));
}
