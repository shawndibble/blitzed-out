export interface ExportIntensity {
  value: number;
  label: string;
}

export interface ExportGroup {
  name: string;
  label: string;
  gameMode: string;
  locale: string;
  type?: string;
  intensities: ExportIntensity[];
  contentHash: string;
}

export interface ExportTile {
  action: string;
  groupName: string;
  intensity: number;
  tags: string[];
  gameMode: string;
  locale: string;
  isEnabled: boolean;
  contentHash: string;
}

export interface ExportDisabledDefault {
  action: string;
  groupName: string;
  intensity: number;
  gameMode: string;
  contentHash: string;
}

export interface ExportData {
  formatVersion: string;
  exportedAt: string;
  data: {
    customGroups: ExportGroup[];
    customTiles: ExportTile[];
    disabledDefaultTiles: ExportDisabledDefault[];
  };
}

export interface ImportOptions {
  validateContent: boolean;
  preserveDisabledDefaults: boolean;
}

export interface ImportResult {
  success: boolean;
  importedGroups: number;
  importedTiles: number;
  importedDisabledDefaults: number;
  errors: string[];
  warnings: string[];
  skippedItems: number;
}

export interface ConflictAnalysis {
  groupConflicts: Array<{
    existing: ExportGroup;
    imported: ExportGroup;
    conflictType: 'identical' | 'nameMatch' | 'contentMatch';
  }>;
  tileConflicts: Array<{
    existing: ExportTile;
    imported: ExportTile;
    conflictType: 'identical' | 'actionMatch' | 'contentMatch';
  }>;
  disabledConflicts: Array<{
    existing: ExportDisabledDefault;
    imported: ExportDisabledDefault;
    conflictType: 'identical' | 'contentMatch';
  }>;
}

export interface ExportOptions {
  scope: 'all' | 'custom' | 'single' | 'disabled';
  singleGroupName?: string;
  includeDisabledDefaults: boolean;
}
