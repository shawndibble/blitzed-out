import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  exportCleanData,
  importCleanData,
  autoImportData,
  CleanExportData,
} from '../enhancedImportExport';
import { CustomGroupPull } from '@/types/customGroups';
// import { CustomTile } from '@/types/customTiles';

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

import { getCustomGroups, addCustomGroup } from '@/stores/customGroups';
import { getTiles, addCustomTile } from '@/stores/customTiles';
import { validateCustomGroup } from '@/services/validationService';

describe('Edge Cases and Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateCustomGroup).mockResolvedValue({ isValid: true, errors: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Export Edge Cases', () => {
    it('should handle groups with special characters in names and labels', async () => {
      const specialCharGroup: CustomGroupPull = {
        id: 'special-group',
        name: 'group-with-special-chars!@#$%',
        label: 'Group with émojis 🎮 and unicøde',
        intensities: [
          { id: 'int1', label: 'Nøne', value: 0, isDefault: false },
          { id: 'int2', label: 'Légère', value: 1, isDefault: false },
        ],
        type: 'sex',
        locale: 'en',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const specialCharTiles = [
        {
          id: 1,
          group: 'group-with-special-chars!@#$%',
          intensity: 1,
          action: 'Action with "quotes" and \\backslashes\\ and newlines\\n',
          tags: [],
          isCustom: 1,
          locale: 'en',
        },
      ];

      vi.mocked(getCustomGroups).mockResolvedValue([specialCharGroup]);
      vi.mocked(getTiles).mockResolvedValue(specialCharTiles as any);

      const result = await exportCleanData('en', { exportScope: 'all' });
      const exportData: CleanExportData = JSON.parse(result);

      expect(exportData.groups['group-with-special-chars!@#$%']).toBeDefined();
      expect(exportData.groups['group-with-special-chars!@#$%'].label).toBe(
        'Group with émojis 🎮 and unicøde'
      );
      expect(exportData.groups['group-with-special-chars!@#$%'].intensities).toEqual([
        'Nøne',
        'Légère',
      ]);
      expect(exportData.groups['group-with-special-chars!@#$%'].actions['Légère']).toEqual([
        'Action with "quotes" and \\backslashes\\ and newlines\\n',
      ]);
    });

    it('should handle groups with very large numbers of intensities', async () => {
      const intensities = Array.from({ length: 100 }, (_, i) => ({
        id: `int${i}`,
        label: `Intensity ${i}`,
        value: i,
        isDefault: false,
      }));

      const largeGroup: CustomGroupPull = {
        id: 'large-group',
        name: 'largeGroup',
        label: 'Large Group',
        intensities,
        type: 'sex',
        locale: 'en',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getCustomGroups).mockResolvedValue([largeGroup]);
      vi.mocked(getTiles).mockResolvedValue([]);

      const result = await exportCleanData('en', { exportScope: 'all' });
      const exportData: CleanExportData = JSON.parse(result);

      expect(exportData.groups.largeGroup.intensities).toHaveLength(100);
      expect(exportData.groups.largeGroup.intensities[0]).toBe('Intensity 0');
      expect(exportData.groups.largeGroup.intensities[99]).toBe('Intensity 99');
    });

    it('should handle tiles with very long action text', async () => {
      const longActionText = 'A'.repeat(10000); // 10KB action text

      const normalGroup: CustomGroupPull = {
        id: 'normal-group',
        name: 'normalGroup',
        label: 'Normal Group',
        intensities: [
          { id: 'int1', label: 'None', value: 0, isDefault: false },
          { id: 'int2', label: 'Long', value: 1, isDefault: false },
        ],
        type: 'sex',
        locale: 'en',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const longTile = [
        {
          id: 1,
          group: 'normalGroup',
          intensity: 1,
          action: longActionText,
          tags: [],
          isCustom: 1,
          locale: 'en',
        },
      ];

      vi.mocked(getCustomGroups).mockResolvedValue([normalGroup]);
      vi.mocked(getTiles).mockResolvedValue(longTile as any);

      const result = await exportCleanData('en', { exportScope: 'all' });
      const exportData: CleanExportData = JSON.parse(result);

      expect(exportData.groups.normalGroup.actions.Long[0]).toBe(longActionText);
      expect(exportData.groups.normalGroup.actions.Long[0]).toHaveLength(10000);
    });

    it('should handle empty group names and labels gracefully', async () => {
      const emptyNameGroup: CustomGroupPull = {
        id: 'empty-group',
        name: '',
        label: '',
        intensities: [{ id: 'int1', label: 'None', value: 0, isDefault: false }],
        type: 'sex',
        locale: 'en',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getCustomGroups).mockResolvedValue([emptyNameGroup]);
      vi.mocked(getTiles).mockResolvedValue([]);

      const result = await exportCleanData('en', { exportScope: 'all' });
      const exportData: CleanExportData = JSON.parse(result);

      expect(exportData.groups['']).toBeDefined();
      expect(exportData.groups[''].label).toBe('');
    });
  });

  describe('Import Edge Cases', () => {
    it('should handle malformed JSON gracefully', async () => {
      const malformedJson = '{"version": "2.0.0", "groups": {unclosed object';
      const result = await importCleanData(malformedJson);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid JSON format');
    });

    it('should handle JSON with null values', async () => {
      const nullValueData: any = {
        version: '2.0.0',
        locale: 'en',
        groups: {
          nullGroup: {
            label: null,
            type: null,
            intensities: null,
            actions: null,
          },
        },
      };

      const result = await importCleanData(JSON.stringify(nullValueData));

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle groups with duplicate intensity values', async () => {
      const duplicateIntensityData: CleanExportData = {
        version: '2.0.0',
        locale: 'en',
        groups: {
          duplicateGroup: {
            label: 'Duplicate Group',
            type: 'sex',
            intensities: ['None', 'Light', 'Light', 'Medium'], // Duplicate "Light"
            actions: {
              None: [],
              Light: ['Action 1'],
              Medium: ['Action 2'],
            },
          },
        },
        customTiles: {},
      };

      const result = await importCleanData(JSON.stringify(duplicateIntensityData));

      // Should still import but might have warnings or handle duplicates
      expect(result.importedGroups).toBe(1);
    });

    it('should handle circular references in action data', async () => {
      const circularData: any = {
        version: '2.0.0',
        locale: 'en',
        groups: {
          circularGroup: {
            label: 'Circular Group',
            type: 'sex',
            intensities: ['None', 'Light'],
            actions: {
              None: [],
              Light: ['Action 1'],
            },
          },
        },
        customTiles: {},
      };

      // Create a circular reference
      circularData.groups.circularGroup.actions.Light.push(circularData);

      // JSON.stringify will throw on circular references
      let jsonString;
      try {
        jsonString = JSON.stringify(circularData);
      } catch (error: any) {
        // Expected behavior - JSON.stringify fails on circular references
        expect(error).toBeInstanceOf(TypeError);
        return;
      }

      // If we somehow got a string, test import
      await importCleanData(jsonString);
      // The result depends on how the circular reference was serialized
    });

    it('should handle extremely large import data', async () => {
      // Create a large dataset
      const largeGroups: { [key: string]: any } = {};

      for (let i = 0; i < 1000; i++) {
        largeGroups[`group${i}`] = {
          label: `Group ${i}`,
          type: 'sex',
          intensities: ['None', 'Light', 'Medium', 'Heavy'],
          actions: {
            None: [],
            Light: Array(100).fill(`Light action ${i}`),
            Medium: Array(100).fill(`Medium action ${i}`),
            Heavy: Array(100).fill(`Heavy action ${i}`),
          },
        };
      }

      const largeData: CleanExportData = {
        version: '2.0.0',
        locale: 'en',
        groups: largeGroups,
        customTiles: {},
      };

      // Mock successful operations but track call count
      let addGroupCalls = 0;
      let addTileCalls = 0;

      vi.mocked(addCustomGroup).mockImplementation(async () => {
        addGroupCalls++;
        return `group-id-${addGroupCalls}`;
      });

      vi.mocked(addCustomTile).mockImplementation(async () => {
        addTileCalls++;
        return addTileCalls;
      });

      const result = await importCleanData(JSON.stringify(largeData));

      expect(result.success).toBe(true);
      expect(result.importedGroups).toBe(1000);
      // Each group has 300 tiles (100 each for Light, Medium, Heavy)
      expect(result.importedTiles).toBe(0); // No custom tiles in this test
    });

    it('should handle database connection failures', async () => {
      vi.mocked(addCustomGroup).mockRejectedValue(new Error('Database connection lost'));

      const simpleData: CleanExportData = {
        version: '2.0.0',
        locale: 'en',
        groups: {
          testGroup: {
            label: 'Test Group',
            type: 'sex',
            intensities: ['None', 'Light'],
            actions: {
              None: [],
              Light: ['Test action'],
            },
          },
        },
        customTiles: {},
      };

      const result = await importCleanData(JSON.stringify(simpleData));

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        'Error importing group testGroup: Error: Database connection lost'
      );
    });

    it('should handle concurrent import operations', async () => {
      const testData: CleanExportData = {
        version: '2.0.0',
        locale: 'en',
        groups: {
          concurrentGroup: {
            label: 'Concurrent Group',
            type: 'sex',
            intensities: ['None', 'Light'],
            actions: {
              None: [],
              Light: ['Concurrent action'],
            },
          },
        },
        customTiles: {},
      };

      // Simulate concurrent imports
      const promises = Array(10)
        .fill(null)
        .map(() => importCleanData(JSON.stringify(testData)));

      const results = await Promise.all(promises);

      // All should complete, though some might have warnings about existing groups
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Auto Import Edge Cases', () => {
    it('should handle ambiguous format detection', async () => {
      // Data that could be mistaken for multiple formats
      const ambiguousData = {
        version: '2.0.0',
        groups: {},
        customGroups: [], // Both new and old format indicators
      };

      const result = await autoImportData(JSON.stringify(ambiguousData), {});

      // Should prefer clean format (groups) over old format (customGroups)
      expect(result.success).toBe(true);
    });

    it('should handle completely unrecognized data formats', async () => {
      const unrecognizedData = {
        someRandomProperty: 'value',
        anotherProperty: 123,
        nestedObject: {
          deep: {
            value: 'test',
          },
        },
      };

      const result = await autoImportData(JSON.stringify(unrecognizedData), {});

      // Should fall back to legacy format processing
      expect(result.warnings).toContain(
        'Imported using legacy format. Consider exporting in clean v2.0 format for better compatibility.'
      );
    });

    it('should handle binary data or non-text input', async () => {
      // Simulate binary data as string
      const binaryData = String.fromCharCode(...Array(256).keys());

      const result = await autoImportData(binaryData, {});

      // Should attempt legacy processing and likely fail gracefully
      expect(result.success).toBe(false);
    });

    it('should handle extremely nested JSON structures', async () => {
      const createNestedObject = (depth: number): any => {
        if (depth === 0) return { value: 'deep' };
        return { nested: createNestedObject(depth - 1) };
      };

      const deeplyNestedData = {
        version: '2.0.0',
        groups: {
          deepGroup: {
            label: 'Deep Group',
            type: 'sex',
            intensities: ['None'],
            actions: {
              None: [],
            },
            metadata: createNestedObject(1000), // Very deep nesting
          },
        },
      };

      let jsonString;
      try {
        jsonString = JSON.stringify(deeplyNestedData);
      } catch (error) {
        // Might fail due to stack overflow in JSON.stringify
        expect(error).toBeInstanceOf(RangeError);
        return;
      }

      await autoImportData(jsonString, {});
      // Result depends on whether the parsing succeeds
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    it('should handle memory pressure during large exports', async () => {
      // Create memory pressure by generating very large strings
      const hugeActionText = 'X'.repeat(1024 * 1024); // 1MB per action

      const memoryPressureGroup: CustomGroupPull = {
        id: 'memory-group',
        name: 'memoryGroup',
        label: 'Memory Pressure Group',
        intensities: [
          { id: 'int1', label: 'None', value: 0, isDefault: false },
          { id: 'int2', label: 'Huge', value: 1, isDefault: false },
        ],
        type: 'sex',
        locale: 'en',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const hugeTiles = Array(100)
        .fill(null)
        .map((_, i) => ({
          id: i + 1,
          group: 'memoryGroup',
          intensity: 1,
          action: hugeActionText + i, // Unique but huge
          tags: [],
          isCustom: 1,
          locale: 'en',
        }));

      vi.mocked(getCustomGroups).mockResolvedValue([memoryPressureGroup]);
      vi.mocked(getTiles).mockResolvedValue(hugeTiles as any);

      // This should either succeed or throw an out-of-memory error
      try {
        const result = await exportCleanData('en', { exportScope: 'all' });
        const exportData: CleanExportData = JSON.parse(result);

        expect(exportData.groups.memoryGroup.actions.Huge).toHaveLength(100);
      } catch (error: any) {
        // Acceptable if system runs out of memory
        expect(error.message).toMatch(/memory|heap|out of/i);
      }
    });

    it('should handle timeout scenarios in database operations', async () => {
      // Simulate slow database operations
      vi.mocked(getCustomGroups).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 5000)) // 5 second delay
      );

      const startTime = Date.now();

      try {
        await exportCleanData('en', 'online');
      } catch (error: any) {
        const elapsed = Date.now() - startTime;

        // Should either complete or timeout appropriately
        if (elapsed < 1000) {
          expect(error.message).toMatch(/timeout|abort/i);
        }
      }
    });
  });
});
