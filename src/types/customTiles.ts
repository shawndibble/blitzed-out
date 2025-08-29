// Base CustomTile interface (for pushing)
export interface CustomTileBase {
  group_id?: string; // New foreign key field
  intensity: number;
  action: string;
  tags: string[];
  isEnabled?: number | boolean;
  isCustom: number;
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
  gameMode: string;
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
  setSubmitMessage: (message: SubmitMessage) => void;
  boardUpdated: () => void;
  customTiles: CustomTile[];
  mappedGroups: AllGameModeActions;
  expanded: string;
  handleChange: (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => void;
  tagList: string[];
  updateTileId: number | null;
  setUpdateTileId: (id: number | null) => void;
  sharedFilters: SharedFilters;
  setSharedFilters: (filters: SharedFilters) => void;
}

export interface ViewCustomTilesProps {
  tagList: string[];
  boardUpdated: () => void;
  mappedGroups: AllGameModeActions;
  updateTile: (id: number) => void;
  refreshTrigger: number;
  sharedFilters: SharedFilters;
  setSharedFilters: (filters: SharedFilters) => void;
}

export interface GetUniqueImportRecordsResult {
  newUniqueRecords: CustomTile[];
  changedTagRecords: CustomTile[];
}
