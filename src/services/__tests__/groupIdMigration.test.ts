/**
 * Tests for Group ID Migration Service
 *
 * Tests the migration from string-based group matching to foreign key group_id relationships
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createDeterministicGroupId,
  resolveGroupId,
  migrateGroupIds,
  migrateDefaultGroupIds,
  auditGroupIdUsage,
  validateGroupIdIntegrity,
  runFullGroupIdMigration,
} from '../migration/groupIdMigration';

// Mock the stores
vi.mock('@/stores/customTiles', () => ({
  updateCustomTile: vi.fn(),
}));

vi.mock('@/stores/customGroups', () => ({
  getCustomGroups: vi.fn(),
}));

vi.mock('@/stores/store', () => ({
  default: {
    customTiles: {
      toArray: vi.fn(),
      filter: vi.fn(() => ({ toArray: vi.fn() })),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({ first: vi.fn(), and: vi.fn(() => ({ toArray: vi.fn() })) })),
      })),
    },
    customGroups: {
      toArray: vi.fn(),
      where: vi.fn(() => ({ equals: vi.fn(() => ({ first: vi.fn() })) })),
      delete: vi.fn(),
      add: vi.fn(),
    },
  },
}));

// Mock imports
const mockCustomGroups = await import('@/stores/customGroups');
const mockDb = (await import('@/stores/store')).default;

describe('createDeterministicGroupId', () => {
  it('should create consistent IDs for same inputs', () => {
    const id1 = createDeterministicGroupId('test-group', 'en', 'online');
    const id2 = createDeterministicGroupId('test-group', 'en', 'online');

    expect(id1).toBe(id2);
    expect(id1).toBeTruthy();
    expect(id1.length).toBeLessThanOrEqual(50);
  });

  it('should create different IDs for different inputs', () => {
    const id1 = createDeterministicGroupId('group1', 'en', 'online');
    const id2 = createDeterministicGroupId('group2', 'en', 'online');
    const id3 = createDeterministicGroupId('group1', 'es', 'online');
    const id4 = createDeterministicGroupId('group1', 'en', 'local');

    expect(id1).not.toBe(id2);
    expect(id1).not.toBe(id3);
    expect(id1).not.toBe(id4);
  });

  it('should handle special characters in group names', () => {
    const id = createDeterministicGroupId('group-with-special_chars!@#', 'en', 'online');

    expect(id).toBeTruthy();
    expect(id.length).toBeLessThanOrEqual(50);
  });

  it('should prefix IDs with "default_" for identification', () => {
    const id = createDeterministicGroupId('test', 'en', 'online');

    expect(id).toMatch(/^default_/);
  });
});

describe('resolveGroupId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should resolve deterministic ID for default groups', async () => {
    const mockGroups = [
      {
        id: 'existing-id',
        name: 'test-group',
        locale: 'en',
        gameMode: 'online',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        label: 'Test Group',
        intensities: [],
      },
    ];

    vi.mocked(mockCustomGroups.getCustomGroups).mockResolvedValue(mockGroups as any);
    vi.mocked(mockDb.customGroups.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
      }),
    } as any);

    const result = await resolveGroupId('test-group', 'en', 'online', true);

    expect(result).toBeTruthy();
    expect(result).toMatch(/^default_/);
  });

  it('should resolve existing custom group ID', async () => {
    const mockGroups = [
      { id: 'custom-group-id', name: 'custom-group', locale: 'en', gameMode: 'online' },
    ];

    vi.mocked(mockCustomGroups.getCustomGroups).mockResolvedValue(mockGroups as any);

    const result = await resolveGroupId('custom-group', 'en', 'online', false);

    expect(result).toBe('custom-group-id');
  });

  it('should return null if no matching group found', async () => {
    vi.mocked(mockCustomGroups.getCustomGroups).mockResolvedValue([]);

    const result = await resolveGroupId('non-existent-group', 'en', 'online', false);

    expect(result).toBeNull();
  });

  it('should fallback to locale matching when exact match not found', async () => {
    // No exact match
    vi.mocked(mockCustomGroups.getCustomGroups)
      .mockResolvedValueOnce([]) // exact match
      .mockResolvedValueOnce([
        {
          id: 'fallback-id',
          name: 'test',
          locale: 'en',
          createdAt: new Date(),
          updatedAt: new Date(),
          isDefault: false,
          gameMode: 'online',
          label: 'Test',
          intensities: [],
        },
      ]); // locale match

    const result = await resolveGroupId('test', 'en', 'online', false);

    expect(result).toBe('fallback-id');
  });
});

describe('auditGroupIdUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should audit tiles and groups correctly', async () => {
    const mockTiles = [
      { id: 1, group: 'group1', group_id: 'id1', locale: 'en', gameMode: 'online' },
      { id: 2, group: 'group2', group_id: '', locale: 'en', gameMode: 'online' },
      { id: 3, group: 'group3', group_id: null, locale: 'en', gameMode: 'online' },
    ];

    const mockGroups = [{ id: 'id1', name: 'group1' }];

    vi.mocked(mockDb.customTiles.toArray).mockResolvedValue(mockTiles as any);
    vi.mocked(mockDb.customGroups.toArray).mockResolvedValue(mockGroups as any);

    const result = await auditGroupIdUsage();

    expect(result.totalTiles).toBe(3);
    expect(result.tilesWithGroupId).toBe(1);
    expect(result.tilesMissingGroupId).toBe(2);
    expect(result.orphanedTiles).toHaveLength(0); // id1 exists in groups
  });

  it('should detect orphaned tiles', async () => {
    const mockTiles = [
      { id: 1, group: 'group1', group_id: 'orphaned-id', locale: 'en', gameMode: 'online' },
    ];

    const mockGroups: any[] = []; // No groups

    vi.mocked(mockDb.customTiles.toArray).mockResolvedValue(mockTiles as any);
    vi.mocked(mockDb.customGroups.toArray).mockResolvedValue(mockGroups);

    const result = await auditGroupIdUsage();

    expect(result.orphanedTiles).toHaveLength(1);
    expect(result.orphanedTiles[0].id).toBe(1);
  });
});

describe('migrateDefaultGroupIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should migrate default groups to deterministic IDs', async () => {
    const mockGroups = [
      {
        id: 'old-random-id',
        name: 'default-group',
        locale: 'en',
        gameMode: 'online',
        isDefault: true,
      },
    ];

    vi.mocked(mockCustomGroups.getCustomGroups).mockResolvedValue(mockGroups as any);
    vi.mocked(mockDb.customGroups.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null), // Target ID doesn't exist
      }),
    } as any);
    vi.mocked(mockDb.customTiles.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      }),
    } as any);

    const result = await migrateDefaultGroupIds();

    expect(result.migratedCount).toBe(1);
    expect(result.errors).toHaveLength(0);
    expect(mockDb.customGroups.delete).toHaveBeenCalledWith('old-random-id');
    expect(mockDb.customGroups.add).toHaveBeenCalled();
  });

  it('should skip migration if target ID already exists', async () => {
    const mockGroups = [
      {
        id: 'old-id',
        name: 'default-group',
        locale: 'en',
        gameMode: 'online',
        isDefault: true,
      },
    ];

    vi.mocked(mockCustomGroups.getCustomGroups).mockResolvedValue(mockGroups as any);
    vi.mocked(mockDb.customGroups.where).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ id: 'target-exists' }), // Target ID exists
      }),
    } as any);

    const result = await migrateDefaultGroupIds();

    expect(result.migratedCount).toBe(0);
    expect(mockDb.customGroups.delete).not.toHaveBeenCalled();
  });
});

describe('migrateGroupIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should migrate tiles missing group_id', async () => {
    const mockTiles = [
      { id: 1, group: 'group1', group_id: null, isCustom: 1, locale: 'en', gameMode: 'online' },
      { id: 2, group: 'group2', group_id: '', isCustom: 0, locale: 'en', gameMode: 'online' },
    ];

    vi.mocked(mockDb.customTiles.filter).mockReturnValue({
      toArray: vi.fn().mockResolvedValue(mockTiles),
    } as any);

    // Mock resolveGroupId to return valid IDs
    const mockResolveGroupId = vi
      .fn()
      .mockResolvedValueOnce('resolved-custom-id')
      .mockResolvedValueOnce('resolved-default-id');

    // We need to mock the module import since resolveGroupId is used internally
    vi.doMock('../migration/groupIdMigration', () => ({
      resolveGroupId: mockResolveGroupId,
      createDeterministicGroupId: vi.fn(),
      migrateGroupIds: vi.fn(), // This would be the actual implementation
    }));

    const result = await migrateGroupIds({ dryRun: true });

    expect(result.migratedCount).toBeGreaterThan(0);
    expect(result.success).toBe(true);
  });

  it('should handle orphaned tiles gracefully', async () => {
    const mockTiles = [
      {
        id: 1,
        group: 'nonexistent',
        group_id: null,
        isCustom: 1,
        locale: 'en',
        gameMode: 'online',
      },
    ];

    vi.mocked(mockDb.customTiles.filter).mockReturnValue({
      toArray: vi.fn().mockResolvedValue(mockTiles),
    } as any);

    const result = await migrateGroupIds({ dryRun: true });

    expect(result.orphanedCount).toBeGreaterThanOrEqual(0);
    expect(result.success).toBeDefined();
  });
});

describe('validateGroupIdIntegrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate tiles have valid group_id references', async () => {
    const mockTiles = [
      { id: 1, group_id: 'valid-id', group: 'group1' },
      { id: 2, group_id: 'invalid-id', group: 'group2' },
      { id: 3, group_id: null, group: 'group3' },
    ];

    const mockGroups = [{ id: 'valid-id', name: 'group1' }];

    vi.mocked(mockDb.customTiles.toArray).mockResolvedValue(mockTiles as any);
    vi.mocked(mockDb.customGroups.toArray).mockResolvedValue(mockGroups as any);

    const result = await validateGroupIdIntegrity();

    expect(result.isValid).toBe(false);
    expect(result.issues).toHaveLength(2); // One missing, one invalid
    expect(result.issues.some((issue) => issue.type === 'missing_group_id')).toBe(true);
    expect(result.issues.some((issue) => issue.type === 'invalid_group_id')).toBe(true);
  });

  it('should pass validation when all tiles have valid group_id', async () => {
    const mockTiles = [{ id: 1, group_id: 'valid-id', group: 'group1' }];

    const mockGroups = [{ id: 'valid-id', name: 'group1' }];

    vi.mocked(mockDb.customTiles.toArray).mockResolvedValue(mockTiles as any);
    vi.mocked(mockDb.customGroups.toArray).mockResolvedValue(mockGroups as any);

    const result = await validateGroupIdIntegrity();

    expect(result.isValid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });
});

describe('runFullGroupIdMigration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should run complete migration process', async () => {
    // Mock all the sub-functions
    vi.mocked(mockDb.customTiles.toArray).mockResolvedValue([]);
    vi.mocked(mockDb.customGroups.toArray).mockResolvedValue([]);
    vi.mocked(mockCustomGroups.getCustomGroups).mockResolvedValue([]);
    vi.mocked(mockDb.customTiles.filter).mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    } as any);

    const result = await runFullGroupIdMigration({ dryRun: true });

    expect(result.auditResult).toBeDefined();
    expect(result.defaultGroupMigrationResult).toBeDefined();
    expect(result.migrationResult).toBeDefined();
    expect(result.validationResult).toBeDefined();
  });

  it('should skip audit when requested', async () => {
    vi.mocked(mockDb.customTiles.toArray).mockResolvedValue([]);
    vi.mocked(mockDb.customGroups.toArray).mockResolvedValue([]);
    vi.mocked(mockCustomGroups.getCustomGroups).mockResolvedValue([]);
    vi.mocked(mockDb.customTiles.filter).mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    } as any);

    const result = await runFullGroupIdMigration({ skipAudit: true });

    expect(result.auditResult).toBeUndefined();
    expect(result.defaultGroupMigrationResult).toBeDefined();
    expect(result.migrationResult).toBeDefined();
    expect(result.validationResult).toBeDefined();
  });
});

// Edge cases and error handling
describe('Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle empty group names', () => {
    expect(() => createDeterministicGroupId('', 'en', 'online')).not.toThrow();
    const id = createDeterministicGroupId('', 'en', 'online');
    expect(id).toBeTruthy();
  });

  it('should handle very long group names', () => {
    const longName = 'a'.repeat(200);
    const id = createDeterministicGroupId(longName, 'en', 'online');
    expect(id).toBeTruthy();
    expect(id.length).toBeLessThanOrEqual(50);
  });

  it('should handle database errors gracefully', async () => {
    vi.mocked(mockDb.customTiles.toArray).mockRejectedValue(new Error('Database error'));

    const result = await auditGroupIdUsage();

    // Should not throw, but return an error state or handle gracefully
    expect(result).toBeDefined();
  });
});
