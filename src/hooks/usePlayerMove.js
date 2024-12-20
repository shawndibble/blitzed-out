import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sendMessage } from '@/services/firebase';
import useAuth from '@/context/hooks/useAuth';
import actionStringReplacement from '@/services/actionStringReplacement';
import usePlayerList from './usePlayerList';

function getFinishResult(textArray) {
  // if we have %, we are on the finish tile. Let's get a random result.
  const finishValues = textArray.filter((n) => n).map((line) => line.split(': '));

  // process weighted random finish result.
  const weightedArray = [];
  finishValues.forEach((val, index) => {
    if (Number(val[1]) === 0) return;
    const clone = Array(Number(val[1])).fill(index);
    weightedArray.push(...clone);
  });

  const result = weightedArray[Math.floor(Math.random() * weightedArray.length)];

  return finishValues.map(([action]) => action)[result]?.replace(/(\r\n|\n|\r)/gm, '');
}

function parseDescription(text, role, displayName) {
  // our finish tile has %, so if we have it, figure out the result.
  const textArray = text?.split('%');
  if (textArray?.length <= 1) {
    return actionStringReplacement(text, role, displayName);
  }

  return getFinishResult(textArray);
}

export default function usePlayerMove(room, rollValue, gameBoard = []) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const playerList = usePlayerList(room);
  const total = gameBoard.length;
  const [tile, setTile] = useState(gameBoard[0]);
  const lastTile = total - 1;

  const handleTextOutput = useCallback((newTile, rollNumber, newLocation, preMessage) => {
    let message = '';
    const description = parseDescription(newTile?.description, newTile.role, user.displayName);
    if (rollNumber !== -1) {
      message += `${t('roll')}: ${rollNumber}\n`;
    }
    message += `#${newLocation + 1}: ${newTile?.title}\n`;
    message += `${t('action')}: ${description}`;
    sendMessage({
      room,
      user,
      text: preMessage ? preMessage + message : message,
      type: 'actions',
    });
  });

  // Grab the new location.
  // In some instances, we also want to add a message with said location.
  function getNewLocation(rollNumber) {
    // -1 is used to restart the game.
    if (rollNumber === -1) {
      return {
        preMessage: `${t('restartingGame')}\n`,
        newLocation: 0,
      };
    }

    const currentLocation = playerList.find((p) => p.isSelf)?.location;

    // restart game if we roll and are on the last tile.
    if (currentLocation === lastTile) {
      return {
        preMessage: `${t('alreadyFinished')}\n`,
        newLocation: rollNumber,
      };
    }

    const newLocation = rollNumber + currentLocation;
    // If we move past finish, move to finish instead.
    if (newLocation >= lastTile) {
      return { newLocation: lastTile };
    }
    return { newLocation };
  }

  useEffect(() => {
    const rollNumber = rollValue.value[0] ?? rollValue.value;

    // a 0 means something went wrong. Give up.
    if (rollNumber === 0) return;

    const { preMessage, newLocation } = getNewLocation(rollNumber);

    // update our tile that we will return.
    setTile({ ...gameBoard[newLocation], index: newLocation });

    // send our message.
    handleTextOutput(gameBoard[newLocation], rollNumber, newLocation, preMessage);
  }, [rollValue]);

  return { tile, playerList };
}
