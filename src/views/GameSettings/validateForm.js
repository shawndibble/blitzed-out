import { isOnlineMode, isPublicRoom } from '@/helpers/strings';
import { Settings } from '@/types/Settings';

interface ActionOption {
  level: number;
  variation?: string;
}

interface ActionOptions {
  [key: string]: ActionOption;
}

interface SeparatedOptions {
  withAppend: ActionOptions;
  withoutAppend: ActionOptions;
}

function hasSomethingPicked(object: ActionOptions): boolean {
  return Object.values(object).some(({ level }) => level > 0);
}

function separateConsumableFromValidRest(
  gameOptions: Settings, 
  actionsList: Record<string, any>
): SeparatedOptions {
  return Object.entries(gameOptions).reduce(
    (acc: SeparatedOptions, [key, value]: [string, any]) => {
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

function isTryingToAppend(withAppend: ActionOptions): boolean {
  return Object.keys(withAppend).length > 0 && Object.values(withAppend).some(({ level }) => level > 0);
}

// returns a translation key for an alert if fails.
export default function validateFormData(
  gameOptions: Settings, 
  actionsList: Record<string, any>
): string | null {
  const { withAppend, withoutAppend } = separateConsumableFromValidRest(gameOptions, actionsList);

  if (!hasSomethingPicked(withoutAppend)) {
    return isTryingToAppend(withAppend) ? 'appendWithAction' : 'pickSomething';
  }

  if (isPublicRoom(gameOptions.room) && !isOnlineMode(gameOptions.gameMode)) {
    return 'privateRequired';
  }

  return null;
}
