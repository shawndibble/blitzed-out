import i18next from 'i18next';

const { t } = i18next;

function capitalizeFirstLetterInCurlyBraces(string) {
  return string.replace(/(?<=^|\.\s|!\s)(\w)/g, (match) => match.toUpperCase());
}

function replaceWithPlayerName(string, role, displayName) {
  const chance = Math.random();
  return string.replace(/{(player|dom|sub)}/g, (match) => {
    if (match === '{player}') {
      return displayName;
    }
    if ((match === '{dom}' && role === 'dom') || (match === '{sub}' && role === 'sub')) {
      return displayName;
    }
    if (match === '{dom}' && role === 'vers' && chance < 0.5) {
      return displayName;
    } if (match === '{sub}' && role === 'vers' && chance >= 0.5) {
      return displayName;
    }
    return match;
  });

}

export default function actionStringReplacement(action, role, displayName) {
  const newAction = replaceWithPlayerName(action, role, displayName)
    .replace(/{(dom|sub)}/g, t('anotherPlayer'));

  // capitalize the first letter or the first letter after a period if immediately proceeded by a curly brace.
  return capitalizeFirstLetterInCurlyBraces(newAction);
}