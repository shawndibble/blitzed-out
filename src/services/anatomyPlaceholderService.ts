/**
 * Anatomy Placeholder Service
 *
 * Provides gender-aware anatomy term mappings for inclusive action text.
 * Supports 5 languages: EN, ES, FR, ZH, HI
 * All mappings are loaded from translation files (anatomy.json)
 *
 * @module anatomyPlaceholderService
 */

import { logger } from '@/utils/logger';
import { ANATOMY_PLACEHOLDERS } from '@/types/localPlayers';
import type { AnatomyPlaceholder, PlayerGender } from '@/types/localPlayers';

import type { PlayerRole } from '@/types/Settings';
import i18next from 'i18next';

/**
 * `genital|tip|hole|…` — the alternation body shared by every anatomy token
 * pattern. Exported so callers building their own token syntax (piped and
 * possessive forms in actionStringReplacement) stay in step with this list.
 */
export const ANATOMY_TOKEN_ALTERNATION = ANATOMY_PLACEHOLDERS.join('|');

/**
 * Matches `{token}` and `{token|role}` for any supported anatomy placeholder.
 *
 * The pipe target is captured but optional on purpose: only local multiplayer
 * can resolve a pipe to a specific player, and every other path (solo, online,
 * board preview) still has to render the token as *something* rather than leak
 * the raw `{genital|dom}` into the UI.
 */
export const anatomyTokenPattern = (): RegExp =>
  new RegExp(`\\{(${ANATOMY_TOKEN_ALTERNATION})(?:\\|(dom|sub|other|self))?\\}`, 'g');

/**
 * Anatomy term mapping for a specific gender
 */
export interface AnatomyMapping {
  genital: string;
  /** The most sensitive spot on the genital: glans for a dick, clit for a pussy. */
  tip: string;
  hole: string;
  chest: string;
  pronoun_subject: string;
  pronoun_object: string;
  pronoun_possessive: string;
  pronoun_reflexive: string;
}

/**
 * Complete set of anatomy mappings for all genders in a locale
 */
export interface LocaleAnatomyMappings {
  male: AnatomyMapping;
  female: AnatomyMapping;
  'non-binary': AnatomyMapping;
}

/**
 * Load anatomy mappings from translation files
 *
 * @param locale - Language code (en, es, fr, zh, hi)
 * @returns Anatomy mappings for all genders in the specified locale
 */
function loadAnatomyMappingsForLocale(locale: string): LocaleAnatomyMappings {
  const mappings = i18next.t('anatomy:anatomyMappings', { lng: locale, returnObjects: true });
  return mappings as LocaleAnatomyMappings;
}

/**
 * Get anatomy mapping for a specific gender and locale
 *
 * @param locale - Language code (en, es, fr, zh, hi)
 * @param gender - Player gender
 * @returns Anatomy term mappings
 *
 * @example
 * ```typescript
 * const mapping = getAnatomyMappings('en', 'male');
 * logger.debug(mapping.genital); // 'dick'
 * ```
 */
export function getAnatomyMappings(locale: string, gender?: PlayerGender): AnatomyMapping {
  // Load mappings from translations
  const localeData = loadAnatomyMappingsForLocale(locale);

  // Default to non-binary if gender not specified
  const genderKey = gender || 'non-binary';

  const mapping = localeData?.[genderKey];

  // If mapping is undefined, use generic anatomy terms from translations as fallback
  if (!mapping) {
    logger.warn(`No anatomy mapping found for locale: ${locale}, gender: ${genderKey}`);
    return getGenericAnatomyTerms(locale) as AnatomyMapping;
  }

  return mapping;
}

/**
 * The gender-neutral terms for a locale — what to say where no specific player
 * can be identified.
 */
export function getGenericAnatomyTerms(locale: string): Partial<AnatomyMapping> {
  return i18next.t('anatomy:genericAnatomyTerms', {
    lng: locale,
    returnObjects: true,
  }) as Partial<AnatomyMapping>;
}

/** The gender-neutral term for a single placeholder. */
export function getGenericAnatomyTerm(locale: string, placeholder: AnatomyPlaceholder): string {
  return getGenericAnatomyTerms(locale)?.[placeholder] || placeholder;
}

/**
 * Get a specific anatomy term for a gender and locale
 *
 * @param locale - Language code
 * @param gender - Player gender
 * @param placeholder - Specific anatomy placeholder to retrieve
 * @returns The anatomy term
 *
 * @example
 * ```typescript
 * const term = getAnatomyTerm('en', 'female', 'chest');
 * logger.debug(term); // 'breasts'
 * ```
 */
export function getAnatomyTerm(
  locale: string,
  gender: PlayerGender | undefined,
  placeholder: AnatomyPlaceholder
): string {
  const mapping = getAnatomyMappings(locale, gender);
  return mapping[placeholder];
}

/**
 * Placeholders whose term is worn rather than owned when a female dom penetrates:
 * the strapon replaces the genital, and its own tip replaces the clit.
 */
const STRAPON_TERM_KEYS: Partial<Record<AnatomyPlaceholder, string>> = {
  genital: 'strapon',
  tip: 'tip',
};

/**
 * Resolve an anatomy term for a player acting in a given role.
 * In penetrative contexts, female doms use strapons.
 *
 * @param placeholder - Anatomy placeholder to resolve
 * @param gender - Player gender
 * @param role - Role the player takes in this action
 * @param locale - Language code
 * @param isPenetrative - Whether the action penetrates (drives the strapon swap)
 * @returns Appropriate anatomy term
 *
 * @example
 * ```typescript
 * const term = getRoleAwareAnatomyTerm('genital', 'female', 'dom', 'en', true);
 * logger.debug(term); // 'strapon'
 * ```
 */
export function getRoleAwareAnatomyTerm(
  placeholder: AnatomyPlaceholder,
  gender: PlayerGender | undefined,
  role: PlayerRole | undefined,
  locale: string,
  isPenetrative: boolean
): string {
  const straponKey = STRAPON_TERM_KEYS[placeholder];

  // Female doms use a strapon only when the action is penetrative.
  if (straponKey && gender === 'female' && role === 'dom' && isPenetrative) {
    return i18next.t(`anatomy:straponTerms.${straponKey}`, { lng: locale });
  }

  return getAnatomyTerm(locale, gender, placeholder);
}

/**
 * Replace all anatomy placeholders in an action string
 *
 * @param action - Action text with placeholders
 * @param gender - Player gender
 * @param role - Player role
 * @param isPenetrative - Whether the action penetrates (drives the strapon swap)
 * @param locale - Language code
 * @returns Action text with placeholders replaced
 *
 * @example
 * ```typescript
 * const result = replaceAnatomyPlaceholders(
 *   'Touch your {genital} for 30 seconds.',
 *   'male',
 *   'sub',
 *   false,
 *   'en'
 * );
 * logger.debug(result); // 'Touch your dick for 30 seconds.'
 * ```
 */
export function replaceAnatomyPlaceholders(
  action: string,
  gender: PlayerGender | undefined,
  role: PlayerRole | undefined,
  isPenetrative: boolean,
  locale: string
): string {
  return action.replace(
    anatomyTokenPattern(),
    (match, placeholder: AnatomyPlaceholder, pipeTarget?: string) => {
      // This path knows one player: the reader. A pipe aimed at anyone else —
      // `|other`, or a `|dom`/`|sub` slot the reader does not fill — names
      // somebody whose body it cannot know, and answering with the reader's
      // anatomy would assert something false about them. The neutral term is
      // the only honest answer. (Local multiplayer resolves these against the
      // real roster before reaching here, so it never hits this branch.)
      const namesSomeoneElse =
        pipeTarget === 'other' ||
        ((pipeTarget === 'dom' || pipeTarget === 'sub') && pipeTarget !== role);
      if (namesSomeoneElse) return getGenericAnatomyTerm(locale, placeholder);

      return getRoleAwareAnatomyTerm(placeholder, gender, role, locale, isPenetrative) || match;
    }
  );
}

/**
 * Get list of all supported anatomy placeholders
 *
 * @returns Array of placeholder names
 */
export function getSupportedPlaceholders(): AnatomyPlaceholder[] {
  return [...ANATOMY_PLACEHOLDERS];
}

/**
 * Check if a string contains any anatomy placeholders
 *
 * @param text - Text to check
 * @returns True if text contains anatomy placeholders
 *
 * @example
 * ```typescript
 * hasAnatomyPlaceholders('Touch your {genital}.'); // true
 * hasAnatomyPlaceholders('Kiss {dom}.'); // false
 * ```
 */
export function hasAnatomyPlaceholders(text: string): boolean {
  return anatomyTokenPattern().test(text);
}
