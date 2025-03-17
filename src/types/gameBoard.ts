import { GameMode } from './Settings';

export interface DBGameBoard {
  id?: number;
  title: string;
  tiles?: Tile[];
  isActive: number;
  tags: string[];
  gameMode: string;
}

export interface Tile {
  id?: number;
  title?: string;
  description?: string;
  role?: string;
  index?: number;
}

export type GameBoard = Tile[];

export interface GameBoardResult {
  settingsBoardUpdated?: boolean;
  gameMode: GameMode;
  newBoard?: Tile[];
  [key: string]: any;
}
