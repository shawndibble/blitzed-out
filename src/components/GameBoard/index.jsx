import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import useLocalStorage from 'hooks/useLocalStorage';
import useMessages from 'hooks/useMessages';
import GameTile from './GameTile';
import './styles.css';

export default function GameBoard({ playerList, settings, setSettings }) {
  const { id: room } = useParams();
  const [queryParams, setParams] = useSearchParams();
  const [localGameBoard, setLocalGameBoard] = useLocalStorage('customBoard');
  const [gameBoard, setGameBoard] = useState(localGameBoard);
  const messages = useMessages(room || 'public');
  const importBoard = queryParams.get('importBoard');

  function importGameBoard() {
    // if we aren't importing, then just load the local gameboard.
    if (!importBoard) setGameBoard(localGameBoard);
    // grab the message by its id (import board value)
    const importMessage = messages.find((m) => m.id === importBoard);
    // no game board? we are done.
    if (!importMessage?.gameBoard) return;
    // convert that string to JSON (array of objects)
    const importedGameBoard = JSON.parse(importMessage.gameBoard);
    // not an array of objects? we are done.
    if (!Array.isArray(importedGameBoard)) return;
    // quickly update the game board, so the player isn't waiting for local storage.
    setGameBoard(importedGameBoard);
    // ensure when we roll, we get the right board tile.
    setLocalGameBoard(importedGameBoard);
    // set setting for changing the board and outputing it when changing rooms.
    setSettings({ ...settings, ...JSON.parse(importMessage?.settings) });
    // remove the import from the URL
    setParams({});
  }

  // eslint-disable-next-line
  useEffect(() => importGameBoard(), [messages, importBoard]);

  if (!Array.isArray(gameBoard)) return null;

  return (
    <div className="gameboard">
      <ol>
        {gameBoard.map((entry, index) => (
          <GameTile
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            id={`tile-${index}`}
            title={`#${index + 1}: ${entry.title}`}
            description={entry.description}
            players={playerList.filter((player) => player.location === index)}
            current={playerList
              .find((player) => player.isSelf && player.location === index && index !== 0)}
            background={settings.background}
          />
        ))}
      </ol>
    </div>
  );
}
