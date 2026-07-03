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
  anatomyRequirement?: string;
  intensities: ExportIntensity[];
  contentHash: string;
}

// Append-only delta against a DEFAULT group: new intensity levels only.
// New tiles for default groups travel as plain ExportTile entries (the tile
// importer resolves default groups by deterministic id). Introduced in
// format 2.1.0; older readers ignore this array.
export interface ExportGroupExtension {
  groupName: string; // default group's name key (e.g. "ballBusting")
  locale: string;
  gameMode: string;
  addedIntensities: ExportIntensity[];
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
    groupExtensions?: ExportGroupExtension[]; // 2.1.0+; absent in older exports
  };
}

export interface PackProvenance {
  packId: string;
  packName: string;
}

export interface ImportOptions {
  validateContent: boolean;
  preserveDisabledDefaults: boolean;
  // When set, imported tiles/groups are stamped with this pack provenance so the
  // app can show their source and detect updates.
  packProvenance?: PackProvenance;
}

export interface ImportResult {
  success: boolean;
  importedGroups: number;
  importedTiles: number;
  importedIntensities: number; // intensity levels appended to default groups
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

import type { GameMode, SupportedLanguage } from '@/services/migration/constants';

export interface ExportOptions {
  scope: 'all' | 'custom' | 'single' | 'disabled';
  singleGroupName?: string;
  groupNames?: string[]; // multi-group selection (content packs); supersedes singleGroupName when set
  includeDisabledDefaults: boolean;
  locales?: SupportedLanguage[];
  gameModes?: GameMode[];
}
