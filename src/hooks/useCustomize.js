import alcohol from '../data/alcohol.json';
import ballBusting from '../data/ballBusting.json';
import buttPlay from '../data/buttPlay.json';
import throatTraining from '../data/throatTraining.json';
import titTorture from '../data/titTorture.json';

export const dataFolder = {
    alcohol,
    ballBusting,
    buttPlay,
    throatTraining,
    titTorture
}

export function getSettings() {
    return localStorage.getItem('gameSettings')
    ? JSON.parse(localStorage.getItem('gameSettings'))
    : Object.keys(dataFolder()).reduce((obj, entry) => ({...obj, [entry]: 0}), {});;
}

export function setSettings(settings) {
    return localStorage.setItem('gameSettings', JSON.stringify(settings));
}

export function customizeBoard() {
    
}