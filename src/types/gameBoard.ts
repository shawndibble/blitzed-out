export interface GameBoard {
  id?: number;
  title: string;
  tiles?: any[];
  isActive: number;
  tags: string[];
  gameMode: string;
}

export interface Tile {
  id?: number;
}
