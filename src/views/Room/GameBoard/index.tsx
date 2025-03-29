import useAuth from '@/context/hooks/useAuth';
import actionStringReplacement from '@/services/actionStringReplacement';
import GameTile from './GameTile';
import './styles.css';
import { Settings } from '@/types/Settings';
import { Tile } from '@/types';

interface Player {
  uid: string;
  displayName: string;
  location?: number;
  isSelf?: boolean;
}

interface GameBoardProps {
  playerList: Player[];
  isTransparent: boolean;
  gameBoard: Tile[];
  settings: Settings;
}

export default function GameBoard({
  playerList,
  isTransparent,
  gameBoard,
  settings,
}: GameBoardProps): JSX.Element | null {
  const { user } = useAuth();
  if (!Array.isArray(gameBoard) || !gameBoard.length) return null;

  const tileTypeArray = new Set<string>();

  gameBoard.forEach(({ title }, index) => {
    if (title && index !== 0 && index !== gameBoard.length - 1) {
      tileTypeArray.add(title);
    }
  });

  const gameTiles = gameBoard.map((entry, index) => {
    const players = playerList.filter((player) => player.location === index);
    const current = playerList.find(
      (player) => player.isSelf && player.location === index && index !== 0
    );
    const hueIndex = (Array.from(tileTypeArray).indexOf(entry.title) % 10) + 1;

    const description =
      !settings.hideBoardActions || index === 0 || current
        ? actionStringReplacement(entry.description, entry.role, user.displayName || '')
        : // replace only letters and numbers with question marks. Remove special characters.
          entry.description.replace(/[^\w\s]/g, '').replace(/[a-zA-Z0-9]/g, '?');

    return (
      <GameTile
        // eslint-disable-next-line react/no-array-index-key
        key={index}
        title={`#${index + 1}: ${entry.title}`}
        description={description}
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
