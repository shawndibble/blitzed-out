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
  if (userSelection === 2) {
    if ([1, 2].includes(currentLevel)) return 1;
    if ([3, 4].includes(currentLevel)) return 2;
  }

  return Math.min(currentLevel, userSelection);
}

function getCurrentLevel(currentTile, brackets) {
  let total = 0;
  for (let bracketLevel = 0; bracketLevel < brackets.length; bracketLevel += 1) {
    total += brackets[bracketLevel];
    if (total > currentTile) {
      return bracketLevel + 1;
    }
  }
  return brackets.length;
}

function getAppendItem(appendList, currentOption, currentLevel, customDataFolder) {
  const appendData = appendList[currentOption];
  if (!appendData) return '';
  const [maxLevel, appendType] = appendData.split('|');
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
    return [0, 0, 0, availableTiles];
  }
  // normal, split the tiles evenly.
  return [...Array(4)].map(() => Math.ceil(availableTiles / 4));
}

function createCustomDataFolder(actionsFolder, userCustomTiles) {
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

  return customDataFolder;
}

function getSelectedOptions(customDataFolder, tileOptions, hasMiscTiles) {
  const selectedOptions = Object.keys(customDataFolder).filter((type) => tileOptions[type] > 0);

  if (hasMiscTiles) {
    selectedOptions.push(MISC);
  }

  return selectedOptions;
}

function createCustomBoard(
  size,
  selectedOptions,
  appendOptions,
  customDataFolder,
  tileOptions,
  levelBrackets,
  appendList,
) {
  const tiles = [...Array(size - 2).keys()];

  return tiles.map((_, tileIndex) => {
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
}

function addStartAndFinishTiles(shuffledTiles, settings) {
  const { t } = i18next;
  shuffledTiles.unshift({ title: t('start'), description: t('start') });

  const { finishRange } = settings;
  const finishDescription = `${t('noCum')} ${finishRange[0]}% \r\n${t('ruined')} ${finishRange[1] - finishRange[0]}% \r\n${t('cum')} ${100 - finishRange[1]}%`;
  shuffledTiles.push({ title: t('finish'), description: finishDescription });
}

export default function customizeBoard(
  settings,
  actionsFolder,
  userCustomTiles = [],
  size = 40,
) {
  const hasMiscTiles = userCustomTiles.find(({ group }) => pascalToCamel(group) === MISC);

  const customDataFolder = createCustomDataFolder(actionsFolder, userCustomTiles);

  const { tileOptions, appendList } = separateUserLists(customDataFolder, hasMiscTiles, settings);

  const selectedOptions = getSelectedOptions(customDataFolder, tileOptions, hasMiscTiles);
  const appendOptions = Object.keys(appendList);

  const levelBrackets = calculateLevelBrackets(size, settings.difficulty);

  const customTiles = createCustomBoard(
    size,
    selectedOptions,
    appendOptions,
    customDataFolder,
    tileOptions,
    levelBrackets,
    appendList,
  );

  const shuffledTiles = shuffleArrayBy(customTiles, 'currentLevel') || [];

  addStartAndFinishTiles(shuffledTiles, settings);

  return shuffledTiles;
}
