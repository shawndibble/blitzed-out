/**
 * Anatomy Placeholder Service
 *
 * Provides gender-aware anatomy term mappings for inclusive action text.
 * Supports 5 languages: EN, ES, FR, ZH, HI
 *
 * @module anatomyPlaceholderService
 */

import type { PlayerGender, AnatomyPlaceholder } from '@/types/localPlayers';
import type { PlayerRole } from '@/types/Settings';

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
  'prefer-not-say': AnatomyMapping;
}

/**
 * All anatomy mappings organized by locale
 */
const anatomyMappings: Record<string, LocaleAnatomyMappings> = {
  en: {
    male: {
      genital: 'dick',
      hole: 'hole',
      chest: 'chest',
      pronoun_subject: 'he',
      pronoun_object: 'him',
      pronoun_possessive: 'his',
      pronoun_reflexive: 'himself',
    },
    female: {
      genital: 'pussy',
      hole: 'pussy',
      chest: 'breasts',
      pronoun_subject: 'she',
      pronoun_object: 'her',
      pronoun_possessive: 'her',
      pronoun_reflexive: 'herself',
    },
    'non-binary': {
      genital: 'genitals',
      hole: 'hole',
      chest: 'chest',
      pronoun_subject: 'they',
      pronoun_object: 'them',
      pronoun_possessive: 'their',
      pronoun_reflexive: 'themselves',
    },
    'prefer-not-say': {
      genital: 'genitals',
      hole: 'hole',
      chest: 'chest',
      pronoun_subject: 'they',
      pronoun_object: 'them',
      pronoun_possessive: 'their',
      pronoun_reflexive: 'themselves',
    },
  },
  es: {
    male: {
      genital: 'polla',
      hole: 'agujero',
      chest: 'pecho',
      pronoun_subject: 'él',
      pronoun_object: 'él',
      pronoun_possessive: 'su',
      pronoun_reflexive: 'sí mismo',
    },
    female: {
      genital: 'coño',
      hole: 'coño',
      chest: 'pechos',
      pronoun_subject: 'ella',
      pronoun_object: 'ella',
      pronoun_possessive: 'su',
      pronoun_reflexive: 'sí misma',
    },
    'non-binary': {
      genital: 'genitales',
      hole: 'agujero',
      chest: 'pecho',
      pronoun_subject: 'elle',
      pronoun_object: 'elle',
      pronoun_possessive: 'su',
      pronoun_reflexive: 'sí misme',
    },
    'prefer-not-say': {
      genital: 'genitales',
      hole: 'agujero',
      chest: 'pecho',
      pronoun_subject: 'elle',
      pronoun_object: 'elle',
      pronoun_possessive: 'su',
      pronoun_reflexive: 'sí misme',
    },
  },
  fr: {
    male: {
      genital: 'bite',
      hole: 'trou',
      chest: 'torse',
      pronoun_subject: 'il',
      pronoun_object: 'lui',
      pronoun_possessive: 'son',
      pronoun_reflexive: 'lui-même',
    },
    female: {
      genital: 'chatte',
      hole: 'chatte',
      chest: 'seins',
      pronoun_subject: 'elle',
      pronoun_object: 'elle',
      pronoun_possessive: 'sa',
      pronoun_reflexive: 'elle-même',
    },
    'non-binary': {
      genital: 'organes génitaux',
      hole: 'trou',
      chest: 'torse',
      pronoun_subject: 'iel',
      pronoun_object: 'iel',
      pronoun_possessive: 'son',
      pronoun_reflexive: 'soi-même',
    },
    'prefer-not-say': {
      genital: 'organes génitaux',
      hole: 'trou',
      chest: 'torse',
      pronoun_subject: 'iel',
      pronoun_object: 'iel',
      pronoun_possessive: 'son',
      pronoun_reflexive: 'soi-même',
    },
  },
  zh: {
    male: {
      genital: '鸡巴',
      hole: '洞',
      chest: '胸部',
      pronoun_subject: '他',
      pronoun_object: '他',
      pronoun_possessive: '他的',
      pronoun_reflexive: '他自己',
    },
    female: {
      genital: '阴道',
      hole: '阴道',
      chest: '乳房',
      pronoun_subject: '她',
      pronoun_object: '她',
      pronoun_possessive: '她的',
      pronoun_reflexive: '她自己',
    },
    'non-binary': {
      genital: '生殖器',
      hole: '洞',
      chest: '胸部',
      pronoun_subject: '他们',
      pronoun_object: '他们',
      pronoun_possessive: '他们的',
      pronoun_reflexive: '他们自己',
    },
    'prefer-not-say': {
      genital: '生殖器',
      hole: '洞',
      chest: '胸部',
      pronoun_subject: '他们',
      pronoun_object: '他们',
      pronoun_possessive: '他们的',
      pronoun_reflexive: '他们自己',
    },
  },
  hi: {
    male: {
      genital: 'लिंग',
      hole: 'छेद',
      chest: 'छाती',
      pronoun_subject: 'वह',
      pronoun_object: 'उसे',
      pronoun_possessive: 'उसका',
      pronoun_reflexive: 'खुद',
    },
    female: {
      genital: 'योनि',
      hole: 'योनि',
      chest: 'स्तन',
      pronoun_subject: 'वह',
      pronoun_object: 'उसे',
      pronoun_possessive: 'उसकी',
      pronoun_reflexive: 'खुद',
    },
    'non-binary': {
      genital: 'जननांग',
      hole: 'छेद',
      chest: 'छाती',
      pronoun_subject: 'वे',
      pronoun_object: 'उन्हें',
      pronoun_possessive: 'उनका',
      pronoun_reflexive: 'खुद',
    },
    'prefer-not-say': {
      genital: 'जननांग',
      hole: 'छेद',
      chest: 'छाती',
      pronoun_subject: 'वे',
      pronoun_object: 'उन्हें',
      pronoun_possessive: 'उनका',
      pronoun_reflexive: 'खुद',
    },
  },
};

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
  // Default to English if locale not found
  const localeData = anatomyMappings[locale] || anatomyMappings.en;

  // Default to prefer-not-say if gender not specified
  const genderKey = gender || 'prefer-not-say';

  return localeData[genderKey];
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
    const straponTerms: Record<string, string> = {
      en: 'strapon',
      es: 'arnés',
      fr: 'gode-ceinture',
      zh: '绑带假阳具',
      hi: 'स्ट्रैपआन',
    };
    return straponTerms[locale] || straponTerms.en;
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
