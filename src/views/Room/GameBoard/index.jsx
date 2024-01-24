import GameTile from './GameTile';
import './styles.css';

export default function GameBoard({ playerList, isTransparent, gameBoard }) {
  if (!Array.isArray(gameBoard)) return null;

  const gameTiles = gameBoard.map((entry, index) => {
    const players = playerList.filter((player) => player.location === index);
    const current = playerList.find(
      (player) => player.isSelf && player.location === index && index !== 0
    );

    return (
      <GameTile
        // eslint-disable-next-line react/no-array-index-key
        key={index}
        id={`tile-${index}`}
        title={`#${index + 1}: ${entry.title}`}
        description={entry.description}
        players={players}
        current={current}
        isTransparent={isTransparent}
      />
    );
  });

  return (
    <div className='gameboard'>
      <ol>{gameTiles}</ol>
    </div>
  );
}
