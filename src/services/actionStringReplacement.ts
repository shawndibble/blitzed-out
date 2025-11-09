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

const GENERIC_ANATOMY_TERMS = {
  genital: 'genitals',
  hole: 'hole',
  chest: 'chest',
  pronoun_subject: 'they',
  pronoun_object: 'them',
  pronoun_possessive: 'their',
  pronoun_reflexive: 'themselves',
} as const;

/**
 * Keywords that indicate penetrative sexual context
 * Used to determine when to use "strapon" for female doms
 */
const PENETRATIVE_KEYWORDS = [
  'deep',
  'throat',
  'penetrate',
  'inside',
  'enters',
  'pushes into',
  'slides in',
  'fills',
  'stretches',
  'takes',
  'rides',
  'bounces on',
  'impales',
];

/**
 * Detect if action text contains penetrative context
 */
function isPenetrativeContext(action: string): boolean {
  const lowerAction = action.toLowerCase();
  return PENETRATIVE_KEYWORDS.some((keyword) => lowerAction.includes(keyword));
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
    isPenetrativeContext(action)
  ) {
    term = 'strapon';
  }

  return term || anatomyType;
}

/**
 * Replace generic anatomy placeholders with neutral terms
 * Used for GameBoard preview display
 */
function replaceGenericAnatomyPlaceholders(action: string): string {
  let result = action;

  Object.entries(GENERIC_ANATOMY_TERMS).forEach(([placeholder, term]) => {
    result = result.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), term);
  });

  return result;
}

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

export default function actionStringReplacement(
  action: string,
  role: string,
  displayName: string,
  localPlayers?: LocalPlayer[],
  useGenericPlaceholders?: boolean,
  currentPlayerGender?: PlayerGender,
  locale?: string
): string {
  let newAction = action;

  // Use generic placeholders for GameBoard display
  if (useGenericPlaceholders) {
    newAction = newAction.replace(/{player}/g, PLACEHOLDER_FALLBACKS.player());
    newAction = newAction.replace(/{dom}/g, PLACEHOLDER_FALLBACKS.dom());
    newAction = newAction.replace(/{sub}/g, PLACEHOLDER_FALLBACKS.sub());

    // Replace anatomy placeholders with generic terms
    newAction = replaceGenericAnatomyPlaceholders(newAction);

    return capitalizeFirstLetterInCurlyBraces(newAction);
  }

  if (localPlayers && localPlayers.length > 0) {
    // Local multiplayer mode: use role-based selection for all placeholders

    // Find current player to get their gender
    const currentPlayer = localPlayers.find((p) => p.name === displayName);
    const currentLocale = locale || i18next.language || 'en';

    // STEP -1: Determine role assignments for this action
    // Create a map of which player is playing which role (handles vers players)
    const roleAssignments: { dom?: LocalPlayer; sub?: LocalPlayer } = {};

    // Check if action needs dom and/or sub roles
    const needsDom = newAction.includes('{dom}');
    const needsSub = newAction.includes('{sub}');

    if (needsDom || needsSub) {
      // First, check if current player takes a role
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
        // Look for a dom player, or any vers player
        const domPlayer =
          localPlayers.find((p) => p.role === 'dom' && p.name !== displayName) ||
          localPlayers.find((p) => p.role === 'vers' && p.name !== displayName);
        if (domPlayer) roleAssignments.dom = domPlayer;
      }

      if (needsSub && !roleAssignments.sub) {
        // Look for a sub player, or any vers player not already assigned
        const subPlayer =
          localPlayers.find((p) => p.role === 'sub' && p.name !== displayName) ||
          localPlayers.find(
            (p) => p.role === 'vers' && p.name !== displayName && p !== roleAssignments.dom
          );
        if (subPlayer) roleAssignments.sub = subPlayer;
      }
    }

    // STEP 0: Handle new pipe syntax {anatomy|role} (e.g., "{genital|dom}", "{hole|other}")
    const pipedAnatomyPattern = /\{(genital|hole|chest|pronoun_\w+)\|(dom|sub|other|self)\}/g;
    newAction = newAction.replace(pipedAnatomyPattern, (_match, anatomyType, targetRole) => {
      let targetPlayer: LocalPlayer | undefined;

      if (targetRole === 'self') {
        targetPlayer = currentPlayer;
      } else if (targetRole === 'other') {
        // Select random player who is NOT the current player
        const otherPlayers = localPlayers.filter((p) => p.name !== displayName);
        if (otherPlayers.length > 0) {
          // Randomly select from other players (can be any gender)
          targetPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
        }
      } else {
        // targetRole is 'dom' or 'sub' - use role assignments
        targetPlayer = roleAssignments[targetRole as 'dom' | 'sub'];
      }

      if (targetPlayer) {
        return getContextualAnatomyTerm(
          anatomyType,
          targetPlayer.gender,
          targetPlayer.role,
          newAction,
          currentLocale
        );
      }

      // Fallback to generic term
      return (
        GENERIC_ANATOMY_TERMS[anatomyType as keyof typeof GENERIC_ANATOMY_TERMS] || anatomyType
      );
    });

    // STEP 1: Handle contextual anatomy placeholders (e.g., "{dom}'s {genital}")
    // Replace anatomy placeholders that are associated with a specific role
    const contextualAnatomyPattern = /\{(dom|sub)\}'s \{(genital|hole|chest|pronoun_\w+)\}/g;
    newAction = newAction.replace(contextualAnatomyPattern, (match, roleType, anatomyType) => {
      // Use role assignments instead of looking for player by role
      const rolePlayer = roleAssignments[roleType as 'dom' | 'sub'];
      if (rolePlayer) {
        const anatomyTerm = getContextualAnatomyTerm(
          anatomyType,
          rolePlayer.gender,
          rolePlayer.role,
          newAction,
          currentLocale
        );
        return `{${roleType}}'s ${anatomyTerm}`;
      }
      return match;
    });

    // STEP 2: Replace {player} with current player
    newAction = newAction.replace(/{player}/g, displayName);

    // STEP 3: Replace role placeholders with assigned player names
    if (roleAssignments.dom) {
      newAction = newAction.replace(/{dom}/g, roleAssignments.dom.name);
    }
    if (roleAssignments.sub) {
      newAction = newAction.replace(/{sub}/g, roleAssignments.sub.name);
    }

    // STEP 5: Replace remaining anatomy placeholders based on current player's gender
    if (currentPlayer) {
      newAction = replaceAnatomyPlaceholders(
        newAction,
        currentPlayer.gender,
        currentPlayer.role,
        currentLocale
      );
    }
  } else {
    // Non-local modes: use original logic
    // First pass: replace player-specific placeholders with display name
    newAction = replaceWithPlayerName(action, role, displayName);

    // Check if the player's name was successfully inserted
    const hasPlayerName = newAction.includes(displayName);

    // For non-switch roles, if no placeholders were replaced, ensure at least one is
    // Switch role (vers) has its own random logic that we should respect
    if (
      !hasPlayerName &&
      role !== 'vers' &&
      (newAction.includes('{dom}') || newAction.includes('{sub}'))
    ) {
      // Replace the player's matching role first, or the first occurrence if their role isn't present
      const playerRolePattern = new RegExp(`\\{${role}\\}`);
      if (newAction.match(playerRolePattern)) {
        newAction = newAction.replace(playerRolePattern, displayName);
      } else {
        // If player's specific role isn't in the action, replace the first occurrence
        newAction = newAction.replace(/{(dom|sub)}/, displayName);
      }
    }

    // Replace any remaining role placeholders with "another player"
    newAction = newAction.replace(/{(dom|sub)}/g, PLACEHOLDER_FALLBACKS.anotherPlayer());

    // Replace anatomy placeholders based on current player's gender (online/solo mode)
    const currentLocale = locale || i18next.language || 'en';
    const validRole = role === 'sub' || role === 'dom' || role === 'vers' ? role : undefined;
    newAction = replaceAnatomyPlaceholders(
      newAction,
      currentPlayerGender,
      validRole,
      currentLocale
    );
  }

  // capitalize the first letter or the first letter after a period if immediately proceeded by a curly brace.
  return capitalizeFirstLetterInCurlyBraces(newAction);
}
