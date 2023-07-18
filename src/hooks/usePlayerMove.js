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

  function handleTextOutput(newTile, rollNumber, newLocation, preMessage) {
    let message = `${t('roll')}: ${rollNumber}  \r\n`;
    message += `#${newLocation + 1}: ${newTile?.title}  \r\n`;
    message += `${t('action')}: ${newTile?.description}`;
    sendMessage({
      room, user, text: preMessage + message, type: 'actions',
    });
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
      preMessage = `${t('alreadyFinished')}\r\n`;
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
