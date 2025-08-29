/**
 * Tile Matching Service with Group ID Support
 *
 * Provides consistent tile matching logic using group_id-based keys instead of string matching
 * for improved sync reliability and performance.
 */

import { getTiles } from '@/stores/customTiles';
import type { CustomTilePull, CustomTileBase } from '@/types/customTiles';

export interface TileMatchKey {
  group_id: string;
  intensity: number;
  action: string;
  gameMode: string;
  locale: string;
}

export interface TileMatchResult {
  existingTile: CustomTilePull | null;
  isExactMatch: boolean;
  matchKey: string;
}

export class TileMatcher {
  /**
   * Creates a consistent matching key for tiles using group_id
   */
  static createKey(tile: CustomTileBase | CustomTilePull): string {
    if (!tile.group_id) {
      throw new Error(
        `Tile missing group_id for matching: ${JSON.stringify({
          id: (tile as CustomTilePull).id,
          group_id: tile.group_id,
          action: tile.action,
        })}`
      );
    }

    return `${tile.group_id}|${tile.intensity}|${tile.action}`;
  }

  /**
   * Finds an existing tile that matches the provided tile using group_id-based matching
   */
  static async findExistingTile(tile: CustomTileBase): Promise<TileMatchResult> {
    if (!tile.group_id) {
      throw new Error(
        `Cannot match tile without group_id: ${JSON.stringify({
          group_id: tile.group_id,
          action: tile.action,
        })}`
      );
    }

    try {
      // Use group_id-based matching (preferred)
      const existingTiles = await getTiles({
        group_id: tile.group_id,
        intensity: tile.intensity,
        action: tile.action,
      });

      if (existingTiles.length > 0) {
        return {
          existingTile: existingTiles[0],
          isExactMatch: true,
          matchKey: this.createKey(tile),
        };
      }

      return {
        existingTile: null,
        isExactMatch: false,
        matchKey: this.createKey(tile),
      };
    } catch (error) {
      console.error('Error finding existing tile:', error);
      throw error;
    }
  }

  /**
   * Batch matching for multiple tiles to improve performance
   */
  static async batchFindExistingTiles(
    tiles: CustomTileBase[]
  ): Promise<Map<string, TileMatchResult>> {
    const results = new Map<string, TileMatchResult>();

    // Group tiles by group_id to optimize database queries
    const tilesByGroupId = new Map<string, CustomTileBase[]>();

    for (const tile of tiles) {
      if (!tile.group_id) {
        throw new Error(
          `Tile missing group_id: ${JSON.stringify({
            group_id: tile.group_id,
            action: tile.action,
          })}`
        );
      }

      const groupTiles = tilesByGroupId.get(tile.group_id) || [];
      groupTiles.push(tile);
      tilesByGroupId.set(tile.group_id, groupTiles);
    }

    // Process each group
    for (const [groupId, groupTiles] of tilesByGroupId) {
      try {
        // Get all existing tiles for this group
        const existingTiles = await getTiles({ group_id: groupId });

        // Create lookup map for existing tiles
        const existingTileMap = new Map<string, CustomTilePull>();
        for (const existing of existingTiles) {
          const key = this.createKey(existing);
          existingTileMap.set(key, existing);
        }

        // Match each tile in the group
        for (const tile of groupTiles) {
          const tileKey = this.createKey(tile);
          const existingTile = existingTileMap.get(tileKey) || null;

          results.set(tileKey, {
            existingTile,
            isExactMatch: existingTile !== null,
            matchKey: tileKey,
          });
        }
      } catch (error) {
        console.error(`Error batch matching tiles for group ${groupId}:`, error);

        // Fall back to individual matching for this group
        for (const tile of groupTiles) {
          try {
            const result = await this.findExistingTile(tile);
            results.set(this.createKey(tile), result);
          } catch (individualError) {
            console.error(`Error matching individual tile:`, individualError);
          }
        }
      }
    }

    return results;
  }

  /**
   * Validates that a tile has all required fields for matching
   */
  static validateTileForMatching(tile: CustomTileBase): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!tile.group_id || !tile.group_id.trim()) {
      errors.push('Missing group_id');
    }

    if (tile.intensity === undefined || tile.intensity === null) {
      errors.push('Missing intensity');
    }

    if (!tile.action || !tile.action.trim()) {
      errors.push('Missing action');
    }

    // Note: locale and gameMode have defaults, so they're not strictly required

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Compares two tiles to determine if they represent the same tile
   */
  static tilesEqual(tile1: CustomTileBase, tile2: CustomTileBase): boolean {
    // Both tiles must have group_id
    if (!tile1.group_id || !tile2.group_id) {
      throw new Error('Cannot compare tiles without group_id');
    }

    return (
      tile1.group_id === tile2.group_id &&
      tile1.intensity === tile2.intensity &&
      tile1.action === tile2.action
    );
  }

  /**
   * Generates matching statistics for debugging and monitoring
   */
  static async generateMatchingStats(tiles: CustomTileBase[]): Promise<{
    totalTiles: number;
    tilesWithGroupId: number;
    tilesMissingGroupId: number;
    duplicateKeys: string[];
    matchingErrors: Array<{ tile: CustomTileBase; error: string }>;
  }> {
    const stats = {
      totalTiles: tiles.length,
      tilesWithGroupId: 0,
      tilesMissingGroupId: 0,
      duplicateKeys: [] as string[],
      matchingErrors: [] as Array<{ tile: CustomTileBase; error: string }>,
    };

    const keyCount = new Map<string, number>();

    for (const tile of tiles) {
      // Count tiles with/without group_id
      if (tile.group_id && tile.group_id.trim()) {
        stats.tilesWithGroupId++;
      } else {
        stats.tilesMissingGroupId++;
      }

      // Validate tile for matching
      const validation = this.validateTileForMatching(tile);
      if (!validation.valid) {
        stats.matchingErrors.push({
          tile,
          error: validation.errors.join(', '),
        });
        continue;
      }

      // Check for duplicate keys
      try {
        const key = this.createKey(tile);
        const count = keyCount.get(key) || 0;
        keyCount.set(key, count + 1);

        if (count > 0) {
          stats.duplicateKeys.push(key);
        }
      } catch (error) {
        stats.matchingErrors.push({
          tile,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return stats;
  }
}

export default TileMatcher;
