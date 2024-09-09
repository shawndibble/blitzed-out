import { isPublicRoom } from 'helpers/strings';

function hasSomethingPicked(object) {
  return Object.values(object).some(({ level }) => level > 0);
}

function separateConsumableFromValidRest(gameOptions, actionsList) {
  return Object.entries(gameOptions).reduce(
    (acc, [key, value]) => {
      // Check if the key is in actionsList
      if (key in actionsList) {
        if (value?.variation?.startsWith('append')) {
          // If variation starts with "append", add to withAppend
          acc.withAppend[key] = value;
        } else {
          // Otherwise, add to withoutAppend
          acc.withoutAppend[key] = value;
        }
      }
      return acc;
    },
    { withAppend: {}, withoutAppend: {} }
  );
}

function isTryingToAppend(withAppend) {
  return Object.keys(withAppend).length && Object.values(withAppend).some(({ level }) => level > 0);
}

// returns a translation key for an alert if fails.
export default function validateFormData(gameOptions, actionsList) {
  const { withAppend, withoutAppend } = separateConsumableFromValidRest(gameOptions, actionsList);

  if (!hasSomethingPicked(withoutAppend)) {
    return isTryingToAppend(withAppend) ? 'appendWithAction' : 'pickSomething';
  }

  if (isPublicRoom(gameOptions.room) && gameOptions.gameMode === 'local') {
    return 'privateRequired';
  }

  return null;
}
