import GameTile from './GameTile';
import './styles.css';

export default function GameBoard({ playerList, isTransparent, gameBoard }) {
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
            isTransparent={isTransparent}
          />
        ))}
      </ol>
    </div>
  );
}
