export interface CustomTile {
  id?: number;
  group: string;
  intensity: string | number;
  action: string;
  tags: string[];
  isEnabled?: number | boolean;
  isCustom?: number | boolean;
  gameMode?: string;
  locale?: string;
}

export interface MappedGroup {
  group: string;
  groupLabel: string;
  value: string;
  intensity: number;
  translatedIntensity: string;
}

export interface GroupedActions {
  [key: string]: {
    label: string;
    actions?: {
      [key: string]: any;
    };
  };
}

export interface ProcessedGroup {
  label: string;
  intensities: {
    [key: string]: boolean;
  };
}

export interface ProcessedGroups {
  [key: string]: ProcessedGroup;
}

export interface AllGameModeActions {
  online: GroupedActions;
  local: GroupedActions;
}

export interface SubmitMessage {
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
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
}

export interface ViewCustomTilesProps {
  tagList: string[];
  boardUpdated: () => void;
  mappedGroups: AllGameModeActions;
  updateTile: (id: number) => void;
  refreshTrigger: number;
}

export interface GetUniqueImportRecordsResult {
  newUniqueRecords: CustomTile[];
  changedTagRecords: CustomTile[];
}
