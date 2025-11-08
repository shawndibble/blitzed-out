import i18next from 'i18next';
import type { LocalPlayer } from '@/types/localPlayers';
import type { PlayerGender } from '@/types/localPlayers';
import { replaceAnatomyPlaceholders, getAnatomyMappings } from './anatomyPlaceholderService';

const { t } = i18next;

function capitalizeFirstLetterInCurlyBraces(string: string): string {
  return string.replace(/(?:^|\.\s|!\s)(\w)/g, (match) => match.toUpperCase());
}

/**
 * Randomly selects a player from the provided list that matches the required role
 * @param players - Array of local players to choose from
 * @param requiredRole - The role needed ('sub' or 'dom')
 * @param excludePlayerName - Player name to exclude from selection (to avoid duplicates)
 * @returns A random player name matching the role, or 'another player' if none found
 */
function selectRandomPlayerByRole(
  players: LocalPlayer[],
  requiredRole: 'sub' | 'dom',
  excludePlayerName?: string
): string {
  if (!players || players.length === 0) {
    return t('anotherPlayer');
  }

  // Filter players that can fulfill the required role and exclude current player
  const eligiblePlayers = players.filter((player) => {
    // Exclude the current player to avoid duplicates
    if (excludePlayerName && player.name === excludePlayerName) {
      return false;
    }

    if (requiredRole === 'sub') {
      return player.role === 'sub' || player.role === 'vers';
    } else if (requiredRole === 'dom') {
      return player.role === 'dom' || player.role === 'vers';
    }
    return false;
  });

  if (eligiblePlayers.length === 0) {
    return t('anotherPlayer');
  }

  // Randomly select from eligible players
  const randomIndex = Math.floor(Math.random() * eligiblePlayers.length);
  return eligiblePlayers[randomIndex].name;
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
    newAction = newAction.replace(/{player}/g, t('theCurrentPlayer'));
    newAction = newAction.replace(/{dom}/g, t('aDominant'));
    newAction = newAction.replace(/{sub}/g, t('aSubmissive'));

    // Replace anatomy placeholders with generic terms
    newAction = newAction.replace(/{genital}/g, 'genitals');
    newAction = newAction.replace(/{hole}/g, 'hole');
    newAction = newAction.replace(/{chest}/g, 'chest');
    newAction = newAction.replace(/{pronoun_subject}/g, 'they');
    newAction = newAction.replace(/{pronoun_object}/g, 'them');
    newAction = newAction.replace(/{pronoun_possessive}/g, 'their');
    newAction = newAction.replace(/{pronoun_reflexive}/g, 'themselves');

    return capitalizeFirstLetterInCurlyBraces(newAction);
  }

  if (localPlayers && localPlayers.length > 0) {
    // Local multiplayer mode: use role-based selection for all placeholders

    // Find current player to get their gender
    const currentPlayer = localPlayers.find((p) => p.name === displayName);
    const currentLocale = locale || i18next.language || 'en';

    // STEP 1: Handle contextual anatomy placeholders (e.g., "{dom}'s {genital}")
    // Replace anatomy placeholders that are associated with a specific role
    const contextualAnatomyPattern = /\{(dom|sub)\}'s \{(genital|hole|chest|pronoun_\w+)\}/g;
    newAction = newAction.replace(contextualAnatomyPattern, (match, roleType, anatomyType) => {
      const rolePlayer = localPlayers.find((p) => p.role === roleType);
      if (rolePlayer) {
        const anatomyMappings = getAnatomyMappings(currentLocale, rolePlayer.gender);
        const anatomyTerm = anatomyMappings[anatomyType as keyof typeof anatomyMappings];
        return `{${roleType}}'s ${anatomyTerm || anatomyType}`;
      }
      return match;
    });

    // STEP 2: Replace {player} with current player
    newAction = newAction.replace(/{player}/g, displayName);

    // STEP 3: Replace the current player's role with their name (if present)
    if (role === 'dom' && newAction.includes('{dom}')) {
      newAction = newAction.replace(/{dom}/, displayName);
    } else if (role === 'sub' && newAction.includes('{sub}')) {
      newAction = newAction.replace(/{sub}/, displayName);
    } else if (role === 'vers') {
      // For vers players, randomly choose which role they take if both are present
      const hasBothDomAndSub = newAction.includes('{dom}') && newAction.includes('{sub}');
      if (hasBothDomAndSub) {
        const shouldTakeDom = Math.random() < 0.5;
        if (shouldTakeDom && newAction.includes('{dom}')) {
          newAction = newAction.replace(/{dom}/, displayName);
        } else if (newAction.includes('{sub}')) {
          newAction = newAction.replace(/{sub}/, displayName);
        }
      } else if (newAction.includes('{dom}')) {
        newAction = newAction.replace(/{dom}/, displayName);
      } else if (newAction.includes('{sub}')) {
        newAction = newAction.replace(/{sub}/, displayName);
      }
    }

    // STEP 4: Replace any remaining {dom} and {sub} placeholders with other players (excluding current player)
    newAction = newAction.replace(/{dom}/g, () =>
      selectRandomPlayerByRole(localPlayers, 'dom', displayName)
    );
    newAction = newAction.replace(/{sub}/g, () =>
      selectRandomPlayerByRole(localPlayers, 'sub', displayName)
    );

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
    newAction = newAction.replace(/{(dom|sub)}/g, t('anotherPlayer'));

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
