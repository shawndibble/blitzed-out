import { CustomTile } from './customTiles';
import { GameBoard } from './gameBoard';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomTileFilters {
  page?: number;
  limit?: number;
  paginated?: boolean;
  locale?: string;
  gameMode?: string;
  group?: string;
  intensity?: string | number;
  tag?: string;
  isCustom?: number;
  action?: string;
}

export interface CustomTileGroup {
  count: number;
  intensities: {
    [key: number]: number;
  };
}

export interface CustomTileGroups {
  [key: string]: CustomTileGroup;
}
