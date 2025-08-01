import useAuth from '@/context/hooks/useAuth';
import actionStringReplacement from '@/services/actionStringReplacement';
import GameTile from './GameTile';
import './styles.css';
import { Settings } from '@/types/Settings';
import { Tile, TileExport } from '@/types/gameBoard';

interface PlayerWithLocation {
  uid: string;
  displayName: string;
  location?: number;
  isSelf?: boolean;
}

interface GameBoardProps {
  playerList: PlayerWithLocation[];
  isTransparent: boolean;
  gameBoard: TileExport[];
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
    const current =
      playerList.find((player) => player.isSelf && player.location === index && index !== 0) ||
      null;
    const hueIndex = (Array.from(tileTypeArray).indexOf(entry.title) % 10) + 1;

    const description =
      !settings.hideBoardActions || index === 0 || current
        ? actionStringReplacement(
            entry.description || '',
            settings.role || 'sub',
            user.displayName || ''
          )
        : // replace only letters and numbers with question marks. Remove special characters.
          (entry.description || '').replace(/[^\w\s]/g, '').replace(/[a-zA-Z0-9]/g, '?');

    // Convert TileExport to full Tile object
    const tile: Tile = {
      id: index,
      title: entry.title,
      description: entry.description,
      index,
      players: players.map((p) => ({ ...p, isSelf: p.isSelf || false, isFinished: false })),
      current: current ? { ...current, isSelf: current.isSelf || false, isFinished: false } : null,
      isTransparent,
      className: `hue${hueIndex}`,
    };

    return (
      <GameTile
        key={index}
        title={`#${index + 1}: ${entry.title}`}
        description={description}
        players={tile.players}
        current={tile.current}
        isTransparent={tile.isTransparent}
        className={tile.className}
      />
    );
  });

  return (
    <div className="gameboard transparent-scrollbar">
      <ol>{gameTiles}</ol>
    </div>
  );
}
