import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  exportCleanData,
  exportGroupData,
  importCleanData,
  autoImportData,
  generateExportSummary,
  getAvailableGroupsForExport,
  CleanExportData,
} from '../enhancedImportExport';
import { CustomGroupPull } from '@/types/customGroups';
import { CustomTile } from '@/types/customTiles';

// Mock the stores
const mockCustomGroups = [
  {
    id: 'group1',
    name: 'customGroup1',
    label: 'Custom Group 1',
    intensities: [
      { id: 'int1', label: 'None', value: 0, isDefault: false },
      { id: 'int2', label: 'Light', value: 1, isDefault: false },
      { id: 'int3', label: 'Medium', value: 2, isDefault: false },
    ],
    type: 'sex',
    locale: 'en',
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'group2',
    name: 'customGroup2',
    label: 'Custom Group 2',
    intensities: [
      { id: 'int4', label: 'None', value: 0, isDefault: false },
      { id: 'int5', label: 'Beginner', value: 1, isDefault: false },
    ],
    type: 'consumption',
    locale: 'en',
    gameMode: 'online',
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'group3',
    name: 'defaultGroup',
    label: 'Default Group',
    intensities: [
      { id: 'int6', label: 'None', value: 0, isDefault: true },
      { id: 'int7', label: 'Basic', value: 1, isDefault: true },
    ],
    type: 'sex',
    locale: 'en',
    isDefault: true, // This should be excluded from exports
    createdAt: new Date(),
    updatedAt: new Date(),
  },
] as CustomGroupPull[];

const mockCustomTiles = [
  {
    id: 1,
    group: 'customGroup1',
    intensity: 0,
    action: 'No action required',
    tags: [],
    isCustom: 1,
    locale: 'en',
  },
  {
    id: 2,
    group: 'customGroup1',
    intensity: 1,
    action: 'Light action for group 1',
    tags: [],
    isCustom: 1,
    locale: 'en',
  },
  {
    id: 3,
    group: 'customGroup1',
    intensity: 1,
    action: 'Another light action',
    tags: [],
    isCustom: 1,
    locale: 'en',
  },
  {
    id: 4,
    group: 'customGroup2',
    intensity: 1,
    action: 'Beginner action for group 2',
    tags: [],
    isCustom: 1,
    locale: 'en',
  },
] as CustomTile[];

// Mock the stores
vi.mock('@/stores/customGroups', () => ({
  getCustomGroups: vi.fn(),
  getCustomGroupByName: vi.fn(),
  addCustomGroup: vi.fn(),
  updateCustomGroup: vi.fn(),
}));

vi.mock('@/stores/customTiles', () => ({
  getTiles: vi.fn(),
  addCustomTile: vi.fn(),
  updateCustomTile: vi.fn(),
}));

vi.mock('@/services/validationService', () => ({
  validateCustomGroup: vi.fn(),
}));

import { getCustomGroups, getCustomGroupByName, addCustomGroup } from '@/stores/customGroups';
import { getTiles, addCustomTile } from '@/stores/customTiles';
import { validateCustomGroup } from '@/services/validationService';

describe('enhancedImportExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(getCustomGroups).mockResolvedValue(mockCustomGroups);
    vi.mocked(getTiles).mockResolvedValue(mockCustomTiles as any);
    vi.mocked(validateCustomGroup).mockResolvedValue({ isValid: true, errors: [] });
    vi.mocked(getCustomGroupByName).mockResolvedValue(undefined);
    vi.mocked(addCustomGroup).mockResolvedValue('new-group-id');
    vi.mocked(addCustomTile).mockResolvedValue(5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exportCleanData', () => {
    it('should export all custom groups in clean v2.0 format', async () => {
      const result = await exportCleanData('en', { exportScope: 'all' });
      const exportData: CleanExportData = JSON.parse(result);

      expect(exportData.version).toBe('2.0.0');
      expect(exportData.locale).toBe('en');
      expect(Object.keys(exportData.groups)).toHaveLength(2); // Only custom groups, not default

      // Check first custom group
      expect(exportData.groups.customGroup1).toBeDefined();
      expect(exportData.groups.customGroup1.label).toBe('Custom Group 1');
      expect(exportData.groups.customGroup1.type).toBe('sex');
      expect(exportData.groups.customGroup1.intensities).toEqual(['None', 'Light', 'Medium']);
      expect(exportData.groups.customGroup1.actions.None).toEqual([]);
      expect(exportData.groups.customGroup1.actions.Light).toEqual([]);
      expect(exportData.groups.customGroup1.actions.Medium).toEqual([]);

      // Check second custom group
      expect(exportData.groups.customGroup2).toBeDefined();
      expect(exportData.groups.customGroup2.label).toBe('Custom Group 2');
      expect(exportData.groups.customGroup2.type).toBe('consumption');
      expect(exportData.groups.customGroup2.intensities).toEqual(['None', 'Beginner']);
      expect(exportData.groups.customGroup2.actions.None).toEqual([]);
      expect(exportData.groups.customGroup2.actions.Beginner).toEqual([]);

      // Check custom tiles section
      expect(exportData.customTiles).toBeDefined();
      expect(exportData.customTiles.customGroup1).toBeDefined();
      expect(exportData.customTiles.customGroup1[0]).toEqual(['No action required']);
      expect(exportData.customTiles.customGroup1[1]).toEqual([
        'Light action for group 1',
        'Another light action',
      ]);

      expect(exportData.customTiles.customGroup2).toBeDefined();
      expect(exportData.customTiles.customGroup2[1]).toEqual(['Beginner action for group 2']);

      // Default group should NOT be exported
      expect(exportData.groups.defaultGroup).toBeUndefined();
    });

    it('should export single group when specified', async () => {
      const result = await exportCleanData('en', {
        singleGroup: 'customGroup1',
        exportScope: 'single',
      });
      const exportData: CleanExportData = JSON.parse(result);

      expect(Object.keys(exportData.groups)).toHaveLength(1);
      expect(exportData.groups.customGroup1).toBeDefined();
      expect(exportData.groups.customGroup2).toBeUndefined();

      // Should only export custom tiles from the selected group
      expect(exportData.customTiles.customGroup1).toBeDefined();
      expect(exportData.customTiles.customGroup2).toBeUndefined();
    });

    it('should handle empty export when no custom groups exist', async () => {
      vi.mocked(getCustomGroups).mockResolvedValue([]);

      const result = await exportCleanData('en', { exportScope: 'all' });
      const exportData: CleanExportData = JSON.parse(result);

      expect(exportData.version).toBe('2.0.0');
      expect(Object.keys(exportData.groups)).toHaveLength(0);
      expect(Object.keys(exportData.customTiles)).toHaveLength(0);
    });

    it('should handle export errors gracefully', async () => {
      vi.mocked(getCustomGroups).mockRejectedValue(new Error('Database error'));

      await expect(exportCleanData('en', { exportScope: 'all' })).rejects.toThrow(
        'Export failed: Error: Database error'
      );
    });
  });

  describe('exportGroupData', () => {
    it('should export a single group correctly', async () => {
      vi.mocked(getCustomGroupByName).mockResolvedValue(mockCustomGroups[0]);

      const result = await exportGroupData('customGroup1', 'en');
      const exportData: CleanExportData = JSON.parse(result);

      expect(Object.keys(exportData.groups)).toHaveLength(1);
      expect(exportData.groups.customGroup1).toBeDefined();
      expect(exportData.groups.customGroup1.label).toBe('Custom Group 1');
    });
  });

  describe('importCleanData', () => {
    const sampleExportData: CleanExportData = {
      version: '2.0.0',
      locale: 'en',
      groups: {
        importedGroup: {
          label: 'Imported Group',
          type: 'sex',
          intensities: ['None', 'Light', 'Heavy'],
          actions: {
            None: [],
            Light: [],
            Heavy: [],
          },
        },
      },
      customTiles: {
        importedGroup: {
          '1': ['Light action 1', 'Light action 2'],
          '2': ['Heavy action 1'],
        },
      },
    };

    it('should import clean v2.0 format successfully', async () => {
      const importString = JSON.stringify(sampleExportData);
      const result = await importCleanData(importString);

      expect(result.success).toBe(true);
      expect(result.importedGroups).toBe(1);
      expect(result.importedTiles).toBe(3); // 0 + 2 + 1
      expect(result.errors).toHaveLength(0);

      // Verify group was added
      expect(addCustomGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'importedGroup',
          label: 'Imported Group',
          type: 'sex',
          intensities: expect.arrayContaining([
            expect.objectContaining({ label: 'None', value: 0 }),
            expect.objectContaining({ label: 'Light', value: 1 }),
            expect.objectContaining({ label: 'Heavy', value: 2 }),
          ]),
        })
      );

      // Verify tiles were added
      expect(addCustomTile).toHaveBeenCalledTimes(3);
    });

    it('should handle invalid JSON format', async () => {
      const result = await importCleanData('invalid json');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid JSON format');
    });

    it('should handle missing required fields', async () => {
      const invalidData = { version: '2.0.0' }; // Missing groups
      const result = await importCleanData(JSON.stringify(invalidData));

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        'Invalid export format - missing version, groups, or customTiles'
      );
    });

    it('should handle version mismatch with warning', async () => {
      const oldVersionData = { ...sampleExportData, version: '1.0.0' };
      const result = await importCleanData(JSON.stringify(oldVersionData));

      expect(result.warnings).toContain('Format version mismatch: expected 2.0.0, got 1.0.0');
    });

    it('should handle existing groups based on merge strategy', async () => {
      vi.mocked(getCustomGroupByName).mockResolvedValue(mockCustomGroups[0]);

      // Test skip strategy
      let result = await importCleanData(JSON.stringify(sampleExportData), {
        mergeStrategy: 'skip',
      });
      expect(result.warnings).toContain('Skipped existing group: importedGroup');

      // Test rename strategy
      result = await importCleanData(JSON.stringify(sampleExportData), {
        mergeStrategy: 'rename',
      });
      expect(result.warnings).toContain(
        'Renamed group from importedGroup to importedGroup_imported'
      );
    });

    it('should handle validation errors', async () => {
      vi.mocked(validateCustomGroup).mockResolvedValue({
        isValid: false,
        errors: ['Invalid group configuration'],
      });

      const result = await importCleanData(JSON.stringify(sampleExportData));

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid group importedGroup: Invalid group configuration');
    });
  });

  describe('autoImportData', () => {
    it('should detect and import clean v2.0 format', async () => {
      const cleanData = {
        version: '2.0.0',
        locale: 'en',
        groups: {
          testGroup: {
            label: 'Test Group',
            type: 'sex',
            intensities: ['None', 'Light'],
            actions: { None: [], Light: [] },
          },
        },
        customTiles: {
          testGroup: {
            '1': ['Test action'],
          },
        },
      };

      const result = await autoImportData(JSON.stringify(cleanData), {});

      expect(result.success).toBe(true);
      expect(result.importedGroups).toBe(1);
    });

    it('should reject old enhanced format', async () => {
      const oldEnhancedData = {
        version: '2.0.0',
        customGroups: [], // Old format indicator
        customTiles: [],
      };

      const result = await autoImportData(JSON.stringify(oldEnhancedData), {});

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        'Old enhanced format no longer supported. Please use clean v2.0 format.'
      );
    });

    it('should fall back to legacy format for non-JSON data', async () => {
      // Mock the dynamic import
      vi.doMock('./getUniqueImportRecords', () => ({
        default: vi.fn().mockReturnValue({
          newUniqueRecords: [
            { group: 'test', intensity: 1, action: 'test action', tags: [], isCustom: 1 },
          ],
          changedTagRecords: [],
        }),
      }));

      const legacyData = '[Test Group - Light]\nTest action';
      const result = await autoImportData(legacyData, {});

      // Should attempt legacy import
      expect(result.warnings).toContain(
        'Imported using legacy format. Consider exporting in clean v2.0 format for better compatibility.'
      );
    });
  });

  describe('generateExportSummary', () => {
    it('should generate correct summary for export data', () => {
      const exportData: CleanExportData = {
        version: '2.0.0',
        locale: 'en',
        groups: {
          group1: {
            label: 'Group 1',
            type: 'sex',
            intensities: ['None', 'Light'],
            actions: {
              None: [],
              Light: [],
            },
          },
          group2: {
            label: 'Group 2',
            type: 'consumption',
            intensities: ['None', 'Basic'],
            actions: {
              None: [],
              Basic: [],
            },
          },
        },
        customTiles: {
          group1: {
            '1': ['Action 1', 'Action 2'],
          },
          group2: {
            '1': ['Basic action'],
          },
        },
      };

      const summary = generateExportSummary(JSON.stringify(exportData));

      expect(summary).toContain('Export Summary:');
      expect(summary).toContain('Format Version: 2.0.0');
      expect(summary).toContain('Locale: en');
      expect(summary).toContain('Custom Groups: 2');
      expect(summary).toContain('Total Custom Tiles: 3');
      expect(summary).toContain('Group 1 (2 intensities, 2 tiles)');
      expect(summary).toContain('Group 2 (2 intensities, 1 tiles)');
    });

    it('should handle invalid export data', () => {
      const summary = generateExportSummary('invalid json');
      expect(summary).toBe('Unable to parse export data');
    });
  });

  describe('getAvailableGroupsForExport', () => {
    it('should return available custom groups with tile counts', async () => {
      const result = await getAvailableGroupsForExport('en');

      expect(result).toHaveLength(2); // Only custom groups, not default
      expect(result[0]).toEqual({
        name: 'customGroup1',
        label: 'Custom Group 1',
        tileCount: 3, // 3 tiles belong to customGroup1
      });
      expect(result[1]).toEqual({
        name: 'customGroup2',
        label: 'Custom Group 2',
        tileCount: 1, // 1 tile belongs to customGroup2
      });
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(getCustomGroups).mockRejectedValue(new Error('Database error'));

      const result = await getAvailableGroupsForExport('en');
      expect(result).toEqual([]);
    });

    it('should filter groups by locale and gameMode', async () => {
      const frenchGroups = [
        {
          ...mockCustomGroups[0],
          name: 'frenchGroup',
          label: 'French Group',
          locale: 'fr',
        },
      ];
      vi.mocked(getCustomGroups).mockResolvedValue(frenchGroups);

      const frenchTiles = [
        {
          id: 1,
          group: 'frenchGroup',
          intensity: 1,
          action: 'Action française',
          tags: [],
          isCustom: 1,
          gameMode: 'online',
          locale: 'fr',
        },
      ];
      vi.mocked(getTiles).mockResolvedValue(frenchTiles);

      const result = await getAvailableGroupsForExport('fr', 'online');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'frenchGroup',
        label: 'French Group',
        tileCount: 1,
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle groups with no tiles', async () => {
      vi.mocked(getTiles).mockResolvedValue([]);

      const result = await exportCleanData('en', 'online');
      const exportData: CleanExportData = JSON.parse(result);

      expect(exportData.groups.customGroup1.actions.None).toEqual([]);
      expect(exportData.groups.customGroup1.actions.Light).toEqual([]);
      expect(exportData.groups.customGroup1.actions.Medium).toEqual([]);
    });

    it('should handle groups with missing intensity levels', async () => {
      const incompleteGroup = {
        ...mockCustomGroups[0],
        intensities: [
          { id: 'int1', label: 'None', value: 0, isDefault: false },
          // Missing intensity level 1
          { id: 'int3', label: 'Heavy', value: 2, isDefault: false },
        ],
      };
      vi.mocked(getCustomGroups).mockResolvedValue([incompleteGroup]);

      const result = await exportCleanData('en', 'online');
      const exportData: CleanExportData = JSON.parse(result);

      expect(exportData.groups.customGroup1.intensities).toEqual(['None', 'Heavy']);
      expect(exportData.groups.customGroup1.actions.None).toBeDefined();
      expect(exportData.groups.customGroup1.actions.Heavy).toBeDefined();
    });

    it('should handle tiles with mismatched intensity values', async () => {
      const tilesWithMismatchedIntensity = [
        {
          id: 1,
          group: 'customGroup1',
          intensity: 99, // Non-existent intensity level
          action: 'Invalid intensity action',
          tags: [],
          isCustom: 1,
          gameMode: 'online',
          locale: 'en',
        },
      ];
      vi.mocked(getTiles).mockResolvedValue(tilesWithMismatchedIntensity);

      const result = await exportCleanData('en', 'online');
      const exportData: CleanExportData = JSON.parse(result);

      // Tile with invalid intensity should be ignored
      expect(Object.values(exportData.groups.customGroup1.actions).flat()).not.toContain(
        'Invalid intensity action'
      );
    });
  });
});
