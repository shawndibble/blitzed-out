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
  const newAction = replaceWithPlayerName(action, role, displayName).replace(
    /{(dom|sub)}/g,
    t('anotherPlayer')
  );

  // capitalize the first letter or the first letter after a period if immediately proceeded by a curly brace.
  return capitalizeFirstLetterInCurlyBraces(newAction);
}
