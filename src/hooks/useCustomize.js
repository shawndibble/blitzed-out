import alcohol from '../data/alcohol.json';
import ballBusting from '../data/ballBusting.json';
import buttPlay from '../data/buttPlay.json';
import throatTraining from '../data/throatTraining.json';
import titTorture from '../data/titTorture.json';
import { shuffleArrayBy } from '../helpers/arrays';
import { camelToPascal } from '../helpers/strings';

export const dataFolder = {
    alcohol,
    ballBusting,
    buttPlay,
    throatTraining,
    titTorture
}

export function customizeBoard(settings, size = 40) {
    const { ...tileOptions } = settings;

    // remove 2 tiles for start/finish
    const tiles = [...Array(size - 2).keys()];
    const tilesPerLevel = (size - 2) / 4;
    const levelBrackets = [...Array(4).keys()].map(val => (val + 1) * tilesPerLevel);
    
    // all the options where the user picked higher than 0.
    const selectedOptions = Object.keys(dataFolder).filter( type => tileOptions[type] > 0 );

    const customTiles = tiles.map((_, tileIndex) => {
        cycleList(selectedOptions);

        const currentOption = selectedOptions[0];

        if (!currentOption) return {};

        const currentList = Object.values(dataFolder[currentOption]);
        const currentLevel = getCurrentLevel(tileIndex, levelBrackets);
        const intensity = getIntensity(tileOptions[currentOption], currentLevel);
        const currentActivityList = currentList[intensity];

        const description = currentActivityList[0];
        cycleList(currentActivityList);

        return {
            title: camelToPascal(currentOption),
            description,
            currentLevel,
        }
    });

    const shuffledTiles = shuffleArrayBy(customTiles, 'currentLevel') || [];

    shuffledTiles.unshift({ title: '', description: 'START' });
    shuffledTiles.push({ title: '', description: 'FINISH' });

    return shuffledTiles;
}

function cycleList(list) {
    if (list.length > 1) list.push(list.shift());
}

function getIntensity(userSelection, currentLevel) {
    // If the user picked intensity 2, then split intensity 1 on the first 2 rows and intensity 2 on the last 2 rows.
    if ([1,2].includes(currentLevel) && userSelection === 2) {
        return 1;
    } else if ([3,4].includes(currentLevel) && userSelection === 2) {
        return 2;
    } 

    // as long as our gameRow hasn't reached the user selection, we will go off the row intensity first.
    if (currentLevel <= userSelection ) { 
        return currentLevel;
    }

    // We have a selection lower than the row we are on (1 or 3 selected but row is higher), return selection difficulty.
    return userSelection;
}

function getCurrentLevel(currentTile, brackets) {
    let level = 1;
    brackets.forEach(bracketMax => currentTile > bracketMax ? level++ : null );
    return level;
}