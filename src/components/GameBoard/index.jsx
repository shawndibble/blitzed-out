import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import GameTile from './GameTile';
import './styles.css';
import useLocalStorage from '../../hooks/useLocalStorage';
import useMessages from '../../hooks/useMessages';

export default function GameBoard({ playerList }) {
  const { id: room } = useParams();
  const queryParams = useSearchParams()[0];
  const localGameBoard = useLocalStorage('customBoard')[0];
  const [gameBoard, setGameBoard] = useState();
  const messages = useMessages(room || 'public');

  const importBoard = queryParams.get('importBoard');

  useEffect(() => {
    const importMessage = messages.find((m) => m.id === importBoard);
    const boardToUse = Array.isArray(importMessage?.gameBoard)
      ? importMessage.gameBoard
      : localGameBoard;
    setGameBoard(boardToUse);
  }, [messages]);

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
          />
        ))}
      </ol>
    </div>
  );
}
