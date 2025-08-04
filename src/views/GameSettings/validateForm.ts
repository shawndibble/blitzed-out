import { isOnlineMode, isPublicRoom } from '@/helpers/strings';
import { Settings } from '@/types/Settings';

interface ActionOption {
  levels?: number[];
  variation?: string;
  type?: string;
}

interface ActionOptions {
  [key: string]: ActionOption;
}

interface SeparatedOptions {
  withAppend: ActionOptions;
  withoutAppend: ActionOptions;
}

const hasValidLevels = ({ levels }: ActionOption): boolean =>
  !!levels?.length && levels.some((level) => level > 0);

function hasSomethingPicked(object: ActionOptions): boolean {
  return Object.values(object).some(hasValidLevels);
}

function separateConsumableFromValidRest(
  gameOptions: Settings,
  actionsList: Record<string, any>
): SeparatedOptions {
  const selectedActions = gameOptions.selectedActions || {};

  return Object.entries(selectedActions).reduce(
    (acc: SeparatedOptions, [key, value]: [string, any]) => {
      if (key in actionsList) {
        const target = value?.variation?.startsWith('append') ? 'withAppend' : 'withoutAppend';
        acc[target][key] = value;
      }
      return acc;
    },
    { withAppend: {}, withoutAppend: {} }
  );
}

function isTryingToAppend(withAppend: ActionOptions): boolean {
  return Object.keys(withAppend).length > 0 && Object.values(withAppend).some(hasValidLevels);
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
