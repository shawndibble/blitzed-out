import { useEffect, useState } from 'react';
import { sendMessage } from '../services/firebase';
import useAuth from './useAuth';
import useLocalStorage from './useLocalStorage';
import usePlayerList from './usePlayerList';

export default function usePlayerMove(roomId, rollValue) {
  const { user } = useAuth();
  const playerList = usePlayerList(roomId)[0];
  const gameBoard = useLocalStorage('customBoard')[0];
  const total = gameBoard.length;
  const [tile, setTile] = useState(gameBoard[0]);

  function handleTextOutput(newTile, rollNumber, newLocation, preMessage) {
    let message = `Roll: ${rollNumber}  \r\n`;
    message += `#${newLocation + 1}: ${newTile?.title}  \r\n`;
    message += `Action: ${newTile?.description}`;
    sendMessage(roomId, user, preMessage + message, 'actions');
  }

  useEffect(() => {
    const rollNumber = rollValue[0];
    if (rollNumber === 0) return;

    const lastTile = total - 1;
    const currentLocation = playerList.find((p) => p.isSelf).location;
    let newLocation = rollNumber + currentLocation;
    let preMessage = '';

    // restart game.
    if (currentLocation === lastTile) {
      preMessage = 'You already finished. Starting over. \r\n';
      newLocation = rollNumber;
    }

    // move to final tile
    if (newLocation >= lastTile) {
      newLocation = lastTile;
    }

    if (tile?.description !== gameBoard[newLocation]) setTile(gameBoard[newLocation]);

    // send our message.
    handleTextOutput(gameBoard[newLocation], rollNumber, newLocation, preMessage);

    // eslint-disable-next-line
  }, [rollValue]);

  return { tile, playerList };
}
