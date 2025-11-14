/**
 * Anatomy Placeholder Service
 *
 * Provides gender-aware anatomy term mappings for inclusive action text.
 * Supports 5 languages: EN, ES, FR, ZH, HI
 * All mappings are loaded from translation files (anatomy.json)
 *
 * @module anatomyPlaceholderService
 */

import type { AnatomyPlaceholder, PlayerGender } from '@/types/localPlayers';

import type { PlayerRole } from '@/types/Settings';
import i18next from 'i18next';

/**
 * Anatomy term mapping for a specific gender
 */
export interface AnatomyMapping {
  genital: string;
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
 * console.log(mapping.genital); // 'dick'
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
    console.warn(`No anatomy mapping found for locale: ${locale}, gender: ${genderKey}`);
    const genericTerms = i18next.t('anatomy:genericAnatomyTerms', {
      lng: locale,
      returnObjects: true,
    }) as AnatomyMapping;

    return genericTerms;
  }

  return mapping;
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
 * console.log(term); // 'breasts'
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
 * Special handling for female dom with genital placeholder
 * In penetrative contexts, female doms use strapons
 *
 * @param gender - Player gender
 * @param role - Player role
 * @param locale - Language code
 * @returns Appropriate genital term
 *
 * @example
 * ```typescript
 * const term = getGenitalTermForRole('female', 'dom', 'en');
 * console.log(term); // 'strapon'
 * ```
 */
export function getGenitalTermForRole(
  gender: PlayerGender | undefined,
  role: PlayerRole | undefined,
  locale: string
): string {
  // Special case: female dom uses strapon in penetrative contexts
  if (gender === 'female' && role === 'dom') {
    const straponTerm = i18next.t('anatomy:straponTerms.strapon', { lng: locale });
    return straponTerm;
  }

  // Standard genital term
  return getAnatomyTerm(locale, gender, 'genital');
}

/**
 * Replace all anatomy placeholders in an action string
 *
 * @param action - Action text with placeholders
 * @param gender - Player gender
 * @param role - Player role
 * @param locale - Language code
 * @returns Action text with placeholders replaced
 *
 * @example
 * ```typescript
 * const result = replaceAnatomyPlaceholders(
 *   'Touch your {genital} for 30 seconds.',
 *   'male',
 *   'sub',
 *   'en'
 * );
 * console.log(result); // 'Touch your dick for 30 seconds.'
 * ```
 */
export function replaceAnatomyPlaceholders(
  action: string,
  gender: PlayerGender | undefined,
  role: PlayerRole | undefined,
  locale: string
): string {
  const mappings = getAnatomyMappings(locale, gender);
  let result = action;

  // Special handling for {genital} based on role
  if (result.includes('{genital}')) {
    const genitalTerm = getGenitalTermForRole(gender, role, locale);
    result = result.replace(/{genital}/g, genitalTerm);
  }

  // Replace all anatomy and pronoun placeholders using a single pattern
  const placeholderMap: Record<string, string> = {
    hole: mappings.hole,
    chest: mappings.chest,
    pronoun_subject: mappings.pronoun_subject,
    pronoun_object: mappings.pronoun_object,
    pronoun_possessive: mappings.pronoun_possessive,
    pronoun_reflexive: mappings.pronoun_reflexive,
  };

  result = result.replace(
    /{(hole|chest|pronoun_subject|pronoun_object|pronoun_possessive|pronoun_reflexive)}/g,
    (_, placeholder) => placeholderMap[placeholder] || placeholder
  );

  return result;
}

/**
 * Get list of all supported anatomy placeholders
 *
 * @returns Array of placeholder names
 */
export function getSupportedPlaceholders(): AnatomyPlaceholder[] {
  return [
    'genital',
    'hole',
    'chest',
    'pronoun_subject',
    'pronoun_object',
    'pronoun_possessive',
    'pronoun_reflexive',
  ];
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
  const placeholderPattern =
    /{(genital|hole|chest|pronoun_subject|pronoun_object|pronoun_possessive|pronoun_reflexive)}/;
  return placeholderPattern.test(text);
}
