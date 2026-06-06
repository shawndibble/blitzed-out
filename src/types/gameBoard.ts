import { Player } from './player';
import { GameMode } from './Settings';

export interface DBGameBoard {
  id?: number;
  title: string;
  tiles?: TileExport[];
  isActive: number;
  tags: string[];
  gameMode: string;
  updatedAt?: number; // Unix ms; drives last-writer-wins during sync
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
  // Whether this tile's action penetrates (drives the female-dom strapon swap).
  // `true`/`false` for classified default tiles; `undefined` for custom/unknown
  // tiles, which fall back to keyword detection at render time.
  penetrative?: boolean;
}

export type TileExport = Pick<Tile, 'title' | 'description' | 'penetrative'>;

export type GameBoard = TileExport[];

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
