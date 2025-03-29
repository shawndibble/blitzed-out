import { shuffleArray, cycleArray } from '@/helpers/arrays';
import { CustomTilePull } from '@/types/customTiles';
import { TileExport } from '@/types/gameBoard';
import i18next from 'i18next';

interface GameSettings {
  [key: string]: any;
  role?: string;
  difficulty?: string;
  finishRange?: [number, number];
}

interface ActionObject {
  label: string;
  actions: Record<string, string[]>;
  [key: string]: any;
}

interface ActionFolder {
  [key: string]: ActionObject;
}

interface GameTile {
  title: string;
  description: string;
  standalone?: boolean;
  role?: string;
}

interface ActionCategory {
  label: string;
  actions: Record<string, string[]>;
  key: string;
  standalone: boolean;
  role?: string;
  frequency?: number;
}

const { t } = i18next;

// Some actions are only for a dom or sub. Ensure we don't get the wrong role action.
function playerRoleFiltering(actions: string[], role: string): string[] {
  // filter should remove an action if it has only a single role in curly braces and that role doesn't match the user's role.
  // Filter should keep action if it has both {dom} and {sub} regardless of role. It should keep the action if it has {player}, regardless of role.
  return actions.filter((action) => {
    if (role === 'vers') {
      return (action.includes('{sub}') && action.includes('{dom}')) || action.includes('{player}');
    }

    return !action.match(/{(dom|sub)}/) || action.includes(`{${role}}`);
  });
}

function restrictSubsetActions(
  settings: GameSettings,
  settingsKey: string,
  actionObject: Record<string, string[]>
): Record<string, string[]> {
  const role = settings[settingsKey]?.role ?? settings.role ?? 'sub';

  const newList = Object.keys(actionObject).reduce<Record<string, string[]>>((acc, key, index) => {
    if (index > 0 && index <= settings[settingsKey]?.level) {
      acc[key] = shuffleArray(playerRoleFiltering(actionObject[key], role));
    }
    return acc;
  }, {});
  return newList;
}

// Restricts the categories/major actions based on user selections
function restrictActionsToUserSelections(
  actionsFolder: ActionFolder,
  settings: GameSettings
): ActionCategory[] {
  return Object.entries(actionsFolder)
    .filter(([actionKey]) => settings[actionKey]?.level > 0)
    .map(([actionKey, actionObject]) => ({
      label: actionObject.label,
      actions: restrictSubsetActions(settings, actionKey, actionObject?.actions),
      key: actionKey, // Key value used for categories prior to translation.
      standalone: false, // Determines if it will append to another category or stand on its own.
      role: settings[actionKey]?.role ?? settings.role ?? 'sub',
    }));
}

// Adds custom tiles to the action list
function addInCustomTiles(
  newActionList: ActionCategory[],
  userCustomTiles: CustomTilePull[]
): ActionCategory[] {
  if (!userCustomTiles.length) {
    return newActionList;
  }

  if (userCustomTiles.some(({ group }) => group === 'misc')) {
    // Add an empty array of misc actions.
    newActionList.push({
      label: t('misc'),
      actions: { All: [] },
      key: 'misc',
      standalone: false, // Determines if it will append to another category or stand on its own.
    });
  }

  // Push custom tiles to the front of the list if applicable
  userCustomTiles.forEach(({ group, intensity, action }) => {
    const actionList = newActionList.find((object) => object.key === group);
    if (actionList && Object.keys(actionList.actions).length >= intensity) {
      const actions = Object.values(actionList.actions)[intensity - 1];
      if (actions) {
        const randomIndex = Math.floor(Math.random() * (actions.length + 1));
        actions.splice(randomIndex, 0, action);
      }
    }
  });

  return newActionList;
}

// From settings, grab the options the user selected for appending.
function getUserAppendSelections(settings: GameSettings): Record<string, any> {
  return Object.entries(settings).reduce<Record<string, any>>((acc, [key, value]) => {
    if (value?.variation) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

// Separates the append options from rest of our categories/action items
function separateAppendOptions(
  appendOptions: Record<string, any>,
  listWithMisc: ActionCategory[]
): { appendList: ActionCategory[]; listWithoutAppend: ActionCategory[] } {
  const appendList: ActionCategory[] = [];
  const listWithoutAppend = [...listWithMisc];

  Object.entries(appendOptions).forEach(([key, { level, variation }]) => {
    if (level <= 0) return;

    const categoryIndex = listWithMisc.findIndex((item) => item.key === key);
    if (categoryIndex === -1) return;

    if (variation === 'standalone') {
      listWithoutAppend[categoryIndex].standalone = true;
      return;
    }

    const frequency = variation === 'appendSome' ? 0.4 : 0.9;
    appendList.push({ ...listWithMisc[categoryIndex], frequency });
    listWithoutAppend.splice(categoryIndex, 1);
  });

  return { appendList, listWithoutAppend };
}

function calculateIntensity(
  gameSize: number,
  userSelectionMax: number,
  currentTile: number,
  difficulty?: string
): number {
  // for normal, we break the game up evenly, based on user's max intensity level.
  if ([undefined, 'normal'].includes(difficulty)) {
    const divider = gameSize / userSelectionMax;
    return Math.floor(currentTile / divider);
  }

  // Accelerated difficulty:

  // We don't have enough options for accelerated at 3+, so mix it up.
  if (userSelectionMax >= 3) {
    // give it a 40% chance of picking a lower intensity.
    if (Math.random() >= 0.6) {
      return userSelectionMax - 2;
    }
  }
  return userSelectionMax - 1;
}

// Gets the current tile for the board
function getCurrentTile(
  listWithMisc: ActionCategory[],
  size: number,
  currentTile: number,
  settings: GameSettings
): GameTile {
  cycleArray(listWithMisc);

  const { actions, label, standalone, frequency, role } = listWithMisc[0];

  // If we have a frequency percentage, then we are appending.
  // Use that number to determine if we append or not.
  const randomNumber = Math.random();
  if (frequency && frequency <= randomNumber) {
    return { title: '', description: '' };
  }

  const catKeys = Object.keys(actions);
  const catActions = Object.values(actions);

  let intensity = calculateIntensity(size, catKeys.length, currentTile, settings?.difficulty);

  // if we go too high with our math, back down 1.
  if (!catActions[intensity]) {
    intensity = Math.max(0, intensity - 1);
  }

  if (catActions[intensity] && catActions[intensity].length > 0) {
    cycleArray(catActions[intensity]);

    return {
      title: label,
      description: catActions[intensity][0],
      standalone,
      role,
    };
  }

  return { title: '', description: '' };
}

// Builds the board based on user settings
function buildBoard(
  listWithMisc: ActionCategory[],
  settings: GameSettings,
  size: number
): GameTile[] {
  const appendOptions = getUserAppendSelections(settings);
  const { listWithoutAppend, appendList } = separateAppendOptions(appendOptions, listWithMisc);
  const board: GameTile[] = [];

  for (let currentTile = 1; currentTile <= size; currentTile += 1) {
    const { title, description, standalone, role } = getCurrentTile(
      listWithoutAppend,
      size,
      currentTile,
      settings
    );
    let finalDescription = '';

    if (!standalone && appendList.length && description) {
      const { description: appendDescription } = getCurrentTile(
        appendList,
        size,
        currentTile,
        settings
      );

      if (appendDescription) {
        const ensurePunctuation = appendDescription.trim().replace(/([^.,!?])$/, '$1.');
        finalDescription = `${ensurePunctuation} ${description}`;
      } else {
        finalDescription = description;
      }
    } else {
      finalDescription = description || '';
    }

    board.push({ title, description: finalDescription.trim(), role });
  }

  return board;
}

function addStartAndFinishTiles(shuffledTiles: GameTile[], settings: GameSettings): GameTile[] {
  const startTile: GameTile = { title: t('start'), description: t('start') };

  const { finishRange = [33, 66] } = settings;
  const finishDescription =
    `${t('noCum')} ${finishRange[0]}%` +
    `\r\n${t('ruined')} ${finishRange[1] - finishRange[0]}%` +
    `\r\n${t('cum')} ${100 - finishRange[1]}%`;
  const finishTile: GameTile = { title: t('finish'), description: finishDescription };

  return [startTile, ...shuffledTiles, finishTile];
}

// Customizes the board based on user settings
// Starts here as this is the only export.
export default function customizeBoard(
  settings: GameSettings,
  actionsFolder: ActionFolder,
  userCustomTiles: CustomTilePull[] = [],
  size = 40
): TileExport[] {
  // Create a deep copy of the actionsFolder structure but with empty actions
  const emptyActionsFolder = Object.entries(actionsFolder).reduce<ActionFolder>(
    (acc, [key, value]) => {
      acc[key] = {
        ...value,
        actions: Object.keys(value.actions || {}).reduce<Record<string, string[]>>(
          (actionsAcc, actionKey) => {
            actionsAcc[actionKey] = [];
            return actionsAcc;
          },
          {}
        ),
      };
      return acc;
    },
    {}
  );

  const newActionList = restrictActionsToUserSelections(emptyActionsFolder, settings);

  if (!newActionList.length && !userCustomTiles.length) {
    // if we have no action list and no custom tiles, then clear local storage and reload.
    localStorage.clear();
    window.location.reload();
  }

  const listWithMisc = addInCustomTiles(newActionList, userCustomTiles);
  const usersBoard = buildBoard(listWithMisc, settings, size - 2);

  return addStartAndFinishTiles(usersBoard, settings);
}
