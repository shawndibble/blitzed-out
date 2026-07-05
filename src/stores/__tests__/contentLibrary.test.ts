import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CustomGroupBase } from '@/types/customGroups';
import type { CustomTile } from '@/types/customTiles';
import { addCustomGroup } from '../customGroups';
import {
  deleteGroup,
  getActiveTiles,
  getGroupsWithTiles,
  getTileCountsByGroup,
  removeDuplicateGroups,
} from '../contentLibrary';

// Real Dexie (fake-indexeddb) — sync middleware no-ops without an auth
// provider, and setupTests mocks waitForContentReady as already-resolved.
import db from '../store';

const buildGroup = (overrides: Partial<CustomGroupBase> = {}): CustomGroupBase => ({
  name: 'testGroup',
  label: 'Test Group',
  intensities: [
    { id: '1', label: 'Beginner', value: 1, isDefault: false },
    { id: '2', label: 'Advanced', value: 2, isDefault: false },
  ],
  type: 'solo',
  locale: 'en',
  gameMode: 'online',
  isDefault: false,
  ...overrides,
});

const seedTile = (groupId: string, overrides: Partial<CustomTile> = {}) =>
  db.customTiles.add({
    group_id: groupId,
    intensity: 1,
    action: 'Test action',
    tags: [],
    isCustom: 1,
    isEnabled: 1,
    ...overrides,
  } as CustomTile);

/** Seed a group directly so createdAt is controllable (the creating hook preserves it). */
const seedGroup = (id: string, name: string, createdAt: Date) =>
  db.customGroups.add({
    id,
    name,
    label: name,
    intensities: [],
    locale: 'en',
    gameMode: 'online',
    isDefault: false,
    createdAt,
  } as any);

describe('contentLibrary', () => {
  beforeEach(async () => {
    await db.customGroups.clear();
    await db.customTiles.clear();
  });

  describe('getActiveTiles', () => {
    it('includes enabled tiles from other-locale groups in the requested mode', async () => {
      const enOnline = await addCustomGroup(buildGroup({ name: 'enOnline' }));
      const frOnline = await addCustomGroup(buildGroup({ name: 'frOnline', locale: 'fr' }));
      const enLocal = await addCustomGroup(buildGroup({ name: 'enLocal', gameMode: 'local' }));
      await seedTile(enOnline!, { action: 'en action' });
      await seedTile(enOnline!, { action: 'disabled action', isEnabled: 0 });
      await seedTile(frOnline!, { action: 'fr action' });
      await seedTile(enLocal!, { action: 'local action' });

      const result = await getActiveTiles('online');

      expect(result.map((t) => t.action).sort()).toEqual(['en action', 'fr action']);
    });

    it('with no args returns all enabled tiles regardless of group', async () => {
      const online = await addCustomGroup(buildGroup({ name: 'online' }));
      const local = await addCustomGroup(buildGroup({ name: 'local', gameMode: 'local' }));
      await seedTile(online!, { action: 'online action' });
      await seedTile(local!, { action: 'local action' });
      await seedTile('orphan-group-id', { action: 'orphan action' });
      await seedTile(online!, { action: 'disabled action', isEnabled: 0 });

      const result = await getActiveTiles();

      expect(result.map((t) => t.action).sort()).toEqual([
        'local action',
        'online action',
        'orphan action',
      ]);
    });
  });

  describe('getTileCountsByGroup', () => {
    it('counts disabled and default tiles, keyed by group id', async () => {
      const id = await addCustomGroup(buildGroup());
      await seedTile(id!, { action: 'enabled custom' });
      await seedTile(id!, { action: 'disabled custom', isEnabled: 0 });
      await seedTile(id!, { action: 'default tile', isCustom: 0, intensity: 2 });

      const counts = await getTileCountsByGroup('en', 'online');

      expect(Object.keys(counts)).toEqual([id]);
      expect(counts[id!].count).toBe(3);
      expect(counts[id!].intensities).toEqual({ 1: 2, 2: 1 });
    });

    it('filters by tag when tags are provided', async () => {
      const id = await addCustomGroup(buildGroup());
      await seedTile(id!, { action: 'tagged', tags: ['kink'] });
      await seedTile(id!, { action: 'untagged' });

      const counts = await getTileCountsByGroup('en', 'online', 'kink');

      expect(counts[id!].count).toBe(1);
    });
  });

  describe('getGroupsWithTiles', () => {
    it('returns a group whose only tiles are disabled and omits tile-less groups', async () => {
      const disabledOnly = await addCustomGroup(buildGroup({ name: 'disabledOnly' }));
      const withEnabled = await addCustomGroup(buildGroup({ name: 'withEnabled' }));
      await addCustomGroup(buildGroup({ name: 'empty' }));
      await seedTile(disabledOnly!, { isEnabled: 0 });
      await seedTile(withEnabled!);

      const result = await getGroupsWithTiles('online');

      expect(result.map((g) => g.name).sort()).toEqual(['disabledOnly', 'withEnabled']);
    });
  });

  describe('removeDuplicateGroups', () => {
    it('keeps the oldest duplicate and removes newer tile-less ones', async () => {
      await seedGroup('older', 'dupe', new Date('2020-01-01'));
      await seedGroup('newer', 'dupe', new Date('2021-01-01'));

      const removed = await removeDuplicateGroups('en', 'online');

      expect(removed).toBe(1);
      expect(await db.customGroups.get('older')).toBeDefined();
      expect(await db.customGroups.get('newer')).toBeUndefined();
    });

    it('never deletes a duplicate that owns tiles (migration dedupe must not destroy seeded tiles)', async () => {
      await seedGroup('older', 'dupe', new Date('2020-01-01'));
      await seedGroup('newer', 'dupe', new Date('2021-01-01'));
      await seedTile('newer');

      const removed = await removeDuplicateGroups('en', 'online');

      // The refused deletion is not counted: the return value reports actual
      // removals, and the tile-owning duplicate survives by design.
      expect(removed).toBe(0);
      expect(await db.customGroups.get('older')).toBeDefined();
      expect(await db.customGroups.get('newer')).toBeDefined();
      expect(await db.customTiles.where('group_id').equals('newer').count()).toBe(1);
    });
  });

  describe('deleteGroup', () => {
    it('deletes a group with no tiles', async () => {
      const id = await addCustomGroup(buildGroup());

      const result = await deleteGroup(id!);

      expect(result.success).toBe(true);
      expect(await db.customGroups.get(id!)).toBeUndefined();
    });

    it('fails when the group is not found', async () => {
      const result = await deleteGroup('missing-id');

      expect(result).toEqual({ success: false, error: 'Group not found' });
    });

    it('refuses to delete a group that has tiles', async () => {
      const id = await addCustomGroup(buildGroup());
      await seedTile(id!);
      await seedTile(id!, { action: 'Another action' });

      const result = await deleteGroup(id!);

      expect(result.success).toBe(false);
      expect(result.error).toContain('2 associated tiles');
      expect(await db.customGroups.get(id!)).toBeDefined();
      expect(await db.customTiles.where('group_id').equals(id!).count()).toBe(2);
    });

    it('cascadeDelete removes the group and its tiles, sparing other groups', async () => {
      const id = await addCustomGroup(buildGroup());
      const otherId = await addCustomGroup(buildGroup({ name: 'otherGroup' }));
      await seedTile(id!);
      await seedTile(id!, { action: 'Another action' });
      await seedTile(otherId!, { action: 'Unrelated action' });

      const result = await deleteGroup(id!, { cascadeDelete: true });

      expect(result).toEqual({ success: true, tilesDeleted: 2 });
      expect(await db.customGroups.get(id!)).toBeUndefined();
      expect(await db.customTiles.where('group_id').equals(id!).count()).toBe(0);
      expect(await db.customTiles.where('group_id').equals(otherId!).count()).toBe(1);
    });

    it('force deletes the group but leaves its tiles', async () => {
      const id = await addCustomGroup(buildGroup());
      await seedTile(id!);

      const result = await deleteGroup(id!, { force: true });

      expect(result.success).toBe(true);
      expect(await db.customGroups.get(id!)).toBeUndefined();
      expect(await db.customTiles.where('group_id').equals(id!).count()).toBe(1);
    });

    it('rolls back the tile deletes when the group delete fails mid-transaction', async () => {
      const id = await addCustomGroup(buildGroup());
      await seedTile(id!);
      await seedTile(id!, { action: 'Another action' });

      const boom = () => {
        throw new Error('injected failure');
      };
      db.customGroups.hook('deleting', boom);
      try {
        const result = await deleteGroup(id!, { cascadeDelete: true });
        expect(result.success).toBe(false);
      } finally {
        db.customGroups.hook('deleting').unsubscribe(boom);
      }

      expect(await db.customGroups.get(id!)).toBeDefined();
      expect(await db.customTiles.where('group_id').equals(id!).count()).toBe(2);
    });
  });

  describe('clearUserCustomGroups (syncService contract)', () => {
    it('leaves user groups that still have tiles, deletes empty ones, and reports success', async () => {
      // setupTests replaces syncService wholesale; pull the real implementation.
      const { clearUserCustomGroups } =
        await vi.importActual<typeof import('@/services/syncService')>('@/services/syncService');

      const withTiles = await addCustomGroup(buildGroup({ name: 'withTiles' }));
      const empty = await addCustomGroup(buildGroup({ name: 'empty' }));
      const defaultGroup = await addCustomGroup(
        buildGroup({ name: 'defaultGroup', isDefault: true })
      );
      await seedTile(withTiles!);

      await expect(clearUserCustomGroups()).resolves.toBe(true);

      // Pinned semantics: the refusal survives AND the call still reports
      // success — do NOT cascade here (see the WHY note in syncService).
      expect(await db.customGroups.get(withTiles!)).toBeDefined();
      expect(await db.customTiles.where('group_id').equals(withTiles!).count()).toBe(1);
      expect(await db.customGroups.get(empty!)).toBeUndefined();
      expect(await db.customGroups.get(defaultGroup!)).toBeDefined();
    });
  });
});
