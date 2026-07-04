import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  exportAllData,
  importData,
  analyzeImportConflicts,
  importFromJson,
} from '@/services/importExport';
import { getExportableGroupStats } from '@/services/importExport/exportService';
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

vi.mock('@/services/contentHashing', () => ({
  generateGroupContentHash: vi.fn(),
  generateTileContentHash: vi.fn(),
  generateDisabledDefaultContentHash: vi.fn(),
  generateExtensionContentHash: vi.fn(),
}));

vi.mock('@/services/importExport/databaseOperations', () => ({
  batchFetchAllGroups: vi.fn(),
}));

// Import mocked functions
import { getCustomGroups, addCustomGroup, updateCustomGroup } from '@/stores/customGroups';
import { getTiles, addCustomTile, updateCustomTile } from '@/stores/customTiles';
import {
  generateGroupContentHash,
  generateTileContentHash,
  generateDisabledDefaultContentHash,
  generateExtensionContentHash,
} from '@/services/contentHashing';
import { batchFetchAllGroups } from '@/services/importExport/databaseOperations';

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
    vi.mocked(batchFetchAllGroups).mockResolvedValue([mockGroup]);
    vi.mocked(generateGroupContentHash).mockResolvedValue('mock-hash-group');
    vi.mocked(generateTileContentHash).mockResolvedValue('mock-hash-tile');
    vi.mocked(generateDisabledDefaultContentHash).mockResolvedValue('mock-hash-disabled');
    vi.mocked(generateExtensionContentHash).mockResolvedValue('mock-hash-extension');
    vi.mocked(addCustomGroup).mockResolvedValue('new-group-id');
    vi.mocked(addCustomTile).mockResolvedValue(1);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('exportAllData', () => {
    it('should export data successfully with default options', async () => {
      const result = await exportAllData();

      // Should call getCustomGroups twice: once with isDefault: false, once without filters
      expect(getCustomGroups).toHaveBeenCalledWith({
        isDefault: false,
      });
      expect(getCustomGroups).toHaveBeenCalledWith({});
      // Should call getTiles with isCustom: 1 to get all custom tiles
      expect(getTiles).toHaveBeenCalledWith({
        isCustom: 1,
      });

      const exportData = JSON.parse(result);
      expect(exportData.formatVersion).toBe('2.1.0');
      expect(exportData.data.customGroups).toHaveLength(1);
      expect(exportData.data.customTiles).toHaveLength(1);
      expect(exportData.data.disabledDefaultTiles).toHaveLength(0);
    });

    it('should include disabled defaults by default for all exports', async () => {
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
        isDefault: false,
      });
    });

    it('should export only the selected groupNames (content-pack multi-select)', async () => {
      const groups = [
        { ...mockGroup, id: 'g-1', name: 'alpha' },
        { ...mockGroup, id: 'g-2', name: 'beta' },
        { ...mockGroup, id: 'g-3', name: 'gamma' },
      ];
      const tiles = [
        { ...mockTile, id: 1, group_id: 'g-1', action: 'Alpha action' },
        { ...mockTile, id: 2, group_id: 'g-2', action: 'Beta action' },
        { ...mockTile, id: 3, group_id: 'g-3', action: 'Gamma action' },
      ];
      vi.mocked(getCustomGroups).mockResolvedValue(groups as any);
      vi.mocked(getTiles).mockResolvedValue(tiles as any);

      const result = await exportAllData({ groupNames: ['alpha', 'gamma'] });
      const exportData = JSON.parse(result);

      const exportedGroupNames = exportData.data.customGroups.map((g: any) => g.name).sort();
      expect(exportedGroupNames).toEqual(['alpha', 'gamma']);
      const exportedActions = exportData.data.customTiles.map((t: any) => t.action).sort();
      expect(exportedActions).toEqual(['Alpha action', 'Gamma action']);
    });

    it('should call progress callback if provided', async () => {
      const progressCallback = vi.fn();

      await exportAllData({}, progressCallback);

      expect(progressCallback).toHaveBeenCalledWith('Analyzing exportable data', 0, 100);
      expect(progressCallback).toHaveBeenCalledWith('Finalizing export', 100, 100);
    });

    it('should handle export errors gracefully', async () => {
      vi.mocked(getCustomGroups).mockRejectedValue(new Error('Database error'));

      await expect(exportAllData()).rejects.toThrow('Export failed');
    });

    it('should filter by locales and gameModes when provided', async () => {
      // Mock multiple groups with different locales and gameModes
      const groups = [
        { ...mockGroup, id: 'group-1', name: 'group1', locale: 'en', gameMode: 'online' },
        { ...mockGroup, id: 'group-2', name: 'group2', locale: 'es', gameMode: 'online' },
        { ...mockGroup, id: 'group-3', name: 'group3', locale: 'en', gameMode: 'local' },
        { ...mockGroup, id: 'group-4', name: 'group4', locale: 'fr', gameMode: 'local' },
      ];

      // Mock tiles for each group
      const tiles = [
        { ...mockTile, id: 1, group_id: 'group-1', action: 'Action 1' },
        { ...mockTile, id: 2, group_id: 'group-2', action: 'Action 2' },
        { ...mockTile, id: 3, group_id: 'group-3', action: 'Action 3' },
        { ...mockTile, id: 4, group_id: 'group-4', action: 'Action 4' },
      ];

      vi.mocked(getCustomGroups).mockImplementation((filters: any) => {
        if (filters.isDefault === false) {
          // Return only custom groups for the first query
          return Promise.resolve(groups.filter((g) => !g.isDefault));
        }
        // Return all groups for the second query
        return Promise.resolve(groups);
      });

      vi.mocked(getTiles).mockResolvedValue(tiles as any);

      // Test filtering by specific locales and gameModes
      const result = await exportAllData({
        locales: ['en', 'es'], // Filter to English and Spanish only
        gameModes: ['online'], // Filter to online mode only
      });

      const exportData = JSON.parse(result);

      // Should only include groups that match en/es locales AND online gameMode
      // This should be: group-1 (en, online) and group-2 (es, online)
      // Should exclude: group-3 (en, local) and group-4 (fr, local)
      expect(exportData.data.customGroups).toHaveLength(2);
      expect(exportData.data.customTiles).toHaveLength(2);

      const exportedGroupNames = exportData.data.customGroups.map((g: any) => g.name);
      expect(exportedGroupNames).toContain('group1');
      expect(exportedGroupNames).toContain('group2');
      expect(exportedGroupNames).not.toContain('group3');
      expect(exportedGroupNames).not.toContain('group4');
    });

    it('should ignore invalid locales and gameModes', async () => {
      vi.mocked(getCustomGroups).mockResolvedValue([mockGroup]);
      vi.mocked(getTiles).mockResolvedValue([mockTile as any]);

      // Test with invalid values mixed with valid ones
      const result = await exportAllData({
        locales: ['en', 'invalid-locale' as any, 'es'], // Should ignore invalid-locale
        gameModes: ['online', 'invalid-mode' as any, 'local'], // Should ignore invalid-mode
      });

      // Should not throw error and should process normally
      expect(result).toBeDefined();
      const exportData = JSON.parse(result);
      expect(exportData.data.customGroups).toHaveLength(1);
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

    it('should never replace a default group record (corruption guard)', async () => {
      const defaultGroup = {
        ...mockGroup,
        id: 'default-group-1',
        isDefault: true,
      };
      vi.mocked(getCustomGroups).mockResolvedValue([defaultGroup]);
      vi.mocked(batchFetchAllGroups).mockResolvedValue([defaultGroup]);
      vi.mocked(getTiles).mockResolvedValue([]);
      vi.mocked(generateGroupContentHash).mockResolvedValue('different-hash');

      const result = await importData(mockExportData);

      expect(updateCustomGroup).not.toHaveBeenCalled();
      expect(addCustomGroup).not.toHaveBeenCalled();
      expect(result.warnings).toContain(
        'Skipped group "testGroup": default groups cannot be replaced by imports'
      );
      // The tile targeting the default group still imports.
      expect(addCustomTile).toHaveBeenCalledWith(
        expect.objectContaining({ group_id: 'default-group-1', action: 'Test action' })
      );
    });

    describe('groupExtensions (2.1.0)', () => {
      const defaultGroup: CustomGroupPull = {
        ...mockGroup,
        id: 'default-group-1',
        name: 'ballBusting',
        label: 'Ball Busting',
        isDefault: true,
        intensities: [
          { id: 'bb-1', label: 'Slap/Squeeze', value: 1, isDefault: true },
          { id: 'bb-2', label: 'Punch/Crush', value: 2, isDefault: true },
        ],
      };

      const extensionPayload: ExportData = {
        formatVersion: '2.1.0',
        exportedAt: new Date().toISOString(),
        data: {
          customGroups: [],
          customTiles: [
            {
              action: 'New tile at appended level',
              groupName: 'ballBusting',
              intensity: 3,
              tags: [],
              gameMode: 'online',
              locale: 'en',
              isEnabled: true,
              contentHash: 'hash-new-tile',
            },
          ],
          disabledDefaultTiles: [],
          groupExtensions: [
            {
              groupName: 'ballBusting',
              groupLabel: 'Ball Busting',
              locale: 'en',
              gameMode: 'online',
              addedIntensities: [{ value: 3, label: 'Rubber Bands' }],
              contentHash: 'hash-ext',
            },
          ],
        },
      };

      beforeEach(() => {
        vi.mocked(getCustomGroups).mockResolvedValue([defaultGroup]);
        vi.mocked(getTiles).mockResolvedValue([]);
      });

      it('appends intensities to the default group and imports tiles at the new level', async () => {
        const result = await importData(extensionPayload);

        expect(updateCustomGroup).toHaveBeenCalledWith('default-group-1', {
          intensities: [
            expect.objectContaining({ value: 1, isDefault: true }),
            expect.objectContaining({ value: 2, isDefault: true }),
            expect.objectContaining({
              id: 'ballBusting-ext-3',
              label: 'Rubber Bands',
              value: 3,
              isDefault: false,
            }),
          ],
        });
        expect(result.importedIntensities).toBe(1);
        // Tile at the appended level passes intensity validation.
        expect(addCustomTile).toHaveBeenCalledWith(
          expect.objectContaining({
            group_id: 'default-group-1',
            action: 'New tile at appended level',
            intensity: 3,
          })
        );
        expect(result.importedTiles).toBe(1);
        expect(result.success).toBe(true);
      });

      it('is idempotent: re-import with the level already present skips without updating', async () => {
        const extendedGroup = {
          ...defaultGroup,
          intensities: [
            ...defaultGroup.intensities,
            { id: 'ballBusting-ext-3', label: 'Rubber Bands', value: 3, isDefault: false },
          ],
        };
        vi.mocked(getCustomGroups).mockResolvedValue([extendedGroup]);

        const result = await importData(extensionPayload);

        expect(updateCustomGroup).not.toHaveBeenCalled();
        expect(result.importedIntensities).toBe(0);
        expect(result.success).toBe(true);
      });

      it('skips extensions targeting non-default groups', async () => {
        const customNamedGroup = { ...defaultGroup, isDefault: false };
        vi.mocked(getCustomGroups).mockResolvedValue([customNamedGroup]);

        const result = await importData(extensionPayload);

        expect(updateCustomGroup).not.toHaveBeenCalled();
        expect(result.warnings).toContain(
          'Skipped extension for non-default group "ballBusting": custom groups travel as full definitions'
        );
      });

      it('skips extensions for missing groups', async () => {
        vi.mocked(getCustomGroups).mockResolvedValue([]);

        const result = await importData(extensionPayload);

        expect(updateCustomGroup).not.toHaveBeenCalled();
        expect(result.warnings).toContain(
          'Skipped extension for missing group: ballBusting (en/online)'
        );
      });

      it('exports appended intensities as groupExtensions, never the default ladder', async () => {
        const extendedGroup = {
          ...defaultGroup,
          intensities: [
            ...defaultGroup.intensities,
            { id: 'ballBusting-ext-3', label: 'Rubber Bands', value: 3, isDefault: false },
          ],
        };
        vi.mocked(getCustomGroups).mockImplementation((filters?: any) => {
          if (filters && filters.isDefault === false) return Promise.resolve([]);
          return Promise.resolve([extendedGroup]);
        });
        vi.mocked(getTiles).mockResolvedValue([]);

        const exported = JSON.parse(
          await exportAllData({ groupNames: ['ballBusting'] })
        ) as ExportData;

        expect(exported.formatVersion).toBe('2.1.0');
        expect(exported.data.customGroups).toEqual([]);
        expect(exported.data.groupExtensions).toEqual([
          {
            groupName: 'ballBusting',
            groupLabel: 'Ball Busting',
            locale: 'en',
            gameMode: 'online',
            addedIntensities: [{ value: 3, label: 'Rubber Bands' }],
            contentHash: 'mock-hash-extension',
          },
        ]);
      });

      it('omits groupExtensions when no default group carries custom levels', async () => {
        const exported = JSON.parse(await exportAllData({})) as ExportData;
        expect(exported.data.groupExtensions).toBeUndefined();
      });
    });

    it('should attach tiles from group-less payloads to existing same-named groups', async () => {
      vi.mocked(getTiles).mockResolvedValue([]);
      const importDataWithoutGroups = {
        ...mockExportData,
        data: {
          customGroups: [], // No groups in import data
          customTiles: [mockExportData.data.customTiles[0]], // Tile references existing testGroup
          disabledDefaultTiles: [],
        },
      };

      const result = await importData(importDataWithoutGroups);

      expect(addCustomTile).toHaveBeenCalledWith(
        expect.objectContaining({ group_id: 'test-group-1', action: 'Test action' })
      );
      expect(result.importedTiles).toBe(1);
    });

    it('should skip tiles for missing groups', async () => {
      const importDataWithMissingGroup = {
        ...mockExportData,
        data: {
          customGroups: [],
          customTiles: [{ ...mockExportData.data.customTiles[0], groupName: 'nonexistentGroup' }],
          disabledDefaultTiles: [],
        },
      };

      const result = await importData(importDataWithMissingGroup);

      expect(result.warnings).toContain(
        'Skipped tile for missing group: nonexistentGroup (en/online)'
      );
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

    it('should use correct locale from imported group when processing disabled defaults', async () => {
      const frenchGroup: CustomGroupPull = {
        id: 'french-group-1',
        name: 'frenchGroup',
        label: 'French Group',
        intensities: [{ id: 'int-1', label: 'Léger', value: 1, isDefault: true }],
        type: 'solo',
        isDefault: true, // This is a default group in French locale
        locale: 'fr',
        gameMode: 'online',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDisabledDefault = {
        id: 3,
        group_id: 'french-group-1',
        intensity: 1,
        action: 'Action française',
        tags: ['default'],
        isEnabled: 1, // Currently enabled, should be disabled
        isCustom: 0,
      };

      const importDataWithFrenchDisabled = {
        formatVersion: '2.0.0',
        exportedAt: new Date().toISOString(),
        data: {
          customGroups: [
            {
              name: 'frenchGroup',
              label: 'French Group',
              gameMode: 'online',
              locale: 'fr', // French locale in imported group
              type: 'action',
              intensities: [{ value: 1, label: 'Léger' }],
              contentHash: 'mock-hash-french-group',
            },
          ],
          customTiles: [],
          disabledDefaultTiles: [
            {
              action: 'Action française',
              groupName: 'frenchGroup',
              intensity: 1,
              gameMode: 'online',
              contentHash: 'mock-hash-disabled-french',
            },
          ],
        },
      };

      // Mock getCustomGroups to return the French default group when queried with French locale
      vi.mocked(getCustomGroups).mockImplementation((filters: any) => {
        if (filters?.locale === 'fr' && filters?.gameMode === 'online') {
          return Promise.resolve([frenchGroup]);
        }
        return Promise.resolve([]);
      });

      // Mock getTiles to return the French default tile when looking for it
      vi.mocked(getTiles).mockImplementation((filters: any) => {
        if (filters?.isCustom === 0 && filters?.group_id === 'french-group-1') {
          return Promise.resolve([mockDisabledDefault as any]);
        }
        return Promise.resolve([]);
      });

      const result = await importData(importDataWithFrenchDisabled, {
        preserveDisabledDefaults: true,
      });

      // Verify that getCustomGroups was called with the correct French locale
      expect(getCustomGroups).toHaveBeenCalledWith({
        locale: 'fr', // Should use French locale from imported group, not hardcoded 'en'
        gameMode: 'online',
      });

      // Verify the tile was updated
      expect(updateCustomTile).toHaveBeenCalledWith(
        3,
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
      // Test with minimal options (includeDisabledDefaults now defaults to true)
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

  describe('Export Service', () => {
    describe('getExportableGroupStats', () => {
      it('should return only groups with exportable content', async () => {
        // Mock the batchFetchAllGroups function to return only custom groups
        vi.mocked(batchFetchAllGroups).mockResolvedValue([
          {
            id: 'custom-group-1',
            name: 'customGroup',
            label: 'Custom Group',
            isDefault: false,
          },
        ] as any);

        // Mock getTiles to return different data based on new query approach
        vi.mocked(getTiles).mockImplementation((filters: any) => {
          if (filters.isCustom === 1) {
            // Return all custom tiles with group_id references
            return Promise.resolve([
              { id: 1, action: 'Custom tile', group_id: 'custom-group-1' },
            ] as any);
          }
          if (filters.isCustom === 0 && filters.isEnabled === 0) {
            // Return all disabled default tiles with group_id references
            return Promise.resolve([
              { id: 2, action: 'Disabled default', group_id: 'custom-group-1' },
            ] as any);
          }
          return Promise.resolve([]);
        });

        const result = await getExportableGroupStats(true);

        expect(result).toHaveLength(1); // Only custom groups with content

        const customGroup = result.find((g) => g.name === 'customGroup');
        expect(customGroup).toBeDefined();
        expect(customGroup?.exportCount.customGroups).toBe(1); // Group itself is custom
        expect(customGroup?.exportCount.customTiles).toBe(1); // Has 1 custom tile
        expect(customGroup?.exportCount.disabledDefaults).toBe(1); // Has 1 disabled default
        expect(customGroup?.exportCount.total).toBe(3); // Total: 1 + 1 + 1

        // Default groups should not be included in the results (only custom groups)
        const defaultGroup = result.find((g) => g.name === 'defaultGroup');
        expect(defaultGroup).toBeUndefined();
      });

      it('should exclude disabled defaults when includeDisabledDefaults is false', async () => {
        // Mock to return a custom group that has no content
        vi.mocked(batchFetchAllGroups).mockResolvedValue([]);
        vi.mocked(getTiles).mockResolvedValue([]);

        const result = await getExportableGroupStats(false);

        expect(result).toHaveLength(0); // No exportable content when no custom groups have content
      });

      it('should handle export scope filtering correctly', async () => {
        // Mock a custom group for testing
        const customGroup = {
          id: 'custom-group-1',
          name: 'customGroup',
          label: 'Custom Group',
          isDefault: false,
        };

        vi.mocked(batchFetchAllGroups).mockResolvedValue([customGroup] as any);
        vi.mocked(getTiles).mockImplementation((filters: any) => {
          if (filters.isCustom === 1) {
            // Return a custom tile for the custom group
            return Promise.resolve([
              { id: 1, action: 'Custom tile', group_id: 'custom-group-1' },
            ] as any);
          }
          if (filters.isCustom === 0 && filters.isEnabled === 0) {
            return Promise.resolve([
              { id: 2, action: 'Disabled', group_id: 'custom-group-1' },
            ] as any);
          }
          return Promise.resolve([]);
        });

        // Test 'disabled' scope - should include groups that have disabled defaults (even custom groups)
        const disabledResult = await getExportableGroupStats(false, 'disabled');
        expect(disabledResult).toHaveLength(1); // Custom group has disabled defaults, so it's included
        expect(disabledResult[0].exportCount.disabledDefaults).toBe(1);
        expect(disabledResult[0].exportCount.customGroups).toBe(0); // Group itself not counted as custom in disabled scope
        expect(disabledResult[0].exportCount.customTiles).toBe(0); // Custom tiles not counted in disabled scope

        // Test 'custom' scope - should exclude disabled defaults but include custom groups
        const customResult = await getExportableGroupStats(false, 'custom');
        expect(customResult).toHaveLength(1); // Custom group has custom tiles and is a custom group
        expect(customResult[0].exportCount.customGroups).toBe(1);
        expect(customResult[0].exportCount.customTiles).toBe(1);
        expect(customResult[0].exportCount.disabledDefaults).toBe(0); // Disabled defaults not counted in custom scope
      });

      it('should handle single scope filtering correctly', async () => {
        // Mock two custom groups for testing
        const customGroup1 = {
          id: 'custom-group-1',
          name: 'customGroup1',
          label: 'Custom Group 1',
          isDefault: false,
        };
        const customGroup2 = {
          id: 'custom-group-2',
          name: 'customGroup2',
          label: 'Custom Group 2',
          isDefault: false,
        };

        vi.mocked(batchFetchAllGroups).mockResolvedValue([customGroup1, customGroup2] as any);
        vi.mocked(getTiles).mockImplementation((filters: any) => {
          if (filters.isCustom === 1) {
            // Return custom tiles for both groups
            return Promise.resolve([
              { id: 1, action: 'Custom tile 1', group_id: 'custom-group-1' },
              { id: 2, action: 'Custom tile 2', group_id: 'custom-group-2' },
            ] as any);
          }
          if (filters.isCustom === 0 && filters.isEnabled === 0) {
            return Promise.resolve([
              { id: 3, action: 'Disabled 1', group_id: 'custom-group-1' },
              { id: 4, action: 'Disabled 2', group_id: 'custom-group-2' },
            ] as any);
          }
          return Promise.resolve([]);
        });

        // Test 'single' scope - currently returns all groups (single group parameter not yet implemented)
        const singleResult = await getExportableGroupStats(true, 'single');

        // Verify that the function returns data for both groups
        expect(singleResult).toHaveLength(2);

        // Find the groups by name to verify they match the mocked tiles
        const group1 = singleResult.find((g) => g.name === 'customGroup1');
        const group2 = singleResult.find((g) => g.name === 'customGroup2');

        expect(group1).toBeDefined();
        expect(group1?.exportCount.customGroups).toBe(1); // Group itself is custom
        expect(group1?.exportCount.customTiles).toBe(1); // One custom tile
        expect(group1?.exportCount.disabledDefaults).toBe(1); // One disabled default
        expect(group1?.exportCount.total).toBe(3); // Total matches sum

        expect(group2).toBeDefined();
        expect(group2?.exportCount.customGroups).toBe(1); // Group itself is custom
        expect(group2?.exportCount.customTiles).toBe(1); // One custom tile
        expect(group2?.exportCount.disabledDefaults).toBe(1); // One disabled default
        expect(group2?.exportCount.total).toBe(3); // Total matches sum
      });
    });

    describe('composite-key group resolution (mixed locale/gameMode payloads)', () => {
      it('routes same-named extensions to the correct gameMode group', async () => {
        const onlineGroup: CustomGroupPull = {
          id: 'bb-en-online',
          name: 'ballBusting',
          label: 'Ball Busting',
          intensities: [
            { id: 'd1', label: 'L1', value: 1, isDefault: true },
            { id: 'd2', label: 'L2', value: 2, isDefault: true },
          ],
          type: 'sex',
          isDefault: true,
          locale: 'en',
          gameMode: 'online',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const localGroup: CustomGroupPull = {
          ...onlineGroup,
          id: 'bb-en-local',
          gameMode: 'local',
        };

        vi.mocked(getCustomGroups).mockImplementation((filters: any) =>
          Promise.resolve(
            filters?.gameMode === 'local'
              ? [localGroup]
              : filters?.gameMode === 'online'
                ? [onlineGroup]
                : []
          )
        );
        vi.mocked(getTiles).mockResolvedValue([]);

        const payload: ExportData = {
          formatVersion: '2.1.0',
          exportedAt: new Date().toISOString(),
          data: {
            customGroups: [],
            customTiles: [],
            disabledDefaultTiles: [],
            groupExtensions: [
              {
                groupName: 'ballBusting',
                groupLabel: 'Ball Busting',
                locale: 'en',
                gameMode: 'online',
                addedIntensities: [{ value: 3, label: 'Online Extra' }],
                contentHash: 'h1',
              },
              {
                groupName: 'ballBusting',
                groupLabel: 'Ball Busting',
                locale: 'en',
                gameMode: 'local',
                addedIntensities: [{ value: 4, label: 'Local Extra' }],
                contentHash: 'h2',
              },
            ],
          },
        };

        await importData(payload);

        const onlineCall = vi
          .mocked(updateCustomGroup)
          .mock.calls.find((c) => c[0] === 'bb-en-online');
        const localCall = vi
          .mocked(updateCustomGroup)
          .mock.calls.find((c) => c[0] === 'bb-en-local');

        expect(onlineCall).toBeDefined();
        expect(localCall).toBeDefined();
        expect((onlineCall![1] as any).intensities.map((i: any) => i.value)).toEqual([1, 2, 3]);
        expect((localCall![1] as any).intensities.map((i: any) => i.value)).toEqual([1, 2, 4]);
      });

      it('disables a non-en default tile by recovering locale from the extension entry', async () => {
        const frGroup: CustomGroupPull = {
          id: 'bb-fr-online',
          name: 'ballBusting',
          label: 'Coups aux testicules',
          intensities: [{ id: 'd1', label: 'N1', value: 1, isDefault: true }],
          type: 'sex',
          isDefault: true,
          locale: 'fr',
          gameMode: 'online',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(getCustomGroups).mockImplementation((filters: any) =>
          Promise.resolve(filters?.locale === 'fr' ? [frGroup] : [])
        );
        // Context build queries by group_id (custom tiles) → none; the disable
        // lookup queries by isCustom:0 + action → the default tile to disable.
        vi.mocked(getTiles).mockImplementation((f: any) =>
          Promise.resolve(
            f?.isCustom === 0 && f?.action
              ? ([{ id: 99, action: 'Frapper', intensity: 1, isEnabled: 1 }] as any)
              : []
          )
        );

        const payload: ExportData = {
          formatVersion: '2.1.0',
          exportedAt: new Date().toISOString(),
          data: {
            customGroups: [],
            customTiles: [],
            disabledDefaultTiles: [
              {
                action: 'Frapper',
                groupName: 'ballBusting',
                intensity: 1,
                gameMode: 'online',
                contentHash: 'h',
              },
            ],
            // Provides the fr locale the disabled-default entry lacks.
            groupExtensions: [
              {
                groupName: 'ballBusting',
                groupLabel: 'Coups',
                locale: 'fr',
                gameMode: 'online',
                addedIntensities: [],
                contentHash: 'hx',
              },
            ],
          },
        };

        await importData(payload, { preserveDisabledDefaults: true });

        // The fr default tile (id 99) is disabled — proof the locale resolved to
        // 'fr', not the forced 'en' that would have missed the group entirely.
        expect(vi.mocked(updateCustomTile)).toHaveBeenCalledWith(
          99,
          expect.objectContaining({ isEnabled: 0 })
        );
      });
    });
  });
});
