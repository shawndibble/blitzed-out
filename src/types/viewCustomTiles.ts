import { CustomTile } from './customTiles';

export interface TileData {
  items: CustomTile[];
  total: number;
  totalPages: number;
}

export interface TileFilters {
  group: string;
  intensity: string | number | null;
  tag: string | null;
  gameMode: string;
  locale: string;
  page: number;
  limit: number;
  paginated: boolean;
}
