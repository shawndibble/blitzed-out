/**
 * Enhanced import/export functionality with performance optimizations
 * Wrapper around the new optimized import/export services
 */

import { exportAllData, importData } from '@/services/importExport';
import type {
  ExportOptions,
  ImportOptions,
  ImportResult as NewImportResult,
  ConflictAnalysis,
} from '@/types/importExport';

// Legacy ImportResult interface for compatibility
export interface ImportResult {
  success: boolean;
  importedGroups: number;
  importedTiles: number;
  errors: string[];
  warnings: string[];
}

/**
 * Export custom groups and tiles with optimized performance
 * @param locale - Target locale for export ('en', 'es', 'fr')
 * @param gameMode - Target game mode for export ('online', 'offline')
 * @param options - Export configuration options
 * @returns Promise<string> - JSON string of exported data
 */
export async function exportCleanData(
  _locale = 'en',
  _gameMode = 'online',
  options: {
    singleGroup?: string;
    exportScope?: 'all' | 'single' | 'default';
  } = {}
): Promise<string> {
  try {
    // Use the new export service
    const exportOptions: Partial<ExportOptions> = {
      singleGroupName: options.singleGroup,
      includeDisabledDefaults: false, // Legacy behavior
    };

    return await exportAllData(exportOptions);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Export failed: ${message}`);
  }
}

/**
 * Import custom groups and tiles with performance optimizations
 * @param jsonData - JSON string to import
 * @param targetLocale - Target locale for import ('en', 'es', 'fr')
 * @param targetGameMode - Target game mode for import ('online', 'offline')
 * @returns Promise<ImportResult> - Result of import operation
 */
export async function importCleanData(
  jsonData: string,
  _targetLocale = 'en',
  _targetGameMode = 'online'
): Promise<ImportResult> {
  try {
    // Use the new import service
    const importOptions: Partial<ImportOptions> = {
      validateContent: true,
      preserveDisabledDefaults: false,
    };

    const result = await importData(jsonData, importOptions);

    // Convert to legacy format
    return {
      success: result.success,
      importedGroups: result.importedGroups,
      importedTiles: result.importedTiles,
      errors: result.errors,
      warnings: result.warnings,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Import failed: ${message}`);
  }
}

/**
 * Export a single group with its tiles
 * @param groupName - Name of the group to export
 * @param locale - Target locale for export
 * @param gameMode - Target game mode for export
 * @returns Promise<string> - JSON string of exported data
 */
export async function exportSingleGroup(
  groupName: string,
  _locale = 'en',
  _gameMode = 'online'
): Promise<string> {
  // Use the old export format for consistency, but with proper group filtering
  return exportAllData({
    singleGroupName: groupName,
    includeDisabledDefaults: true,
  });
}

/**
 * Export all custom data (groups and tiles)
 * @param locale - Target locale for export
 * @param gameMode - Target game mode for export
 * @returns Promise<string> - JSON string of exported data
 */
export async function exportCustomData(_locale = 'en', _gameMode = 'online'): Promise<string> {
  try {
    const result = await exportCleanData(_locale, _gameMode, {
      exportScope: 'all',
    });

    // Parse the result and filter to only include custom data (no disabled defaults)
    const exportData = JSON.parse(result);
    exportData.data.disabledDefaultTiles = [];
    // Keep customGroups and customTiles

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Export failed: ${message}`);
  }
}

/**
 * Export disabled default tiles
 * @param locale - Target locale for export
 * @param gameMode - Target game mode for export
 * @returns Promise<string> - JSON string of exported data
 */
export async function exportDisabledDefaults(
  _locale = 'en',
  _gameMode = 'online'
): Promise<string> {
  try {
    const exportOptions: Partial<ExportOptions> = {
      includeDisabledDefaults: true,
    };

    const result = await exportAllData(exportOptions);

    // Parse the result and filter to only include disabled defaults
    const exportData = JSON.parse(result);
    exportData.data.customGroups = [];
    exportData.data.customTiles = [];
    // Keep only disabledDefaultTiles

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Export failed: ${message}`);
  }
}

/**
 * Get available groups for export
 * @param locale - Target locale
 * @param gameMode - Target game mode
 * @returns Promise<string[]> - List of available group names
 */
export async function getAvailableGroupsForExport(
  _locale = 'en',
  _gameMode = 'online'
): Promise<string[]> {
  // For now, return empty array - this would need to be implemented
  // by querying the groups directly
  return [];
}

/**
 * Auto-import data with progress tracking
 * @param jsonData - JSON string to import
 * @param targetLocale - Target locale for import
 * @param targetGameMode - Target game mode for import
 * @param progressCallback - Progress callback function
 * @returns Promise<ImportResult> - Result of import operation
 */
export async function autoImportData(
  jsonData: string,
  _targetLocale = 'en',
  _targetGameMode = 'online',
  progressCallback?: (progress: any) => void
): Promise<ImportResult> {
  try {
    const importOptions: Partial<ImportOptions> = {
      validateContent: true,
      preserveDisabledDefaults: false,
    };

    const result = await importData(jsonData, importOptions, progressCallback);

    return {
      success: result.success,
      importedGroups: result.importedGroups,
      importedTiles: result.importedTiles,
      errors: result.errors,
      warnings: result.warnings,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Import failed: ${message}`);
  }
}

/**
 * Create progress tracker (legacy compatibility)
 */
export function createProgressTracker() {
  return {
    callback: (phase: string, current: number, total: number) => {
      console.log(`${phase}: ${current}/${total}`);
    },
    getProgress: () => ({
      phase: 'completed',
      current: 100,
      total: 100,
    }),
  };
}

// Re-export types for backward compatibility
export type { ConflictAnalysis };
export type { NewImportResult as OptimizedImportResult };
