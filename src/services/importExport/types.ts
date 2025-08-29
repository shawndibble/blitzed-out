/**
 * Type definitions for the import/export system
 */

import { CustomGroupIntensity } from '@/types/customGroups';

// Version identifier for export format
export const EXPORT_FORMAT_VERSION = '3.0.0';

// Custom tile with optional tags
export interface CleanCustomTile {
  action: string;
  tags?: string[];
}

// Clean export data structure
export interface CleanExportData {
  version: string;
  locale: string;
  gameMode: string;
  groups: {
    [groupName: string]: {
      label: string;
      type: string;
      intensities: string[];
    };
  };
  customTiles: {
    [groupName: string]: {
      [intensityValue: number]: (string | CleanCustomTile)[];
    };
  };
}

export interface ImportResult {
  success: boolean;
  importedGroups: number;
  importedTiles: number;
  skippedGroups: number;
  skippedTiles: number;
  errors: string[];
  warnings: string[];
}

export interface ExportOptions {
  singleGroup?: string;
  exportScope?: 'all' | 'single' | 'default';
  includeDisabled?: boolean;
}

export interface ImportOptions {
  locale?: string;
  gameMode?: string;
  mergeStrategy?: 'skip' | 'overwrite' | 'rename';
  batchSize?: number;
  progressCallback?: (progress: ImportProgress) => void;
}

export interface ImportProgress {
  phase: 'parsing' | 'validating' | 'groups' | 'tiles' | 'complete';
  current: number;
  total: number;
  message: string;
}

export interface GroupMapping {
  groupId: string;
  groupName: string;
  intensities: Map<number, CustomGroupIntensity>;
  isDefault: boolean;
}

export interface TileConflict {
  existing: {
    id: number;
    action: string;
    intensity: number;
    tags: string[];
  };
  incoming: {
    action: string;
    intensity: number;
    tags?: string[];
  };
  resolution?: 'skip' | 'overwrite' | 'merge';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  conflicts: TileConflict[];
}

export interface ImportContext {
  locale: string;
  gameMode: string;
  groupMappings: Map<string, GroupMapping>;
  existingTileActions: Set<string>;
  options: ImportOptions;
  stats: {
    groupsProcessed: number;
    tilesProcessed: number;
    errors: number;
    warnings: number;
  };
}

export interface ExportContext {
  locale: string;
  gameMode: string;
  options: ExportOptions;
  groupIds: Set<string>;
  stats: {
    groupsExported: number;
    tilesExported: number;
  };
}

export interface ExportableGroupStats {
  name: string;
  label: string;
  exportCount: {
    customGroups: number; // 1 if group itself is custom, 0 if default
    customTiles: number; // Count of custom tiles in this group
    disabledDefaults: number; // Count of disabled default tiles (if includeDisabled)
    total: number; // Sum of all above
  };
}
