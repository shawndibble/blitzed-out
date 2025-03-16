import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sendMessage } from '@/services/firebase';
import useAuth from '@/context/hooks/useAuth';
import actionStringReplacement from '@/services/actionStringReplacement';
import usePlayerList from './usePlayerList';

interface Tile {
  title?: string;
  description?: string;
  role?: string;
  index?: number;
  [key: string]: any;
}

interface RollValue {
  value: number | number[];
}

interface LocationResult {
  preMessage?: string;
  newLocation: number;
}

interface Player {
  isSelf: boolean;
  location: number;
  [key: string]: any;
}

function getFinishResult(textArray: string[]): string {
  // if we have %, we are on the finish tile. Let's get a random result.
  const finishValues = textArray.filter((n) => n).map((line) => line.split(': '));

  // process weighted random finish result.
  const weightedArray: number[] = [];
  finishValues.forEach((val, index) => {
    if (Number(val[1]) === 0) return;
    const clone = Array(Number(val[1])).fill(index);
    weightedArray.push(...clone);
  });

  const result = weightedArray[Math.floor(Math.random() * weightedArray.length)];

  return finishValues.map(([action]) => action)[result]?.replace(/(\r\n|\n|\r)/gm, '');
}

function parseDescription(text: string | undefined, role: string, displayName: string): string {
  if (!text) return '';
  // our finish tile has %, so if we have it, figure out the result.
  const textArray = text.split('%');
  if (textArray.length <= 1) {
    return actionStringReplacement(text, role || '', displayName);
  }

  return getFinishResult(textArray);
}

export default function usePlayerMove(
  room: string, 
  rollValue: RollValue, 
  gameBoard: Tile[] = []
): { tile: Tile; playerList: Player[] } {
  const { user } = useAuth();
  const { t } = useTranslation();
  const playerList = usePlayerList(room);
  const total = gameBoard.length;
  const [tile, setTile] = useState<Tile>(gameBoard[0] || {});
  const lastTile = total - 1;

  const handleTextOutput = useCallback(
    (newTile: Tile, rollNumber: number, newLocation: number, preMessage?: string): void => {
      if (!newTile) {
        console.error('Tile not found at location:', newLocation);
        return;
      }
      let message = '';
      // Safely access newTile properties with default values if they don't exist
      const description = parseDescription(
        newTile.description || '',
        newTile.role || '',
        user.displayName
      );
      if (rollNumber !== -1) {
        message += `${t('roll')}: ${rollNumber}\n`;
      }
      message += `#${newLocation + 1}: ${newTile.title || t('unknownTile')}\n`;
      message += `${t('action')}: ${description}`;

      sendMessage({
        room,
        user,
        text: preMessage ? preMessage + message : message,
        type: 'actions',
      });
    },
    [room, user, t]
  );

  // Grab the new location.
  // In some instances, we also want to add a message with said location.
  function getNewLocation(rollNumber: number): LocationResult {
    // -1 is used to restart the game.
    if (rollNumber === -1) {
      return {
        preMessage: `${t('restartingGame')}\n`,
        newLocation: 0,
      };
    }

    const currentLocation = playerList.find((p) => p.isSelf)?.location || 0;

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
    const rollNumber = Array.isArray(rollValue.value) 
      ? rollValue.value[0] 
      : rollValue.value;

    // a 0 means something went wrong. Give up.
    if (rollNumber === 0) return;

    const { preMessage, newLocation } = getNewLocation(rollNumber);

    // Make sure we have a valid location and tile
    if (newLocation >= 0 && newLocation < gameBoard.length && gameBoard[newLocation]) {
      // update our tile that we will return.
      setTile({ ...gameBoard[newLocation], index: newLocation });

      // send our message.
      handleTextOutput(gameBoard[newLocation], rollNumber, newLocation, preMessage);
    } else {
      console.error(
        `Invalid location or missing tile: ${newLocation}, gameBoard length: ${gameBoard.length}`
      );
    }
  }, [rollValue, gameBoard, handleTextOutput, playerList, t]);

  return { tile, playerList };
}
