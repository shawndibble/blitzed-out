import i18next from 'i18next';
import shuffleArrayBy from 'helpers/arrays';
import { pascalToCamel } from 'helpers/strings';
import groupActionsFolder from 'helpers/actionsFolder';

const MISC = 'miscellaneous';

function cycleList(list) {
  if (list.length > 1) list.push(list.shift());
}

function getIntensity(userSelection, currentLevel) {
  // If the user picked intensity 2, then split intensity half and half
  // and intensity 2 on the last 2 rows.
  if ([1, 2].includes(currentLevel) && userSelection === 2) {
    return 1;
  } if ([3, 4].includes(currentLevel) && userSelection === 2) {
    return 2;
  }

  // as long as our gameRow hasn't reached the user selection,
  // we will go off the row intensity first.
  if (currentLevel <= userSelection) {
    return currentLevel;
  }

  // We have a selection lower than the row we are on (1 or 3 selected but row is higher),
  // return selection difficulty.
  return userSelection;
}

function getCurrentLevel(currentTile, brackets) {
  let total = 0;
  let bracketLevel = 0;
  while (total < currentTile) {
    total += brackets[bracketLevel];
    bracketLevel += 1;
  }
  return bracketLevel;
}

function getAppendItem(appendList, currentOption, currentLevel, customDataFolder) {
  if (!Object.keys(appendList).length) return '';

  const [maxLevel, appendType] = appendList[currentOption].split('|');
  const chance = Math.random();

  // have a chance of not appending. Some = 60/40. Most = 85/15.
  if (appendType.endsWith('Some') && chance < 0.4) return '';
  if (appendType.endsWith('Most') && chance < 0.15) return '';

  const intensity = getIntensity(maxLevel, currentLevel);
  const currentAppendList = Object.values(customDataFolder[currentOption]?.actions)[intensity];

  if (!currentAppendList?.length) return '';

  cycleList(currentAppendList);

  return `${currentAppendList[0]} `;
}

function separateUserLists(customDataFolder, hasMiscTiles, settings) {
  const {
    alcoholVariation,
    poppersVariation,
    alcohol: alcoholSettings,
    poppers: poppersSetting,
    ...otherSettings
  } = settings;

  // grab user tile options but limit them to the customDataFolder options.
  // (ignore all other settings)
  const tileOptions = {};
  Object.entries(otherSettings).forEach(([key, value]) => {
    if (Object.keys(customDataFolder).includes(key)) {
      tileOptions[key] = value;
    }
  });

  if (hasMiscTiles) {
    tileOptions[MISC] = 1;
  }

  // If they are standalone tiles, then put them back in the rotation,
  // otherwise add them to the append list
  const appendList = {};

  if (!alcoholVariation?.startsWith('append')) {
    tileOptions.alcohol = alcoholSettings;
  } else {
    appendList.alcohol = `${alcoholSettings}|${alcoholVariation}`;
  }

  if (!poppersVariation?.startsWith('append')) {
    tileOptions.poppers = poppersSetting;
  } else {
    appendList.poppers = `${poppersSetting}|${poppersVariation}`;
  }

  return { tileOptions, appendList };
}

function calculateLevelBrackets(size, difficulty) {
  const availableTiles = size - 2; // remove start and finish.
  if (difficulty === 'accelerated') {
    return [
      Math.ceil(availableTiles * 0.1),
      Math.ceil(availableTiles * 0.1),
      Math.ceil(availableTiles * 0.1),
      Math.ceil(availableTiles * 0.7),
    ];
  }
  // normal, split the tiles evenly.
  return [...Array(4)].map(() => Math.ceil(availableTiles / 4));
}

export default function customizeBoard(
  settings,
  actionsFolder,
  userCustomTiles = [],
  size = 40,
) {
  const hasMiscTiles = userCustomTiles.find(({ group }) => pascalToCamel(group) === MISC);

  // clone the actionsFolder then add our custom tiles.
  const customDataFolder = {
    ...actionsFolder,
    [MISC]: {
      label: MISC.charAt(0).toUpperCase() + MISC.slice(1),
      actions: { None: [], All: [] },
    },
  };

  const mappedActionsFolder = groupActionsFolder(actionsFolder);

  userCustomTiles.forEach(({ group, intensity, action }) => {
    const tranIntensity = mappedActionsFolder
      .find((data) => data.value === group && data.intensity === Number(intensity))
      ?.translatedIntensity;
    customDataFolder[group]?.actions?.[tranIntensity]?.unshift(action);
  });

  const { tileOptions, appendList } = separateUserLists(customDataFolder, hasMiscTiles, settings);

  // remove 2 tiles for start/finish
  const tiles = [...Array(size - 2).keys()];

  // Set our brackets for when we use different intensities
  const levelBrackets = calculateLevelBrackets(size, settings.difficulty);

  // all the options where the user picked higher than 0.
  const selectedOptions = Object.keys(customDataFolder).filter((type) => tileOptions[type] > 0);
  const appendOptions = Object.keys(appendList);

  // if we have a misc custom tile, add that to the selected options.
  if (hasMiscTiles) {
    selectedOptions.push(MISC);
  }

  const customTiles = tiles.map((_, tileIndex) => {
    cycleList(selectedOptions);
    cycleList(appendOptions);
    const currentAppend = appendOptions[0];
    const currentOption = selectedOptions[0];

    if (!currentOption) return {};

    const currentList = Object.values(customDataFolder[currentOption]?.actions);
    const currentLevel = getCurrentLevel(tileIndex, levelBrackets);
    const intensity = getIntensity(tileOptions[currentOption], currentLevel);
    const currentActivityList = currentList[intensity];
    const appendItem = getAppendItem(appendList, currentAppend, currentLevel, customDataFolder);

    const description = ['poppers', 'alcohol'].includes(currentOption)
      ? currentActivityList[0]
      : appendItem + currentActivityList[0];
    cycleList(currentActivityList);

    return {
      title: customDataFolder[currentOption].label,
      description,
      currentLevel,
    };
  });

  const shuffledTiles = shuffleArrayBy(customTiles, 'currentLevel') || [];

  const { t } = i18next;
  shuffledTiles.unshift({ title: t('start'), description: t('start') });

  const { finishRange } = settings;
  const finishDescription = `${t('noCum')} ${finishRange[0]}% \r\n${t('ruined')} ${finishRange[1] - finishRange[0]}% \r\n${t('cum')} ${100 - finishRange[1]}%`;
  shuffledTiles.push({ title: t('finish'), description: finishDescription });

  return shuffledTiles;
}
