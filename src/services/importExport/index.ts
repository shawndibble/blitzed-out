/**
 * Unified import/export module with performance optimizations
 * Main entry point for all import/export operations
 */

import { exportData, exportGroupData, getAvailableGroupsForExport } from './exportService';
import { importData } from './importService';
import { ensureOptimalIndexes } from './databaseOperations';
import { ImportResult, ImportOptions, ExportOptions, ImportProgress } from './types';

// Re-export types for external use
export type {
  ImportResult,
  ImportOptions,
  ExportOptions,
  ImportProgress,
  CleanExportData,
  CleanCustomTile,
} from './types';

// Initialize optimal database indexes on module load
ensureOptimalIndexes().catch(console.error);

/**
 * Export custom groups and tiles with optimized performance
 * @param locale - Target locale for export
 * @param gameMode - Target game mode for export
 * @param options - Export configuration options
 * @returns Promise<string> - JSON string of exported data
 */
export async function exportCleanData(
  locale = 'en',
  gameMode = 'online',
  options: ExportOptions = {}
): Promise<string> {
  return exportData(locale, gameMode, options);
}

/**
 * Import custom groups and tiles with batch operations
 * @param jsonData - JSON string to import
 * @param targetLocale - Target locale for import
 * @param targetGameMode - Target game mode for import
 * @param options - Import configuration options
 * @returns Promise<ImportResult> - Result of import operation
 */
export async function importCleanData(
  jsonData: string,
  targetLocale = 'en',
  targetGameMode = 'online',
  options: ImportOptions = {}
): Promise<ImportResult> {
  return importData(jsonData, targetLocale, targetGameMode, options);
}

/**
 * Export a specific group's data
 * @param groupName - Name of the group to export
 * @param locale - Target locale for export
 * @param gameMode - Target game mode for export
 * @returns Promise<string> - JSON string of exported data
 */
export { exportGroupData };

/**
 * Get available groups for export dropdown
 * @param locale - Target locale
 * @param gameMode - Target game mode
 * @returns Promise<Array> - List of groups with tile counts
 */
export { getAvailableGroupsForExport };

/**
 * Auto-detect format and import data with progress tracking
 * @param importData - Raw import data string
 * @param options - Import options including progress callback
 * @returns Promise<ImportResult> - Result of import operation
 */
export async function autoImportData(
  importData: string,
  options: {
    locale?: string;
    gameMode?: string;
    mergeStrategy?: 'skip' | 'overwrite' | 'rename';
    progressCallback?: (progress: ImportProgress) => void;
  } = {}
): Promise<ImportResult> {
  const { locale = 'en', gameMode = 'online' } = options;

  try {
    // Try to parse as JSON (clean format)
    const parsedData = JSON.parse(importData);
    if (parsedData.version && parsedData.groups && parsedData.customTiles) {
      // Clean format detected
      return await importCleanData(importData, locale, gameMode, options);
    }
  } catch {
    // Not JSON or invalid format
  }

  // Return error for invalid format
  return {
    success: false,
    importedGroups: 0,
    importedTiles: 0,
    skippedGroups: 0,
    skippedTiles: 0,
    errors: ['Invalid import format. Please provide a valid JSON export file.'],
    warnings: [],
  };
}

/**
 * Create a progress tracker for import operations
 * Useful for UI progress bars
 */
export function createProgressTracker(): {
  callback: (progress: ImportProgress) => void;
  getProgress: () => ImportProgress | null;
} {
  let currentProgress: ImportProgress | null = null;

  return {
    callback: (progress: ImportProgress) => {
      currentProgress = progress;
    },
    getProgress: () => currentProgress,
  };
}

/**
 * Utility to estimate import size before processing
 * Helps with progress bar initialization
 */
export function estimateImportSize(jsonData: string): {
  groups: number;
  tiles: number;
  estimatedTime: number; // in seconds
} {
  try {
    const parsed = JSON.parse(jsonData);
    const groups = Object.keys(parsed.groups || {}).length;

    let tiles = 0;
    for (const intensityData of Object.values(parsed.customTiles || {})) {
      for (const tileArray of Object.values(intensityData as any)) {
        tiles += (tileArray as any[]).length;
      }
    }

    // Estimate ~100 tiles per second processing
    const estimatedTime = Math.ceil(groups * 0.1 + tiles * 0.01);

    return { groups, tiles, estimatedTime };
  } catch {
    return { groups: 0, tiles: 0, estimatedTime: 0 };
  }
}

/**
 * Check if import data is valid before processing
 * Quick validation without full parsing
 */
export function validateImportFormat(jsonData: string): {
  isValid: boolean;
  format?: string;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonData);

    if (parsed.version && parsed.groups && parsed.customTiles) {
      return {
        isValid: true,
        format: 'clean',
      };
    }

    return {
      isValid: false,
      error: 'Missing required fields: version, groups, or customTiles',
    };
  } catch {
    return {
      isValid: false,
      error: 'Invalid JSON format',
    };
  }
}
