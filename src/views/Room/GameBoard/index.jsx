import useAuth from 'context/hooks/useAuth';
import actionStringReplacement from 'services/actionStringReplacement';
import GameTile from './GameTile';
import './styles.css';

export default function GameBoard({ playerList, isTransparent, gameBoard }) {
  const { user } = useAuth();
  if (!Array.isArray(gameBoard) || !gameBoard.length) return null;

  const tileTypeArray = new Set();

  gameBoard.forEach(({ title }, index) => {
    if (index !== 0 && index !== gameBoard.length - 1) {
      tileTypeArray.add(title);
    }
  });

  const gameTiles = gameBoard.map((entry, index) => {
    const players = playerList.filter((player) => player.location === index);
    const current = playerList.find(
      (player) => player.isSelf && player.location === index && index !== 0
    );
    const hueIndex = (Array.from(tileTypeArray).indexOf(entry.title) % 10) + 1;

    return (
      <GameTile
        // eslint-disable-next-line react/no-array-index-key
        key={index}
        id={`tile-${index}`}
        title={`#${index + 1}: ${entry.title}`}
        description={actionStringReplacement(
          entry.description,
          entry.role,
          user.displayName
        )}
        players={players}
        current={current}
        isTransparent={isTransparent}
        className={`hue${hueIndex}`}
      />
    );
  });

  return (
    <div className="gameboard">
      <ol>{gameTiles}</ol>
    </div>
  );
}
