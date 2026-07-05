/**
 * Content library — the tiles ⇄ groups join layer.
 *
 * Owns every query that spans BOTH tables plus the referential-integrity
 * delete. Dependency DAG: contentLibrary → { customTiles, customGroups } →
 * store(db); the two leaf stores never import each other.
 *
 * Read paths stay liveQuery-compatible: waitForContentReady's completed
 * fast-path is synchronous, and no other non-Dexie promise is awaited.
 */
import i18next from 'i18next';

import db from './store';
import { getCustomGroups, trackGroupDeleted } from './customGroups';
import { getTilesByGroupIds } from './customTiles';
import type { ContentGameMode } from '@/types/Settings';
import type { CustomGroupPull } from '@/types/customGroups';
import type { CustomTilePull } from '@/types/customTiles';
import { retryOnCursorError } from '@/utils/dbRecovery';
import { waitForContentReady } from '@/services/migration/contentReadiness';

/**
 * Groups (default and custom) that actually have tiles — ALL tiles count,
 * enabled or not: this is a presence check, not a gameplay query. Used by the
 * setup wizard and other contexts that need the group directory.
 *
 * `locale` defaults to the current i18next language.
 */
export const getGroupsWithTiles = async (
  gameMode: ContentGameMode = 'online',
  locale?: string
): Promise<CustomGroupPull[]> => {
  try {
    // Wizard-critical: on a fresh install the first read must resolve
    // post-seeding, or the actions step renders an empty directory.
    await waitForContentReady(locale);

    return await retryOnCursorError(
      db,
      async () => {
        const resolvedLocale = locale || i18next.resolvedLanguage || i18next.language || 'en';
        const allGroups = await getCustomGroups({ locale: resolvedLocale, gameMode });

        const groupIds = allGroups.map((group) => group.id);
        const tilesForGroups = await getTilesByGroupIds(groupIds);
        const groupIdsWithTiles = new Set(
          tilesForGroups.map((tile) => tile.group_id).filter(Boolean)
        );

        return allGroups.filter((group) => groupIdsWithTiles.has(group.id));
      },
      (message: string, error?: Error) => {
        console.error(`Error in getGroupsWithTiles: ${message}`, error);
      }
    );
  } catch (error) {
    console.error('Final error in getGroupsWithTiles:', error);
    return [];
  }
};

/**
 * Tile counts and intensity distributions keyed by group id. Counts ALL tiles
 * — disabled and default (isCustom: 0) rows included — because callers use it
 * to describe the library, not the active game.
 */
export const getTileCountsByGroup = async (
  locale = 'en',
  gameMode: ContentGameMode = 'online',
  tags: string[] | string | null = null
): Promise<Record<string, { count: number; intensities: Record<number, number> }>> => {
  try {
    await waitForContentReady(locale);

    // Group ids first (~15-20 groups) so we never scan the full tile table.
    const relevantGroups = await getCustomGroups({ locale, gameMode });
    const groupIds = new Set(relevantGroups.map((group) => group.id));

    if (groupIds.size === 0) {
      return {};
    }

    let relevantTiles: CustomTilePull[] = await db.customTiles
      .where('group_id')
      .anyOf([...groupIds])
      .toArray();

    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : [tags];
      relevantTiles = relevantTiles.filter((tile) =>
        tile.tags.some((tag: string) => tagsArray.includes(tag))
      );
    }

    return relevantTiles.reduce<
      Record<string, { count: number; intensities: Record<number, number> }>
    >((groups, tile) => {
      const groupKey = tile.group_id as string;
      if (!groups[groupKey]) {
        groups[groupKey] = {
          count: 0,
          intensities: {},
        };
      }
      groups[groupKey].count++;

      const intensity = Number(tile.intensity);
      if (!groups[groupKey].intensities[intensity]) {
        groups[groupKey].intensities[intensity] = 0;
      }
      groups[groupKey].intensities[intensity]++;

      return groups;
    }, {});
  } catch (error) {
    console.error('Error in getTileCountsByGroup:', error);
    return {};
  }
};

/**
 * Enabled tiles for gameplay. When `locale` is omitted there is NO locale
 * filter — cross-locale gameplay content is intentional: enabled tiles from
 * another locale's groups in the same mode stay in the active set. With no
 * arguments at all, every enabled tile is returned regardless of group.
 */
export const getActiveTiles = async (
  gameMode: ContentGameMode | null = null,
  locale: string | null = null
): Promise<CustomTilePull[]> => {
  const allEnabledTiles = await db.customTiles.where('isEnabled').equals(1).toArray();

  if (gameMode || locale) {
    const groupsQuery: { gameMode?: ContentGameMode; locale?: string } = {};
    if (gameMode) groupsQuery.gameMode = gameMode;
    if (locale) groupsQuery.locale = locale;

    const matchingGroups = await getCustomGroups(groupsQuery);
    const groupIds = new Set(matchingGroups.map((group) => group.id));

    return allEnabledTiles.filter((tile) => tile.group_id && groupIds.has(tile.group_id));
  }

  return allEnabledTiles;
};

export interface DeleteGroupResult {
  success: boolean;
  tilesDeleted?: number;
  error?: string;
}

/**
 * Referential-integrity delete: refuses when tiles exist unless `force`
 * (deletes the group, strands the tiles) or `cascadeDelete` (deletes tiles
 * then group) is set. Tile and group deletes run in one Dexie transaction —
 * a failure after the tile delete rolls the tiles back.
 *
 * Never throws; failures come back as `{ success: false, error }`.
 */
export const deleteGroup = async (
  id: string,
  options: { force?: boolean; cascadeDelete?: boolean } = {}
): Promise<DeleteGroupResult> => {
  try {
    let deletedGroup: CustomGroupPull | undefined;

    // Raw table calls only inside the transaction: no readiness guards, no
    // cursor-retry wrappers, no dynamic imports — any of those would await a
    // non-Dexie promise and commit the transaction early.
    const result = await db.transaction(
      'rw',
      db.customGroups,
      db.customTiles,
      async (): Promise<DeleteGroupResult> => {
        const group = await db.customGroups.get(id);
        if (!group) {
          return { success: false, error: 'Group not found' };
        }

        const tileCount = await db.customTiles.where('group_id').equals(id).count();

        if (tileCount > 0) {
          if (!options.force && !options.cascadeDelete) {
            return {
              success: false,
              error: `Cannot delete group "${group.name}". It has ${tileCount} associated tiles. Use force or cascadeDelete option.`,
            };
          }

          if (options.cascadeDelete) {
            const tilesDeleted = await db.customTiles.where('group_id').equals(id).delete();
            await db.customGroups.delete(id);
            deletedGroup = group;
            return { success: true, tilesDeleted };
          }
        }

        await db.customGroups.delete(id);
        deletedGroup = group;
        return { success: true };
      }
    );

    // Analytics AFTER commit — a tracked delete that later rolled back would
    // report phantom events. Refusals and not-found are deliberately untracked.
    if (result.success && deletedGroup) {
      trackGroupDeleted(deletedGroup);
    }

    return result;
  } catch (error) {
    console.error('Error in deleteGroup:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Remove duplicate group names within a locale/gameMode, keeping the oldest.
 * Deletes via `deleteGroup` with no options, so a duplicate that owns tiles is
 * refused and survives — load-bearing: migration dedupe must never destroy
 * seeded tiles.
 */
export const removeDuplicateGroups = async (
  locale = 'en',
  gameMode = 'online'
): Promise<number> => {
  try {
    const allGroups = await getCustomGroups({ locale, gameMode });
    const groupsByName = new Map<string, CustomGroupPull[]>();

    allGroups.forEach((group) => {
      const existing = groupsByName.get(group.name) || [];
      existing.push(group);
      groupsByName.set(group.name, existing);
    });

    let removedCount = 0;

    for (const [, groups] of groupsByName) {
      if (groups.length > 1) {
        // Sort by creation date to keep the oldest
        // Sort by creation date to keep the oldest; unparseable dates sort as
        // NaN (stable order preserved by comparator returning NaN → treated 0).
        groups.sort((a, b) => {
          const aTime =
            a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
          const bTime =
            b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
          return aTime - bTime;
        });

        for (let i = 1; i < groups.length; i++) {
          const result = await deleteGroup(groups[i].id);
          // Count actual removals only — a tile-owning duplicate is refused
          // by design (migration dedupe must never destroy seeded tiles).
          if (result.success) removedCount++;
        }
      }
    }

    return removedCount;
  } catch (error) {
    console.error('Error in removeDuplicateGroups:', error);
    return 0;
  }
};
