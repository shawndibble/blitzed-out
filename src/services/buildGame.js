import { shuffleArray, cycleArray } from 'helpers/arrays';
import i18next from 'i18next';

const { t } = i18next;

// sometimes our category subset has a role subset, need to merge those.
function flattenActionsByRole(actions, role) {
  if (role === 'sub' && actions.sub) return actions.sub;
  if (role === 'dom' && actions.dom) return actions.dom;
  if (role === 'vers' && actions.sub && actions.dom) {
    return [...actions.sub, ...actions.dom];
  }
  return actions;
}

function restrictSubsetActions(settings, settingsKey, actionObject) {
  const role = settings[`${settingsKey}role`] ?? settings.role ?? 'sub';

  const newList = Object.keys(actionObject).reduce((acc, key, index) => {
    if (index > 0 && index <= settings[settingsKey]) {
      acc[key] = shuffleArray(flattenActionsByRole(actionObject[key], role));
    }
    return acc;
  }, {});
  return newList;
}

// Restricts the categories/major actions based on user selections
function restrictActionsToUserSelections(actionsFolder, settings) {
  return Object.entries(actionsFolder)
    .filter(([actionKey]) => settings[actionKey] > 0)
    .map(([actionKey, actionObject]) => ({
      label: actionObject.label,
      actions: restrictSubsetActions(
        settings,
        actionKey,
        actionObject?.actions
      ),
      key: actionKey, // Key value used for categories prior to translation.
      standalone: false, // Determines if it will append to another category or stand on its own.
    }));
}

// Adds custom tiles to the action list
function addInCustomTiles(newActionList, userCustomTiles) {
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
      Object.values(actionList.actions)[intensity - 1].unshift(action);
    }
  });

  return newActionList;
}

// From settings, grab the options the user selected for appending.
function getUserAppendSelections(settings) {
  // If the setting key contains the string 'Variation', grab the key and value.
  return Object.entries(settings)
    .filter(([key]) => key.includes('Variation'))
    .reduce((acc, [key, value]) => {
      // Remove the Variation value, so we can use that to check the corresponding intensity
      const correspondingKey = key.replace('Variation', '');
      if (settings[correspondingKey] > 0) {
        acc.push({ key: correspondingKey, value });
      }
      return acc;
    }, []);
}

// Separates the append options from rest of our categories/action items
function separateAppendOptions(appendOptions, listWithMisc) {
  const appendList = [];
  const listWithoutAppend = [...listWithMisc];

  appendOptions.forEach(({ key, value }) => {
    const categoryIndex = listWithMisc.findIndex((item) => item.key === key);
    if (value === 'standalone') {
      listWithoutAppend[categoryIndex].standalone = true;
      return;
    }

    const frequency = value === 'appendSome' ? 0.4 : 0.9;
    appendList.push({ ...listWithMisc[categoryIndex], frequency });
    listWithoutAppend.splice(categoryIndex, 1);
  });

  return { appendList, listWithoutAppend };
}

function calculateIntensity(
  gameSize,
  userSelectionMax,
  currentTile,
  difficulty
) {
  // for normal, we break the game up evenly, based on user's max intensity level.
  if (difficulty === 'normal') {
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
function getCurrentTile(listWithMisc, size, currentTile, settings) {
  cycleArray(listWithMisc);

  const { actions, label, standalone, frequency } = listWithMisc[0];

  // If we have a frequency percentage, then we are appending.
  // Use that number to determine if we append or not.
  const randomNumber = Math.random();
  if (frequency && frequency <= randomNumber) {
    return { description: '' };
  }

  const catKeys = Object.keys(actions);
  const catActions = Object.values(actions);

  let intensity = calculateIntensity(
    size,
    catKeys.length,
    currentTile,
    settings?.difficulty
  );

  // if we go too high with our math, back down 1.
  if (!catActions[intensity]) {
    intensity -= 1;
  }

  cycleArray(catActions[intensity]);

  console.log(catActions, intensity);

  return { title: label, description: catActions[intensity][0], standalone };
}

// Builds the board based on user settings
function buildBoard(listWithMisc, settings, size) {
  const appendOptions = getUserAppendSelections(settings);
  const { listWithoutAppend, appendList } = separateAppendOptions(
    appendOptions,
    listWithMisc
  );
  const board = [];

  for (let currentTile = 1; currentTile <= size; currentTile += 1) {
    const { title, description, standalone } = getCurrentTile(
      listWithoutAppend,
      size,
      currentTile,
      settings
    );
    let finalDescription = '';

    if (!standalone && appendList.length) {
      const { description: appendDescription } = getCurrentTile(
        appendList,
        size,
        currentTile,
        settings
      );
      finalDescription = `${appendDescription} ${description}`;
    } else {
      finalDescription = description;
    }

    board.push({ title, description: finalDescription.trim() });
  }

  return board;
}

function addStartAndFinishTiles(shuffledTiles, settings) {
  const startTile = { title: t('start'), description: t('start') };

  const { finishRange } = settings;
  const finishDescription =
    `${t('noCum')} ${finishRange[0]}%` +
    `\r\n${t('ruined')} ${finishRange[1] - finishRange[0]}%` +
    `\r\n${t('cum')} ${100 - finishRange[1]}%`;
  const finishTile = { title: t('finish'), description: finishDescription };

  return [startTile, ...shuffledTiles, finishTile];
}

// Customizes the board based on user settings
// Starts here as this is the only export.
export default function customizeBoard(
  settings,
  actionsFolder,
  userCustomTiles = [],
  size = 40
) {
  const newActionList = restrictActionsToUserSelections(
    actionsFolder,
    settings
  );

  const listWithMisc = addInCustomTiles(newActionList, userCustomTiles);
  const usersBoard = buildBoard(listWithMisc, settings, size - 2);

  return addStartAndFinishTiles(usersBoard, settings);
}
