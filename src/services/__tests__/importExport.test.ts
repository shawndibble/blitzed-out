import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportAllData, importData, analyzeImportConflicts, importFromJson } from '../importExport';
import type { ExportData } from '@/types/importExport';
import type { CustomGroupPull } from '@/types/customGroups';
import type { CustomTile } from '@/types/customTiles';

// Mock all dependencies
vi.mock('@/stores/customGroups', () => ({
  getCustomGroups: vi.fn(),
  addCustomGroup: vi.fn(),
  updateCustomGroup: vi.fn(),
}));

vi.mock('@/stores/customTiles', () => ({
  getTiles: vi.fn(),
  addCustomTile: vi.fn(),
  updateCustomTile: vi.fn(),
}));

vi.mock('../contentHashing', () => ({
  generateGroupContentHash: vi.fn(),
  generateTileContentHash: vi.fn(),
  generateDisabledDefaultContentHash: vi.fn(),
}));

// Import mocked functions
import { getCustomGroups, addCustomGroup, updateCustomGroup } from '@/stores/customGroups';
import { getTiles, addCustomTile, updateCustomTile } from '@/stores/customTiles';
import {
  generateGroupContentHash,
  generateTileContentHash,
  generateDisabledDefaultContentHash,
} from '../contentHashing';

describe('ImportExport Service', () => {
  const mockGroup: CustomGroupPull = {
    id: 'test-group-1',
    name: 'testGroup',
    label: 'Test Group',
    intensities: [
      { id: 'int-1', label: 'Light', value: 1, isDefault: true },
      { id: 'int-2', label: 'Medium', value: 2, isDefault: true },
    ],
    type: 'solo',
    isDefault: false,
    locale: 'en',
    gameMode: 'online',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTile: CustomTile = {
    id: 1,
    group_id: 'test-group-1',
    intensity: 1,
    action: 'Test action',
    tags: ['test'],
    isEnabled: 1,
    isCustom: 1,
  };

  const mockExportData: ExportData = {
    formatVersion: '2.0.0',
    exportedAt: new Date().toISOString(),
    data: {
      customGroups: [
        {
          name: 'testGroup',
          label: 'Test Group',
          gameMode: 'online',
          locale: 'en',
          type: 'action',
          intensities: [
            { value: 1, label: 'Light' },
            { value: 2, label: 'Medium' },
          ],
          contentHash: 'mock-hash-group',
        },
      ],
      customTiles: [
        {
          action: 'Test action',
          groupName: 'testGroup',
          intensity: 1,
          tags: ['test'],
          gameMode: 'online',
          locale: 'en',
          isEnabled: true,
          contentHash: 'mock-hash-tile',
        },
      ],
      disabledDefaultTiles: [],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(getCustomGroups).mockResolvedValue([mockGroup]);
    vi.mocked(getTiles).mockResolvedValue([mockTile as any]); // Cast to avoid union type issue
    vi.mocked(generateGroupContentHash).mockResolvedValue('mock-hash-group');
    vi.mocked(generateTileContentHash).mockResolvedValue('mock-hash-tile');
    vi.mocked(generateDisabledDefaultContentHash).mockResolvedValue('mock-hash-disabled');
    vi.mocked(addCustomGroup).mockResolvedValue('new-group-id');
    vi.mocked(addCustomTile).mockResolvedValue(1);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('exportAllData', () => {
    it('should export data successfully with default options', async () => {
      const result = await exportAllData();

      expect(getCustomGroups).toHaveBeenCalledWith({
        locale: 'en',
        gameMode: 'online',
        isDefault: false,
      });
      expect(getTiles).toHaveBeenCalledWith({
        group_id: 'test-group-1',
        isCustom: 1,
      });

      const exportData = JSON.parse(result);
      expect(exportData.formatVersion).toBe('2.0.0');
      expect(exportData.data.customGroups).toHaveLength(1);
      expect(exportData.data.customTiles).toHaveLength(1);
      expect(exportData.data.disabledDefaultTiles).toHaveLength(0);
    });

    it('should include disabled defaults when requested', async () => {
      const disabledTile = { ...mockTile, id: 2, isEnabled: 0 };
      vi.mocked(getTiles)
        .mockResolvedValueOnce([mockTile as any]) // Regular tiles
        .mockResolvedValueOnce([disabledTile as any]); // Disabled tiles

      const result = await exportAllData({
        includeDisabledDefaults: true,
      });

      const exportData = JSON.parse(result);
      expect(exportData.data.disabledDefaultTiles).toHaveLength(1);
    });

    it('should filter by single group name when provided', async () => {
      await exportAllData({
        singleGroupName: 'specificGroup',
      });

      expect(getCustomGroups).toHaveBeenCalledWith({
        locale: 'en',
        gameMode: 'online',
        isDefault: false,
      });
    });

    it('should call progress callback if provided', async () => {
      const progressCallback = vi.fn();

      await exportAllData({}, progressCallback);

      expect(progressCallback).toHaveBeenCalledWith('Fetching groups', 0, 100);
      expect(progressCallback).toHaveBeenCalledWith('Finalizing export', 100, 100);
    });

    it('should handle export errors gracefully', async () => {
      vi.mocked(getCustomGroups).mockRejectedValue(new Error('Database error'));

      await expect(exportAllData()).rejects.toThrow('Export failed');
    });
  });

  describe('importData', () => {
    it('should import new groups and tiles successfully', async () => {
      vi.mocked(getCustomGroups).mockResolvedValue([]); // No existing groups
      vi.mocked(getTiles).mockResolvedValue([]); // No existing tiles

      // Mock the group creation to return just the ID

      vi.mocked(addCustomGroup).mockResolvedValue('new-group-id');

      const result = await importData(mockExportData);

      expect(addCustomGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'testGroup',
          label: 'Test Group',
          locale: 'en',
          gameMode: 'online',
        })
      );
      expect(addCustomTile).toHaveBeenCalledWith(
        expect.objectContaining({
          group_id: 'new-group-id',
          action: 'Test action',
          intensity: 1,
          isEnabled: 1,
          isCustom: 1,
        })
      );
      expect(result.success).toBe(true);
      expect(result.importedGroups).toBe(1);
      expect(result.importedTiles).toBe(1);
    });

    it('should skip identical existing groups', async () => {
      vi.mocked(generateGroupContentHash).mockResolvedValue('mock-hash-group');
      vi.mocked(generateTileContentHash).mockResolvedValue('mock-hash-tile');

      const result = await importData(mockExportData);

      expect(updateCustomGroup).not.toHaveBeenCalled();
      expect(addCustomGroup).not.toHaveBeenCalled();
      expect(result.skippedItems).toBe(2); // Both group and tile are skipped
      expect(result.warnings).toContain('Skipped identical group: testGroup');
      expect(result.warnings).toContain('Skipped identical tile: Test action');
    });

    it('should update existing groups when content differs', async () => {
      vi.mocked(generateGroupContentHash).mockResolvedValue('different-hash');

      const result = await importData(mockExportData);

      expect(updateCustomGroup).toHaveBeenCalledWith('test-group-1', expect.any(Object));
      expect(result.warnings).toContain('Updated existing group: testGroup');
    });

    it('should skip tiles for missing groups', async () => {
      // Create import data where the tile references a group that doesn't exist in the import data
      const importDataWithMissingGroup = {
        ...mockExportData,
        data: {
          customGroups: [], // No groups in import data
          customTiles: [mockExportData.data.customTiles[0]], // But has a tile that references testGroup
          disabledDefaultTiles: [],
        },
      };

      const result = await importData(importDataWithMissingGroup);

      expect(result.warnings).toContain('Skipped tile for missing group: testGroup (en/online)');
    });

    it('should validate tile intensity against group', async () => {
      const invalidTileData = {
        ...mockExportData,
        data: {
          ...mockExportData.data,
          customTiles: [
            {
              ...mockExportData.data.customTiles[0],
              intensity: 999, // Invalid intensity
            },
          ],
        },
      };

      const result = await importData(invalidTileData);

      expect(result.warnings).toContain(
        'Skipped tile with invalid intensity 999 for group testGroup'
      );
    });

    it('should handle import errors gracefully', async () => {
      vi.mocked(getCustomGroups).mockRejectedValue(new Error('Database error'));

      await expect(importData(mockExportData)).rejects.toThrow('Import failed');
    });

    it('should validate import data format', async () => {
      const invalidData = { invalid: 'data' };

      await expect(importData(invalidData as any)).rejects.toThrow('Import failed');
    });

    it('should parse JSON string input', async () => {
      vi.mocked(getCustomGroups).mockResolvedValue([]);

      const jsonString = JSON.stringify(mockExportData);
      const result = await importData(jsonString);

      expect(result.success).toBe(true);
    });

    it('should call progress callback during import', async () => {
      const progressCallback = vi.fn();
      vi.mocked(getCustomGroups).mockResolvedValue([]);

      await importData(mockExportData, {}, progressCallback);

      expect(progressCallback).toHaveBeenCalledWith('Preparing import', 0, 100);
      expect(progressCallback).toHaveBeenCalledWith('Importing groups', 25, 100);
      expect(progressCallback).toHaveBeenCalledWith('Importing tiles', 75, 100);
      expect(progressCallback).toHaveBeenCalledWith('Import complete', 100, 100);
    });

    it('should import disabled default tiles when preserveDisabledDefaults is enabled', async () => {
      const mockDisabledDefault = {
        id: 2,
        group_id: 'test-group-1',
        intensity: 1,
        action: 'Test default action',
        tags: ['default'],
        isEnabled: 1, // Currently enabled, should be disabled
        isCustom: 0,
      };

      const importDataWithDisabled = {
        ...mockExportData,
        data: {
          ...mockExportData.data,
          disabledDefaultTiles: [
            {
              action: 'Test default action',
              groupName: 'testGroup',
              intensity: 1,
              gameMode: 'online',
              contentHash: 'mock-hash-disabled',
            },
          ],
        },
      };

      vi.mocked(getTiles).mockImplementation((filters) => {
        // If looking for default tiles (isCustom: 0), return the mock default tile
        if (filters?.isCustom === 0) {
          return Promise.resolve([mockDisabledDefault as any]);
        }
        return Promise.resolve([]);
      });

      const result = await importData(importDataWithDisabled, {
        preserveDisabledDefaults: true,
      });

      expect(updateCustomTile).toHaveBeenCalledWith(
        2,
        expect.objectContaining({
          isEnabled: 0,
        })
      );
      expect(result.importedDisabledDefaults).toBe(1);
      expect(result.success).toBe(true);
    });

    it('should handle batch tile imports efficiently', async () => {
      // Create large dataset to test batching
      const largeTileData = {
        ...mockExportData,
        data: {
          ...mockExportData.data,
          customTiles: Array(250)
            .fill(null)
            .map((_, i) => ({
              action: `Test action ${i}`,
              groupName: 'testGroup',
              intensity: 1,
              tags: ['test'],
              gameMode: 'online',
              locale: 'en',
              isEnabled: true,
              contentHash: `mock-hash-tile-${i}`,
            })),
        },
      };

      vi.mocked(getCustomGroups).mockResolvedValue([mockGroup]);
      vi.mocked(getTiles).mockResolvedValue([]);

      const result = await importData(largeTileData);

      expect(result.importedTiles).toBe(250);
      // Should handle batching internally without issues
      expect(addCustomTile).toHaveBeenCalledTimes(250);
    });
  });

  describe('analyzeImportConflicts', () => {
    it('should analyze conflicts successfully', async () => {
      const result = await analyzeImportConflicts(mockExportData);

      expect(result).toHaveProperty('groupConflicts');
      expect(result).toHaveProperty('tileConflicts');
      expect(result).toHaveProperty('disabledConflicts');
      expect(Array.isArray(result.groupConflicts)).toBe(true);
    });

    it('should handle string input', async () => {
      const jsonString = JSON.stringify(mockExportData);
      const result = await analyzeImportConflicts(jsonString);

      expect(result).toHaveProperty('groupConflicts');
    });

    it('should validate input data', async () => {
      const invalidData = { invalid: 'data' };

      await expect(analyzeImportConflicts(invalidData as any)).rejects.toThrow(
        'Conflict analysis failed'
      );
    });
  });

  describe('importFromJson', () => {
    it('should be an alias for importData with JSON string', async () => {
      vi.mocked(getCustomGroups).mockResolvedValue([]);

      const jsonString = JSON.stringify(mockExportData);
      const result = await importFromJson(jsonString);

      expect(result.success).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed JSON in import', async () => {
      const malformedJson = '{ invalid json';

      await expect(importData(malformedJson)).rejects.toThrow();
    });

    it('should preserve error context in custom error class', async () => {
      const originalError = new Error('Original database error');
      vi.mocked(getCustomGroups).mockRejectedValue(originalError);

      try {
        await exportAllData();
      } catch (error: any) {
        expect(error.name).toBe('ImportExportError');
        expect(error.message).toBe('Export failed');
        expect(error.cause).toBe(originalError);
      }
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large datasets without memory issues', async () => {
      // Simulate large dataset
      const largeGroups = Array(50)
        .fill(null)
        .map((_, i) => ({
          ...mockGroup,
          id: `group-${i}`,
          name: `group${i}`,
        }));

      const largeTiles = Array(1000)
        .fill(null)
        .map((_, i) => ({
          ...mockTile,
          id: i,
          action: `Action ${i}`,
          group_id: `group-${i % 50}`,
        }));

      vi.mocked(getCustomGroups).mockResolvedValue(largeGroups);
      vi.mocked(getTiles).mockImplementation((filters) => {
        if (filters?.group_id) {
          return Promise.resolve(largeTiles.filter((t) => t.group_id === filters.group_id));
        }
        return Promise.resolve(largeTiles);
      });

      const result = await exportAllData();
      const exportData = JSON.parse(result);

      expect(exportData.data.customGroups).toHaveLength(50);
      expect(exportData.data.customTiles).toHaveLength(1000);
    });

    it('should process streaming data efficiently', async () => {
      const progressCallback = vi.fn();

      await exportAllData({}, progressCallback);

      // Should call progress callback multiple times for streaming
      expect(progressCallback.mock.calls.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Type Safety', () => {
    it('should handle partial options correctly', async () => {
      // Test with minimal options
      const result = await exportAllData({ includeDisabledDefaults: true });
      expect(typeof result).toBe('string');

      // Test import with partial options
      vi.mocked(getCustomGroups).mockResolvedValue([]);
      const importResult = await importData(mockExportData, { validateContent: true });
      expect(importResult.success).toBe(true);
    });

    it('should validate data types at runtime', async () => {
      const invalidExportData = {
        formatVersion: '2.0.0',
        exportedAt: new Date().toISOString(),
        data: {
          customGroups: 'invalid', // Should be array
          customTiles: [],
          disabledDefaultTiles: [],
        },
      };

      await expect(importData(invalidExportData as any)).rejects.toThrow('Import failed');
    });
  });
});
