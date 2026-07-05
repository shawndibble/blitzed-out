import type { ContentGameMode } from '@/types/Settings';

// Base CustomTile interface (for pushing)
export interface CustomTileBase {
  group_id?: string; // New foreign key field
  intensity: number;
  action: string;
  tags: string[];
  isEnabled?: number | boolean;
  isCustom: number;
  updatedAt?: number; // Unix ms; drives last-writer-wins during sync
  // Content-pack provenance (set when this tile was imported from a pack).
  // Copy-only model: a lightweight attribution + re-import dedupe stamp only.
  packId?: string; // id of the source content pack (indexed)
  packName?: string; // denormalized source pack name for badge display
}

/**
 * First-class record of a disabled default tile. Keyed by the stable content
 * tuple (group_id|intensity|action) so it survives default-tile re-seeds and
 * syncs per-record with last-writer-wins. `active: false` is a tombstone
 * carrying a re-enable across devices (the row-flag model could not).
 */
export interface DisabledDefault {
  key: string; // `${group_id}|${intensity}|${action}` — primary key
  group_id?: string;
  intensity: number;
  action: string;
  active: boolean; // true = disabled; false = tombstone (re-enabled)
  updatedAt: number; // Unix ms; drives last-writer-wins during sync
}

// CustomTile interface for pushing (id is optional)
export interface CustomTilePush extends CustomTileBase {
  id?: number;
}

// CustomTile interface for pulling (id is required and always a number)
export interface CustomTilePull extends CustomTileBase {
  id: number;
}

// Generic CustomTile type that can be used in most cases
export type CustomTile = CustomTilePush | CustomTilePull;

// GameMode type definition
export type GameMode = 'online' | 'solo' | 'local';

export interface MappedGroup {
  group: string;
  groupLabel: string;
  value: string;
  intensity: number;
  translatedIntensity: string;
  label: string;
}

export interface GroupedActions {
  [key: string]: {
    label: string;
    type?: string;
    actions?: {
      [key: string]: any;
    };
    intensities?: Record<number, string>;
  };
}

export interface ProcessedGroup {
  label?: string;
  intensities: {
    [key: number]: number;
  };
  count?: number;
}

export interface ProcessedGroups {
  [key: string]: ProcessedGroup;
}

export interface AllGameModeActions {
  online: GroupedActions;
  local: GroupedActions;
  solo: GroupedActions;
}

export interface SubmitMessage {
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
}

// Shared filter state for synchronization between AddCustomTile and ViewCustomTiles
export interface SharedFilters {
  gameMode: ContentGameMode;
  groupName: string; // Group name for filter synchronization (ViewCustomTiles uses names)
  intensity: string; // Empty string when ViewCustomTiles has 'All'
}

// Component Props Interfaces
export interface CustomTileDialogProps {
  boardUpdated: () => void;
  setOpen: (open: boolean) => void;
  open?: boolean;
  actionsList?: any;
}

export interface CustomTileHelpProps {
  expanded: string;
  handleChange: (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => void;
}

export interface ImportExportProps {
  expanded: string;
  handleChange: (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => void;
  customTiles: CustomTile[];
  mappedGroups: AllGameModeActions;
  setSubmitMessage: (message: SubmitMessage) => void;
  bulkImport: (records: CustomTile[]) => Promise<void>;
  onImportSuccess?: () => void;
}

export interface AddCustomTileProps {
  /** Shared editor lifecycle (filters, draft, edit target, submit). */
  lifecycle: import('@/views/CustomTileDialog/hooks/useCustomTileLifecycle').CustomTileLifecycle;
  expanded: string;
  handleChange: (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => void;
  tagList: string[];
}

export interface ViewCustomTilesProps {
  tagList: string[];
  boardUpdated: () => void;
  mappedGroups: AllGameModeActions;
  updateTile: (id: number, tileData?: Partial<CustomTilePull>) => void;
  refreshTrigger: number;
  sharedFilters: SharedFilters;
  setSharedFilters: (filters: SharedFilters) => void;
}

export interface GetUniqueImportRecordsResult {
  newUniqueRecords: CustomTile[];
  changedTagRecords: CustomTile[];
}
