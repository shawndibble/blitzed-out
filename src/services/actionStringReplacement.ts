import i18next from 'i18next';
import { chance, nextRandom, randomOf } from '@/services/random';
import type { LocalPlayer } from '@/types/localPlayers';
import type { PlayerGender } from '@/types/localPlayers';
import {
  replaceAnatomyPlaceholders,
  getRoleAwareAnatomyTerm,
  getGenericAnatomyTerms,
  anatomyTokenPattern,
  ANATOMY_TOKEN_ALTERNATION,
} from './anatomyPlaceholderService';
import type { AnatomyPlaceholder } from '@/types/localPlayers';
import type { PlayerRole } from '@/types/Settings';

const { t } = i18next;

const PLACEHOLDER_FALLBACKS = {
  player: () => t('theCurrentPlayer'),
  dom: () => t('aDominant'),
  sub: () => t('aSubmissive'),
  anotherPlayer: () => t('anotherPlayer'),
} as const;

function capitalizeFirstLetterInCurlyBraces(string: string): string {
  return string.replace(/(?:^|\.\s|!\s)(\w)/g, (match) => match.toUpperCase());
}

/**
 * `{genital|dom}` — an anatomy token aimed at a specific player.
 * `{dom}'s {genital}` — the possessive form, where the owning role precedes.
 * Both derive their token list from anatomyPlaceholderService so a new token
 * needs no edit here.
 */
const pipedAnatomyPattern = new RegExp(
  `\\{(${ANATOMY_TOKEN_ALTERNATION})\\|(dom|sub|other|self)\\}`,
  'g'
);
const contextualAnatomyPattern = new RegExp(
  `\\{(dom|sub)\\}'s \\{(${ANATOMY_TOKEN_ALTERNATION})\\}`,
  'g'
);

/**
 * Replace generic anatomy placeholders with neutral terms
 * Used for GameBoard preview display
 */
function replaceGenericAnatomyPlaceholders(action: string, locale: string): string {
  const genericTerms = getGenericAnatomyTerms(locale);

  // Piped tokens resolve here too: the board preview has no players to aim a
  // `|dom` at, and leaving it unmatched would print the raw token on the tile.
  return action.replace(
    anatomyTokenPattern(),
    (match, placeholder: AnatomyPlaceholder) => genericTerms[placeholder] || match
  );
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
      // Coin-flip by design (CONTEXT.md): a vers player takes either role.
      const shouldTakeDom = chance();
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
  isPenetrative: boolean,
  locale: string
): string {
  const currentPlayer = localPlayers.find((p) => p.name === displayName);
  const genericTerms = getGenericAnatomyTerms(locale);

  return action.replace(pipedAnatomyPattern, (_match, anatomyType, targetRole) => {
    let targetPlayer: LocalPlayer | undefined;
    // A |dom or |sub pipe names the slot the player fills in this action; the
    // player's configured role only stands in when the pipe doesn't name one.
    let slotRole: PlayerRole | undefined;

    if (targetRole === 'self') {
      targetPlayer = currentPlayer;
    } else if (targetRole === 'other') {
      const otherPlayers = localPlayers.filter((p) => p.name !== displayName);
      if (otherPlayers.length > 0) {
        targetPlayer = randomOf(otherPlayers) ?? targetPlayer;
      }
    } else {
      targetPlayer = roleAssignments[targetRole as 'dom' | 'sub'];
      slotRole = targetRole as PlayerRole;
    }

    if (targetPlayer) {
      return getRoleAwareAnatomyTerm(
        anatomyType as AnatomyPlaceholder,
        targetPlayer.gender,
        slotRole ?? targetPlayer.role,
        locale,
        isPenetrative
      );
    }

    return genericTerms[anatomyType as AnatomyPlaceholder] || anatomyType;
  });
}

/**
 * Replace contextual anatomy placeholders like {dom}'s {genital}
 */
function replaceContextualAnatomyPlaceholders(
  action: string,
  roleAssignments: RoleAssignments,
  isPenetrative: boolean,
  locale: string
): string {
  return action.replace(contextualAnatomyPattern, (match, roleType, anatomyType) => {
    const rolePlayer = roleAssignments[roleType as 'dom' | 'sub'];
    if (rolePlayer) {
      // roleType, not rolePlayer.role: a vers player cast as {dom} straps on.
      const anatomyTerm = getRoleAwareAnatomyTerm(
        anatomyType as AnatomyPlaceholder,
        rolePlayer.gender,
        roleType as PlayerRole,
        locale,
        isPenetrative
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
  isPenetrative: boolean,
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
    isPenetrative,
    locale
  );

  // Replace contextual anatomy placeholders {role}'s {anatomy}
  result = replaceContextualAnatomyPlaceholders(result, roleAssignments, isPenetrative, locale);

  // Replace role placeholders with player names
  result = replaceRolePlaceholders(result, displayName, roleAssignments);

  // Replace remaining anatomy placeholders based on current player's gender
  if (currentPlayer) {
    result = replaceAnatomyPlaceholders(
      result,
      currentPlayer.gender,
      currentPlayer.role,
      isPenetrative,
      locale
    );
  }

  return result;
}

/**
 * Replace player name in non-local modes
 */
function replaceWithPlayerName(string: string, role: string, displayName: string): string {
  const hasBothDomAndSub = string.includes('{dom}') && string.includes('{sub}');
  const isVers = role === 'vers';

  // Drawn lazily and once: an action with no vers coin-flip to make must not
  // consume randomness, or every caller's draw sequence shifts under it.
  let coin: number | undefined;
  const versCoin = (): number => (coin ??= nextRandom());

  function shouldReplace(match: string): boolean {
    if (match === '{player}') return true;

    const isDomOrSub = match === '{dom}' || match === '{sub}';
    if (!isVers && match === `{${role}}`) return true;
    if (!hasBothDomAndSub && isVers && isDomOrSub) return true;

    if (hasBothDomAndSub && isVers) {
      const isDomMatchWithChance = match === '{dom}' && versCoin() < 0.5;
      const isSubMatchWithChance = match === '{sub}' && versCoin() >= 0.5;
      return isDomMatchWithChance || isSubMatchWithChance;
    }

    return false;
  }

  return string.replace(/{(player|dom|sub)}/g, (match) =>
    shouldReplace(match) ? displayName : match
  );
}

/**
 * Work out which role slot the current player took, given the action before and
 * after name substitution. Non-vers players take their own role; a vers player's
 * slot is whichever token the coin flip consumed.
 */
function inferSlotRole(action: string, result: string, role: string): PlayerRole | undefined {
  if (role === 'dom' || role === 'sub') return role;
  if (role !== 'vers') return undefined;

  const tookDom = action.includes('{dom}') && !result.includes('{dom}');
  const tookSub = action.includes('{sub}') && !result.includes('{sub}');
  if (tookDom && !tookSub) return 'dom';
  if (tookSub && !tookDom) return 'sub';
  return undefined;
}

/**
 * Handle non-local mode placeholder replacement
 */
function replaceNonLocalPlaceholders(
  action: string,
  role: string,
  displayName: string,
  currentPlayerGender: PlayerGender | undefined,
  isPenetrative: boolean,
  locale: string
): string {
  // First pass: replace player-specific placeholders with display name
  let result = replaceWithPlayerName(action, role, displayName);

  // Which slot the player ended up in — a vers player's coin flip is only
  // observable as the token that vanished, and the strapon rule keys off the
  // slot, not the configured role.
  const slotRole = inferSlotRole(action, result, role);

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
  result = replaceAnatomyPlaceholders(result, currentPlayerGender, slotRole, isPenetrative, locale);

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
  locale?: string,
  penetrative?: boolean
): string {
  const currentLocale = locale || i18next.language || 'en';
  // Strapon substitution is a default-content feature: default tiles are tagged
  // `penetrative` at import. Custom/unknown tiles never auto-strap (authors write
  // "strapon" themselves), so an absent flag means non-penetrative.
  const isPenetrative = penetrative ?? false;
  let result = action;

  // Use generic placeholders for GameBoard display
  if (useGenericPlaceholders) {
    result = result.replace(/{player}/g, PLACEHOLDER_FALLBACKS.player());
    result = result.replace(/{dom}/g, PLACEHOLDER_FALLBACKS.dom());
    result = result.replace(/{sub}/g, PLACEHOLDER_FALLBACKS.sub());

    if (currentPlayerGender) {
      const validRole = role === 'sub' || role === 'dom' || role === 'vers' ? role : undefined;
      result = replaceAnatomyPlaceholders(
        result,
        currentPlayerGender,
        validRole,
        isPenetrative,
        currentLocale
      );
    } else {
      result = replaceGenericAnatomyPlaceholders(result, currentLocale);
    }

    return capitalizeFirstLetterInCurlyBraces(result);
  }

  // Local multiplayer mode
  if (localPlayers && localPlayers.length > 0) {
    result = replaceLocalMultiplayerPlaceholders(
      action,
      role,
      displayName,
      localPlayers,
      isPenetrative,
      currentLocale
    );
  } else {
    // Non-local modes (remote multiplayer or solo)
    result = replaceNonLocalPlaceholders(
      action,
      role,
      displayName,
      currentPlayerGender,
      isPenetrative,
      currentLocale
    );
  }

  return capitalizeFirstLetterInCurlyBraces(result);
}
