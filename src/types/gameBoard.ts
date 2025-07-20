import { Player } from './player';
import { GameMode } from './Settings';

export interface DBGameBoard {
  id?: number;
  title: string;
  tiles?: TileExport[];
  isActive: number;
  tags: string[];
  gameMode: string;
}

export interface Tile {
  id?: number;
  title: string;
  description?: string;
  role?: string;
  index?: number;
  players: Player[];
  current: Player | null;
  isTransparent: boolean;
  className: string;
}

export type TileExport = Pick<Tile, 'title' | 'description'>;

export type GameBoard = Tile[];

export interface GameBoardResult {
  settingsBoardUpdated?: boolean;
  gameMode: GameMode;
  newBoard?: TileExport[];
  metadata?: {
    totalTiles: number;
    tilesWithContent: number;
    selectedGroups: string[];
    missingGroups: string[];
    availableTileCount: number;
  };
  [key: string]: any;
}
