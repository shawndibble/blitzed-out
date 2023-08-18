import { useEffect, useState } from 'react';
import { sendMessage } from 'services/firebase';
import { useTranslation } from 'react-i18next';
import useAuth from './useAuth';
import useLocalStorage from './useLocalStorage';
import usePlayerList from './usePlayerList';

export default function usePlayerMove(room, rollValue) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const playerList = usePlayerList(room)[0];
  const gameBoard = useLocalStorage('customBoard')[0];
  const total = gameBoard.length;
  const [tile, setTile] = useState(gameBoard[0]);
  const lastTile = total - 1;

  function parseDescription(text) {
    const textArray = text?.split('%');
    // if we have %, we are on the finish tile. Let's get a random result.
    if (textArray?.length > 1) {
      const finishVals = textArray.filter((n) => n).map((line) => line.split(': '));

      // process weighted random finish result.
      const weightedArray = [];
      finishVals.forEach((val, index) => {
        const clone = Array(val[1]).fill(index);
        weightedArray.push(...clone);
      });

      const result = weightedArray[Math.floor(Math.random() * weightedArray.length)];

      return finishVals.map(([action]) => action)[result]?.replace(/(\r\n|\n|\r)/gm, '');
    }

    return text;
  }

  function handleTextOutput(newTile, rollNumber, newLocation, preMessage) {
    let message = '';
    const description = parseDescription(newTile?.description);
    if (rollNumber !== -1) {
      message += `${t('roll')}: ${rollNumber}  \r\n`;
    }
    message += `#${newLocation + 1}: ${newTile?.title}  \r\n`;
    message += `${t('action')}: ${description}`;
    sendMessage({
      room,
      user,
      text: preMessage ? preMessage + message : message,
      type: 'actions',
    });
  }

  // Grab the new location.
  // In some instances, we also want to add a message with said location.
  function getNewLocation(rollNumber) {
    // -1 is used to resart the game.
    if (rollNumber === -1) {
      return {
        preMessage: `${t('restartingGame')}  \r\n`,
        newLocation: 0,
      };
    }

    const currentLocation = playerList.find((p) => p.isSelf).location;

    // restart game if we roll and are on the last tile..
    if (currentLocation === lastTile) {
      return {
        preMessage: `${t('alreadyFinished')}  \r\n`,
        newLocation: rollNumber,
      };
    }

    const newLocation = rollNumber + currentLocation;
    // If we would move past finish, move to finish instead.
    if (newLocation >= lastTile) {
      return { newLocation: lastTile };
    }
    return { newLocation };
  }

  useEffect(() => {
    const rollNumber = rollValue[0] ?? rollValue;

    // a 0 means something went wrong. Give up.
    if (rollNumber === 0) return;

    const { preMessage, newLocation } = getNewLocation(rollNumber);

    // update our tile that we will return.
    if (tile?.description !== gameBoard[newLocation]) setTile(gameBoard[newLocation]);

    // send our message.
    handleTextOutput(gameBoard[newLocation], rollNumber, newLocation, preMessage);

    // eslint-disable-next-line
  }, [rollValue]);

  return { tile, playerList };
}
