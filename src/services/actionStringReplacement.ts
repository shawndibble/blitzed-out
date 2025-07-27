import i18next from 'i18next';

const { t } = i18next;

function capitalizeFirstLetterInCurlyBraces(string: string): string {
  return string.replace(/(?:^|\.\s|!\s)(\w)/g, (match) => match.toUpperCase());
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
  displayName: string
): string {
  // First pass: replace player-specific placeholders with display name
  let newAction = replaceWithPlayerName(action, role, displayName);

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

  // capitalize the first letter or the first letter after a period if immediately proceeded by a curly brace.
  return capitalizeFirstLetterInCurlyBraces(newAction);
}
