import i18next from 'i18next';
import type { LocalPlayer } from '@/types/localPlayers';
import type { PlayerGender } from '@/types/localPlayers';
import { replaceAnatomyPlaceholders, getAnatomyMappings } from './anatomyPlaceholderService';

const { t } = i18next;

const PLACEHOLDER_FALLBACKS = {
  player: () => t('theCurrentPlayer'),
  dom: () => t('aDominant'),
  sub: () => t('aSubmissive'),
  anotherPlayer: () => t('anotherPlayer'),
} as const;

/**
 * Load penetrative keywords from translation files
 */
function loadPenetrativeKeywords(locale: string): string[] {
  return i18next.t('anatomy.penetrativeKeywords', { lng: locale, returnObjects: true }) as string[];
}

/**
 * Load generic anatomy terms from translation files
 */
function loadGenericAnatomyTerms(locale: string): Record<string, string> {
  return i18next.t('anatomy.genericAnatomyTerms', { lng: locale, returnObjects: true }) as Record<
    string,
    string
  >;
}

/**
 * Detect if action text contains penetrative context
 * Uses localized keywords from translation files
 */
function isPenetrativeContext(action: string, locale: string): boolean {
  const lowerAction = action.toLowerCase();
  const keywords = loadPenetrativeKeywords(locale);
  return keywords.some((keyword) => lowerAction.includes(keyword));
}

function capitalizeFirstLetterInCurlyBraces(string: string): string {
  return string.replace(/(?:^|\.\s|!\s)(\w)/g, (match) => match.toUpperCase());
}

/**
 * Get anatomy term with context awareness (e.g., strapon for female doms in penetrative contexts)
 */
function getContextualAnatomyTerm(
  anatomyType: string,
  gender: PlayerGender | undefined,
  role: string | undefined,
  action: string,
  locale: string
): string {
  const anatomyMappings = getAnatomyMappings(locale, gender);
  let term = anatomyMappings[anatomyType as keyof typeof anatomyMappings] as string;

  // Use strapon for female doms in penetrative contexts
  if (
    anatomyType === 'genital' &&
    gender === 'female' &&
    role === 'dom' &&
    isPenetrativeContext(action, locale)
  ) {
    term = i18next.t('anatomy.straponTerms.strapon', { lng: locale });
  }

  return term || anatomyType;
}

/**
 * Replace generic anatomy placeholders with neutral terms
 * Used for GameBoard preview display
 */
function replaceGenericAnatomyPlaceholders(action: string, locale: string): string {
  let result = action;
  const genericTerms = loadGenericAnatomyTerms(locale);

  Object.entries(genericTerms).forEach(([placeholder, term]) => {
    result = result.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), term);
  });

  return result;
}

/**
 * Determine role assignments for local multiplayer
 * Handles vers players and role selection logic
 */
interface RoleAssignments {
  dom?: LocalPlayer;
  sub?: LocalPlayer;
}

function determineRoleAssignments(
  action: string,
  role: string,
  displayName: string,
  localPlayers: LocalPlayer[]
): RoleAssignments {
  const roleAssignments: RoleAssignments = {};
  const currentPlayer = localPlayers.find((p) => p.name === displayName);

  const needsDom = action.includes('{dom}');
  const needsSub = action.includes('{sub}');

  if (!needsDom && !needsSub) {
    return roleAssignments;
  }

  // Assign current player to a role
  if (role === 'dom' && needsDom) {
    roleAssignments.dom = currentPlayer;
  } else if (role === 'sub' && needsSub) {
    roleAssignments.sub = currentPlayer;
  } else if (role === 'vers' && currentPlayer) {
    // Vers player randomly chooses role
    if (needsDom && needsSub) {
      const shouldTakeDom = Math.random() < 0.5;
      if (shouldTakeDom) {
        roleAssignments.dom = currentPlayer;
      } else {
        roleAssignments.sub = currentPlayer;
      }
    } else if (needsDom) {
      roleAssignments.dom = currentPlayer;
    } else if (needsSub) {
      roleAssignments.sub = currentPlayer;
    }
  }

  // Fill remaining roles with other players
  if (needsDom && !roleAssignments.dom) {
    const domPlayer =
      localPlayers.find((p) => p.role === 'dom' && p.name !== displayName) ||
      localPlayers.find((p) => p.role === 'vers' && p.name !== displayName);
    if (domPlayer) roleAssignments.dom = domPlayer;
  }

  if (needsSub && !roleAssignments.sub) {
    const subPlayer =
      localPlayers.find((p) => p.role === 'sub' && p.name !== displayName) ||
      localPlayers.find(
        (p) => p.role === 'vers' && p.name !== displayName && p !== roleAssignments.dom
      );
    if (subPlayer) roleAssignments.sub = subPlayer;
  }

  return roleAssignments;
}

/**
 * Replace piped anatomy placeholders like {genital|dom} or {hole|other}
 */
function replacePipedAnatomyPlaceholders(
  action: string,
  displayName: string,
  localPlayers: LocalPlayer[],
  roleAssignments: RoleAssignments,
  locale: string
): string {
  const currentPlayer = localPlayers.find((p) => p.name === displayName);
  const genericTerms = loadGenericAnatomyTerms(locale);

  const pipedAnatomyPattern = /\{(genital|hole|chest|pronoun_\w+)\|(dom|sub|other|self)\}/g;

  return action.replace(pipedAnatomyPattern, (_match, anatomyType, targetRole) => {
    let targetPlayer: LocalPlayer | undefined;

    if (targetRole === 'self') {
      targetPlayer = currentPlayer;
    } else if (targetRole === 'other') {
      const otherPlayers = localPlayers.filter((p) => p.name !== displayName);
      if (otherPlayers.length > 0) {
        targetPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
      }
    } else {
      targetPlayer = roleAssignments[targetRole as 'dom' | 'sub'];
    }

    if (targetPlayer) {
      return getContextualAnatomyTerm(
        anatomyType,
        targetPlayer.gender,
        targetPlayer.role,
        action,
        locale
      );
    }

    return genericTerms[anatomyType] || anatomyType;
  });
}

/**
 * Replace contextual anatomy placeholders like {dom}'s {genital}
 */
function replaceContextualAnatomyPlaceholders(
  action: string,
  roleAssignments: RoleAssignments,
  locale: string
): string {
  const contextualAnatomyPattern = /\{(dom|sub)\}'s \{(genital|hole|chest|pronoun_\w+)\}/g;

  return action.replace(contextualAnatomyPattern, (match, roleType, anatomyType) => {
    const rolePlayer = roleAssignments[roleType as 'dom' | 'sub'];
    if (rolePlayer) {
      const anatomyTerm = getContextualAnatomyTerm(
        anatomyType,
        rolePlayer.gender,
        rolePlayer.role,
        action,
        locale
      );
      return `{${roleType}}'s ${anatomyTerm}`;
    }
    return match;
  });
}

/**
 * Replace role placeholders with player names
 */
function replaceRolePlaceholders(
  action: string,
  displayName: string,
  roleAssignments: RoleAssignments
): string {
  let result = action;

  // Replace {player} with current player
  result = result.replace(/{player}/g, displayName);

  // Replace role placeholders with assigned player names
  if (roleAssignments.dom) {
    result = result.replace(/{dom}/g, roleAssignments.dom.name);
  }
  if (roleAssignments.sub) {
    result = result.replace(/{sub}/g, roleAssignments.sub.name);
  }

  return result;
}

/**
 * Handle local multiplayer mode placeholder replacement
 */
function replaceLocalMultiplayerPlaceholders(
  action: string,
  role: string,
  displayName: string,
  localPlayers: LocalPlayer[],
  locale: string
): string {
  let result = action;
  const currentPlayer = localPlayers.find((p) => p.name === displayName);

  // Determine role assignments
  const roleAssignments = determineRoleAssignments(action, role, displayName, localPlayers);

  // Replace piped anatomy placeholders {anatomy|role}
  result = replacePipedAnatomyPlaceholders(
    result,
    displayName,
    localPlayers,
    roleAssignments,
    locale
  );

  // Replace contextual anatomy placeholders {role}'s {anatomy}
  result = replaceContextualAnatomyPlaceholders(result, roleAssignments, locale);

  // Replace role placeholders with player names
  result = replaceRolePlaceholders(result, displayName, roleAssignments);

  // Replace remaining anatomy placeholders based on current player's gender
  if (currentPlayer) {
    result = replaceAnatomyPlaceholders(result, currentPlayer.gender, currentPlayer.role, locale);
  }

  return result;
}

/**
 * Replace player name in non-local modes
 */
function replaceWithPlayerName(string: string, role: string, displayName: string): string {
  const chance = Math.random();
  const hasBothDomAndSub = string.includes('{dom}') && string.includes('{sub}');
  const isVers = role === 'vers';

  function shouldReplace(match: string): boolean {
    if (match === '{player}') return true;

    const isDomOrSub = match === '{dom}' || match === '{sub}';
    if (!isVers && match === `{${role}}`) return true;
    if (!hasBothDomAndSub && isVers && isDomOrSub) return true;

    if (hasBothDomAndSub && isVers) {
      const isDomMatchWithChance = match === '{dom}' && chance < 0.5;
      const isSubMatchWithChance = match === '{sub}' && chance >= 0.5;
      return isDomMatchWithChance || isSubMatchWithChance;
    }

    return false;
  }

  return string.replace(/{(player|dom|sub)}/g, (match) =>
    shouldReplace(match) ? displayName : match
  );
}

/**
 * Handle non-local mode placeholder replacement
 */
function replaceNonLocalPlaceholders(
  action: string,
  role: string,
  displayName: string,
  currentPlayerGender: PlayerGender | undefined,
  locale: string
): string {
  let result = action;

  // First pass: replace player-specific placeholders with display name
  result = replaceWithPlayerName(action, role, displayName);

  // Check if the player's name was successfully inserted
  const hasPlayerName = result.includes(displayName);

  // For non-switch roles, if no placeholders were replaced, ensure at least one is
  if (!hasPlayerName && role !== 'vers' && (result.includes('{dom}') || result.includes('{sub}'))) {
    const playerRolePattern = new RegExp(`\\{${role}\\}`);
    if (result.match(playerRolePattern)) {
      result = result.replace(playerRolePattern, displayName);
    } else {
      result = result.replace(/{(dom|sub)}/, displayName);
    }
  }

  // Replace any remaining role placeholders with "another player"
  result = result.replace(/{(dom|sub)}/g, PLACEHOLDER_FALLBACKS.anotherPlayer());

  // Replace anatomy placeholders based on current player's gender
  const validRole = role === 'sub' || role === 'dom' || role === 'vers' ? role : undefined;
  result = replaceAnatomyPlaceholders(result, currentPlayerGender, validRole, locale);

  return result;
}

/**
 * Main function to replace all placeholders in action strings
 * Supports local multiplayer, remote multiplayer, and solo modes
 */
export default function actionStringReplacement(
  action: string,
  role: string,
  displayName: string,
  localPlayers?: LocalPlayer[],
  useGenericPlaceholders?: boolean,
  currentPlayerGender?: PlayerGender,
  locale?: string
): string {
  const currentLocale = locale || i18next.language || 'en';
  let result = action;

  // Use generic placeholders for GameBoard display
  if (useGenericPlaceholders) {
    result = result.replace(/{player}/g, PLACEHOLDER_FALLBACKS.player());
    result = result.replace(/{dom}/g, PLACEHOLDER_FALLBACKS.dom());
    result = result.replace(/{sub}/g, PLACEHOLDER_FALLBACKS.sub());
    result = replaceGenericAnatomyPlaceholders(result, currentLocale);
    return capitalizeFirstLetterInCurlyBraces(result);
  }

  // Local multiplayer mode
  if (localPlayers && localPlayers.length > 0) {
    result = replaceLocalMultiplayerPlaceholders(
      action,
      role,
      displayName,
      localPlayers,
      currentLocale
    );
  } else {
    // Non-local modes (remote multiplayer or solo)
    result = replaceNonLocalPlaceholders(
      action,
      role,
      displayName,
      currentPlayerGender,
      currentLocale
    );
  }

  return capitalizeFirstLetterInCurlyBraces(result);
}
