/**
 * Tests for TileMatcher with Group ID Support
 *
 * Tests the tile matching logic using group_id-based keys for improved sync reliability
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TileMatcher } from '../tileMatcher';
import type { CustomTileBase, CustomTilePull } from '@/types/customTiles';

// Mock the stores
vi.mock('@/stores/customTiles', () => ({
  getTiles: vi.fn(),
}));

const mockGetTiles = vi.mocked((await import('@/stores/customTiles')).getTiles);

describe('TileMatcher.createKey', () => {
  it('should create consistent keys for tiles with group_id', () => {
    const tile: CustomTileBase = {
      group: 'test-group',
      group_id: 'group-123',
      intensity: 1,
      action: 'test-action',
      gameMode: 'online',
      locale: 'en',
      tags: [],
      isEnabled: 1,
      isCustom: 1,
    };

    const key = TileMatcher.createKey(tile);
    expect(key).toBe('group-123|1|test-action|online|en');
  });

  it('should use default values for missing gameMode and locale', () => {
    const tile: CustomTileBase = {
      group: 'test-group',
      group_id: 'group-123',
      intensity: 1,
      action: 'test-action',
      tags: [],
      isEnabled: 1,
      isCustom: 1,
    };

    const key = TileMatcher.createKey(tile);
    expect(key).toBe('group-123|1|test-action|online|en');
  });

  it('should throw error if group_id is missing', () => {
    const tile: CustomTileBase = {
      group: 'test-group',
      intensity: 1,
      action: 'test-action',
      tags: [],
      isEnabled: 1,
      isCustom: 1,
    };

    expect(() => TileMatcher.createKey(tile)).toThrow('Tile missing group_id for matching');
  });

  it('should throw error if group_id is empty string', () => {
    const tile: CustomTileBase = {
      group: 'test-group',
      group_id: '',
      intensity: 1,
      action: 'test-action',
      tags: [],
      isEnabled: 1,
      isCustom: 1,
    };

    expect(() => TileMatcher.createKey(tile)).toThrow('Tile missing group_id for matching');
  });
});

describe('TileMatcher.findExistingTile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should find existing tile using group_id-based matching', async () => {
    const tile: CustomTileBase = {
      group: 'test-group',
      group_id: 'group-123',
      intensity: 1,
      action: 'test-action',
      gameMode: 'online',
      locale: 'en',
      tags: [],
      isEnabled: 1,
      isCustom: 1,
    };

    const existingTile: CustomTilePull = {
      id: 42,
      ...tile,
    };

    mockGetTiles.mockResolvedValue([existingTile]);

    const result = await TileMatcher.findExistingTile(tile);

    expect(result.existingTile).toEqual(existingTile);
    expect(result.isExactMatch).toBe(true);
    expect(result.matchKey).toBe('group-123|1|test-action|online|en');
    expect(mockGetTiles).toHaveBeenCalledWith({
      group_id: 'group-123',
      intensity: 1,
      action: 'test-action',
      gameMode: 'online',
      locale: 'en',
    });
  });

  it('should return null when no existing tile found', async () => {
    const tile: CustomTileBase = {
      group: 'test-group',
      group_id: 'group-123',
      intensity: 1,
      action: 'test-action',
      gameMode: 'online',
      locale: 'en',
      tags: [],
      isEnabled: 1,
      isCustom: 1,
    };

    mockGetTiles.mockResolvedValue([]);

    const result = await TileMatcher.findExistingTile(tile);

    expect(result.existingTile).toBeNull();
    expect(result.isExactMatch).toBe(false);
    expect(result.matchKey).toBe('group-123|1|test-action|online|en');
  });

  it('should throw error if tile is missing group_id', async () => {
    const tile: CustomTileBase = {
      group: 'test-group',
      intensity: 1,
      action: 'test-action',
      tags: [],
      isEnabled: 1,
      isCustom: 1,
    };

    await expect(TileMatcher.findExistingTile(tile)).rejects.toThrow(
      'Cannot match tile without group_id'
    );
  });

  it('should handle database errors', async () => {
    const tile: CustomTileBase = {
      group: 'test-group',
      group_id: 'group-123',
      intensity: 1,
      action: 'test-action',
      gameMode: 'online',
      locale: 'en',
      tags: [],
      isEnabled: 1,
      isCustom: 1,
    };

    mockGetTiles.mockRejectedValue(new Error('Database error'));

    await expect(TileMatcher.findExistingTile(tile)).rejects.toThrow('Database error');
  });
});

describe('TileMatcher.batchFindExistingTiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should efficiently batch match tiles by group_id', async () => {
    const tiles: CustomTileBase[] = [
      {
        group: 'group1',
        group_id: 'id1',
        intensity: 1,
        action: 'action1',
        gameMode: 'online',
        locale: 'en',
        tags: [],
        isEnabled: 1,
        isCustom: 1,
      },
      {
        group: 'group1',
        group_id: 'id1',
        intensity: 2,
        action: 'action2',
        gameMode: 'online',
        locale: 'en',
        tags: [],
        isEnabled: 1,
        isCustom: 1,
      },
      {
        group: 'group2',
        group_id: 'id2',
        intensity: 1,
        action: 'action3',
        gameMode: 'online',
        locale: 'en',
        tags: [],
        isEnabled: 1,
        isCustom: 1,
      },
    ];

    const existingTiles: CustomTilePull[] = [
      { id: 1, ...tiles[0] }, // Match for first tile
      { id: 3, ...tiles[2] }, // Match for third tile
    ];

    // Mock getTiles to return different results based on group_id
    mockGetTiles.mockImplementation(async (filters) => {
      if (filters && filters.group_id === 'id1') {
        return existingTiles.filter((tile) => tile.group_id === 'id1');
      } else if (filters && filters.group_id === 'id2') {
        return existingTiles.filter((tile) => tile.group_id === 'id2');
      }
      return [];
    });

    const results = await TileMatcher.batchFindExistingTiles(tiles);

    expect(results.size).toBe(3);

    const key1 = TileMatcher.createKey(tiles[0]);
    const key2 = TileMatcher.createKey(tiles[1]);
    const key3 = TileMatcher.createKey(tiles[2]);

    expect(results.get(key1)?.existingTile?.id).toBe(1);
    expect(results.get(key2)?.existingTile).toBeNull();
    expect(results.get(key3)?.existingTile?.id).toBe(3);

    // Should have called getTiles only twice (once per group_id)
    expect(mockGetTiles).toHaveBeenCalledTimes(2);
  });

  it('should handle tiles missing group_id', async () => {
    const tiles: CustomTileBase[] = [
      {
        group: 'group1',
        intensity: 1,
        action: 'action1',
        tags: [],
        isEnabled: 1,
        isCustom: 1,
      },
    ];

    await expect(TileMatcher.batchFindExistingTiles(tiles)).rejects.toThrow(
      'Tile missing group_id'
    );
  });

  it('should handle database errors gracefully and fallback to individual matching', async () => {
    const tiles: CustomTileBase[] = [
      {
        group: 'group1',
        group_id: 'id1',
        intensity: 1,
        action: 'action1',
        gameMode: 'online',
        locale: 'en',
        tags: [],
        isEnabled: 1,
        isCustom: 1,
      },
    ];

    // First call (batch) fails, second call (individual) succeeds
    mockGetTiles.mockRejectedValueOnce(new Error('Database error')).mockResolvedValueOnce([]);

    const results = await TileMatcher.batchFindExistingTiles(tiles);

    expect(results.size).toBe(1);
    expect(mockGetTiles).toHaveBeenCalledTimes(2);
  });
});

describe('TileMatcher.validateTileForMatching', () => {
  it('should validate tile with all required fields', () => {
    const tile: CustomTileBase = {
      group: 'test-group',
      group_id: 'group-123',
      intensity: 1,
      action: 'test-action',
      gameMode: 'online',
      locale: 'en',
      tags: [],
      isEnabled: 1,
      isCustom: 1,
    };

    const result = TileMatcher.validateTileForMatching(tile);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should identify missing required fields', () => {
    const tile: CustomTileBase = {
      group: '',
      intensity: 1,
      action: '',
      tags: [],
      isEnabled: 1,
      isCustom: 1,
    };

    const result = TileMatcher.validateTileForMatching(tile);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing group_id');
    expect(result.errors).toContain('Missing group name');
    expect(result.errors).toContain('Missing action');
  });

  it('should identify missing intensity', () => {
    const tile: CustomTileBase = {
      group: 'test',
      group_id: 'id',
      action: 'action',
      gameMode: 'online',
      locale: 'en',
      tags: [],
      isEnabled: 1,
      isCustom: 1,
    } as any; // Remove intensity

    const result = TileMatcher.validateTileForMatching(tile);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing intensity');
  });
});

describe('TileMatcher.tilesEqual', () => {
  it('should compare tiles using group_id when available', () => {
    const tile1: CustomTileBase = {
      group: 'group1',
      group_id: 'id1',
      intensity: 1,
      action: 'action1',
      gameMode: 'online',
      locale: 'en',
      tags: [],
      isEnabled: 1,
      isCustom: 1,
    };

    const tile2: CustomTileBase = {
      group: 'different-group-name', // Different group name
      group_id: 'id1', // Same group_id
      intensity: 1,
      action: 'action1',
      gameMode: 'online',
      locale: 'en',
      tags: [],
      isEnabled: 1,
      isCustom: 1,
    };

    expect(TileMatcher.tilesEqual(tile1, tile2)).toBe(true);
  });

  it('should throw error when both tiles missing group_id', () => {
    const tile1: CustomTileBase = {
      group: 'group1',
      intensity: 1,
      action: 'action1',
      gameMode: 'online',
      locale: 'en',
      tags: [],
      isEnabled: 1,
      isCustom: 1,
    };

    const tile2: CustomTileBase = {
      group: 'group1',
      intensity: 1,
      action: 'action1',
      gameMode: 'online',
      locale: 'en',
      tags: [],
      isEnabled: 1,
      isCustom: 1,
    };

    expect(() => TileMatcher.tilesEqual(tile1, tile2)).toThrow(
      'Cannot compare tiles without group_id'
    );
  });

  it('should handle default values correctly', () => {
    const tile1: CustomTileBase = {
      group: 'group1',
      group_id: 'id1',
      intensity: 1,
      action: 'action1',
      // No gameMode or locale
      tags: [],
      isEnabled: 1,
      isCustom: 1,
    };

    const tile2: CustomTileBase = {
      group: 'group1',
      group_id: 'id1',
      intensity: 1,
      action: 'action1',
      gameMode: 'online', // Explicit values
      locale: 'en',
      tags: [],
      isEnabled: 1,
      isCustom: 1,
    };

    expect(TileMatcher.tilesEqual(tile1, tile2)).toBe(true);
  });
});

describe('TileMatcher.generateMatchingStats', () => {
  it('should generate comprehensive matching statistics', async () => {
    const tiles: CustomTileBase[] = [
      {
        group: 'group1',
        group_id: 'id1',
        intensity: 1,
        action: 'action1',
        gameMode: 'online',
        locale: 'en',
        tags: [],
        isEnabled: 1,
        isCustom: 1,
      },
      {
        group: 'group2',
        group_id: '', // Missing group_id
        intensity: 2,
        action: 'action2',
        gameMode: 'online',
        locale: 'en',
        tags: [],
        isEnabled: 1,
        isCustom: 1,
      },
      {
        group: 'group1',
        group_id: 'id1',
        intensity: 1,
        action: 'action1', // Duplicate
        gameMode: 'online',
        locale: 'en',
        tags: [],
        isEnabled: 1,
        isCustom: 1,
      },
    ];

    const stats = await TileMatcher.generateMatchingStats(tiles);

    expect(stats.totalTiles).toBe(3);
    expect(stats.tilesWithGroupId).toBe(2);
    expect(stats.tilesMissingGroupId).toBe(1);
    expect(stats.duplicateKeys).toHaveLength(1);
    expect(stats.matchingErrors).toHaveLength(1);
    expect(stats.matchingErrors[0].error).toContain('Missing group_id');
  });

  it('should handle tiles with validation errors', async () => {
    const tiles: CustomTileBase[] = [
      {
        group: '',
        group_id: 'id1',
        intensity: 1,
        action: '', // Missing action
        tags: [],
        isEnabled: 1,
        isCustom: 1,
      },
    ];

    const stats = await TileMatcher.generateMatchingStats(tiles);

    expect(stats.matchingErrors).toHaveLength(1);
    expect(stats.matchingErrors[0].error).toContain('Missing group name');
    expect(stats.matchingErrors[0].error).toContain('Missing action');
  });
});
