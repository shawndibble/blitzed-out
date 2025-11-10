/**
 * Anatomy Filter Service
 *
 * Determines which action groups are compatible with a player's gender.
 * Filters out anatomy-specific action groups for players without the required anatomy.
 * All descriptions loaded from translation files (anatomy.json)
 */

import i18next from 'i18next';
import type { PlayerGender } from '@/types/localPlayers';
import type { AnatomyRequirement } from '@/types/customGroups';

/**
 * Check if a player's gender is compatible with an anatomy requirement
 *
 * @param gender - Player's gender
 * @param requirement - Action group's anatomy requirement
 * @returns True if player can perform actions in this group
 *
 * @example
 * ```typescript
 * isAnatomyCompatible('male', 'penis'); // true
 * isAnatomyCompatible('female', 'penis'); // false
 * isAnatomyCompatible('male', 'any'); // true
 * ```
 */
export function isAnatomyCompatible(
  gender: PlayerGender | undefined,
  requirement: AnatomyRequirement | undefined
): boolean {
  // If no requirement specified, it's universal
  if (!requirement || requirement === 'any' || requirement === 'anus') {
    return true;
  }

  // If gender not specified, default to allowing universal actions only
  if (!gender || gender === 'prefer-not-say') {
    // Only allow universal actions for unspecified gender
    return false; // Conservative - require gender for anatomy-specific actions
  }

  // Map genders to their compatible anatomy requirements
  const anatomyMap: Record<PlayerGender, AnatomyRequirement[]> = {
    male: ['any', 'penis', 'anus'],
    female: ['any', 'pussy', 'anus', 'breasts'],
    'non-binary': ['any', 'anus'], // Conservative default for non-binary
    'prefer-not-say': ['any', 'anus'], // Only universal actions
  };

  const compatibleAnatomies = anatomyMap[gender];
  return compatibleAnatomies.includes(requirement);
}

/**
 * Get a list of all supported anatomy requirements
 *
 * @returns Array of anatomy requirement values
 */
export function getSupportedAnatomyRequirements(): AnatomyRequirement[] {
  return ['any', 'penis', 'pussy', 'anus', 'breasts'];
}

/**
 * Get human-readable description of anatomy requirement
 * Loaded from translation files
 *
 * @param requirement - Anatomy requirement
 * @param locale - Language code (optional, defaults to current language)
 * @returns Description for UI display
 */
export function getAnatomyRequirementDescription(
  requirement: AnatomyRequirement,
  locale?: string
): string {
  const lng = locale || i18next.language || 'en';
  return i18next.t(`anatomy.anatomyRequirements.${requirement}`, { lng });
}

/**
 * Check if a player should see a specific action group
 * Combines anatomy compatibility with other filtering logic
 *
 * @param gender - Player's gender
 * @param requirement - Action group's anatomy requirement
 * @param showIncompatible - Whether to show incompatible groups (for advanced users)
 * @returns True if group should be visible to player
 */
export function shouldShowActionGroup(
  gender: PlayerGender | undefined,
  requirement: AnatomyRequirement | undefined,
  showIncompatible: boolean = false
): boolean {
  if (showIncompatible) {
    return true; // Show all groups in advanced mode
  }

  return isAnatomyCompatible(gender, requirement);
}

/**
 * Get incompatibility reason for display to user
 * Loaded from translation files
 *
 * @param gender - Player's gender
 * @param requirement - Action group's anatomy requirement
 * @param locale - Language code (optional, defaults to current language)
 * @returns Reason string for UI, or null if compatible
 */
export function getIncompatibilityReason(
  gender: PlayerGender | undefined,
  requirement: AnatomyRequirement | undefined,
  locale?: string
): string | null {
  if (isAnatomyCompatible(gender, requirement)) {
    return null; // Compatible
  }

  const lng = locale || i18next.language || 'en';

  if (!gender || gender === 'prefer-not-say') {
    return i18next.t('anatomy.incompatibilityReasons.requiresSpecificAnatomy', {
      lng,
      requirement,
    });
  }

  const reasonKey: Record<AnatomyRequirement, string | null> = {
    any: null,
    penis: 'requiresMaleAnatomy',
    pussy: 'requiresFemaleAnatomy',
    anus: null, // Universal, should never be incompatible
    breasts: 'requiresBreasts',
  };

  const key = reasonKey[requirement || 'any'];
  if (!key) {
    return null;
  }

  return i18next.t(`anatomy.incompatibilityReasons.${key}`, { lng });
}
