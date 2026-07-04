import { CustomGroupBase } from '@/types/customGroups';
import {
  addCustomGroup,
  deleteCustomGroup,
  getAllAvailableGroups,
  getCustomGroup,
  getGroupIntensities,
  isGroupNameUnique,
  updateCustomGroup,
} from '../customGroups';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Real Dexie (fake-indexeddb) — sync middleware no-ops without an auth provider.
import db from '../store';

// Isolate the real i18next singleton: the creating hook reads the current
// language to default a group's locale.
vi.mock('i18next', () => ({
  default: {
    resolvedLanguage: 'en',
    language: 'en',
  },
}));

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

const seedTile = (groupId: string, action = 'Test action') =>
  db.customTiles.add({
    group_id: groupId,
    intensity: 1,
    action,
    tags: [],
    isCustom: 1,
    isEnabled: 1,
  });

describe('customGroups store', () => {
  beforeEach(async () => {
    await db.customGroups.clear();
    await db.customTiles.clear();
  });

  describe('addCustomGroup', () => {
    it('persists the group and returns its id', async () => {
      const id = await addCustomGroup(buildGroup());

      expect(id).toEqual(expect.any(String));
      const stored = await getCustomGroup(id!);
      expect(stored).toMatchObject({
        name: 'testGroup',
        label: 'Test Group',
        locale: 'en',
        gameMode: 'online',
        isDefault: false,
      });
      expect(stored?.intensities).toHaveLength(2);
      expect(stored?.createdAt).toBeInstanceOf(Date);
      expect(stored?.updatedAt).toBeInstanceOf(Date);
    });

    it('fills id, locale, gameMode, and isDefault defaults via the creating hook', async () => {
      const bare = {
        name: 'bareGroup',
        label: 'Bare',
        intensities: [],
      } as unknown as CustomGroupBase;

      const id = await addCustomGroup(bare);

      const stored = await getCustomGroup(id!);
      expect(stored).toMatchObject({
        locale: 'en',
        gameMode: 'online',
        isDefault: false,
      });
      expect(stored?.id).toEqual(expect.any(String));
    });
  });

  describe('updateCustomGroup', () => {
    it('updates fields and bumps updatedAt', async () => {
      const id = await addCustomGroup(buildGroup());
      const before = await getCustomGroup(id!);

      const result = await updateCustomGroup(id!, { label: 'Renamed Group' });

      expect(result).toBe(1);
      const after = await getCustomGroup(id!);
      expect(after?.label).toBe('Renamed Group');
      expect(after?.updatedAt.getTime()).toBeGreaterThanOrEqual(before!.updatedAt.getTime());
    });

    it('returns 0 when the group does not exist', async () => {
      const result = await updateCustomGroup('missing-id', { label: 'Nope' });

      expect(result).toBe(0);
    });
  });

  describe('deleteCustomGroup', () => {
    it('deletes a group with no tiles', async () => {
      const id = await addCustomGroup(buildGroup());

      const result = await deleteCustomGroup(id!);

      expect(result.success).toBe(true);
      expect(await getCustomGroup(id!)).toBeUndefined();
    });

    it('fails when the group is not found', async () => {
      const result = await deleteCustomGroup('missing-id');

      expect(result).toEqual({ success: false, error: 'Group not found' });
    });

    it('refuses to delete a group that has tiles', async () => {
      const id = await addCustomGroup(buildGroup());
      await seedTile(id!);
      await seedTile(id!, 'Another action');

      const result = await deleteCustomGroup(id!);

      expect(result.success).toBe(false);
      expect(result.error).toContain('2 associated tiles');
      expect(await getCustomGroup(id!)).toBeDefined();
      expect(await db.customTiles.where('group_id').equals(id!).count()).toBe(2);
    });

    it('cascadeDelete removes the group and its tiles, sparing other groups', async () => {
      const id = await addCustomGroup(buildGroup());
      const otherId = await addCustomGroup(buildGroup({ name: 'otherGroup' }));
      await seedTile(id!);
      await seedTile(id!, 'Another action');
      await seedTile(otherId!, 'Unrelated action');

      const result = await deleteCustomGroup(id!, { cascadeDelete: true });

      expect(result).toEqual({ success: true, tilesDeleted: 2 });
      expect(await getCustomGroup(id!)).toBeUndefined();
      expect(await db.customTiles.where('group_id').equals(id!).count()).toBe(0);
      expect(await db.customTiles.where('group_id').equals(otherId!).count()).toBe(1);
    });

    it('force deletes the group but leaves its tiles', async () => {
      const id = await addCustomGroup(buildGroup());
      await seedTile(id!);

      const result = await deleteCustomGroup(id!, { force: true });

      expect(result.success).toBe(true);
      expect(await getCustomGroup(id!)).toBeUndefined();
      expect(await db.customTiles.where('group_id').equals(id!).count()).toBe(1);
    });
  });

  describe('getAllAvailableGroups', () => {
    it('returns only groups matching locale and gameMode, sorted by name', async () => {
      await addCustomGroup(buildGroup({ name: 'zebra' }));
      await addCustomGroup(buildGroup({ name: 'alpha' }));
      await addCustomGroup(buildGroup({ name: 'spanish', locale: 'es' }));
      await addCustomGroup(buildGroup({ name: 'localMode', gameMode: 'local' }));

      const result = await getAllAvailableGroups('en', 'online');

      expect(result.map((g) => g.name)).toEqual(['alpha', 'zebra']);
    });

    it('returns an empty array when nothing matches', async () => {
      await addCustomGroup(buildGroup());

      const result = await getAllAvailableGroups('fr', 'local');

      expect(result).toEqual([]);
    });

    it('collapses duplicate names within a locale/gameMode and prunes the extras', async () => {
      await addCustomGroup(buildGroup());
      await addCustomGroup(buildGroup());

      const result = await getAllAvailableGroups('en', 'online');

      expect(result.map((g) => g.name)).toEqual(['testGroup']);
      expect(await db.customGroups.where('name').equals('testGroup').count()).toBe(1);
    });
  });

  describe('getGroupIntensities', () => {
    it('returns intensities for the matching name, locale, and gameMode', async () => {
      const group = buildGroup();
      await addCustomGroup(group);

      const result = await getGroupIntensities('testGroup', 'en', 'online');

      expect(result).toEqual(group.intensities);
    });

    it('returns an empty array when the group is not found', async () => {
      await addCustomGroup(buildGroup());

      expect(await getGroupIntensities('nonexistent', 'en', 'online')).toEqual([]);
      expect(await getGroupIntensities('testGroup', 'es', 'online')).toEqual([]);
      expect(await getGroupIntensities('testGroup', 'en', 'local')).toEqual([]);
    });

    it('returns an empty array when the group has no intensities', async () => {
      await addCustomGroup(buildGroup({ intensities: [] }));

      const result = await getGroupIntensities('testGroup', 'en', 'online');

      expect(result).toEqual([]);
    });
  });

  describe('isGroupNameUnique', () => {
    it('is false when a group with the same name, locale, and gameMode exists', async () => {
      await addCustomGroup(buildGroup());

      expect(await isGroupNameUnique('testGroup', 'en', 'online')).toBe(false);
    });

    it('is true for the same name in a different locale or gameMode', async () => {
      await addCustomGroup(buildGroup());

      expect(await isGroupNameUnique('testGroup', 'es', 'online')).toBe(true);
      expect(await isGroupNameUnique('testGroup', 'en', 'local')).toBe(true);
      expect(await isGroupNameUnique('freshName', 'en', 'online')).toBe(true);
    });

    it('is true when the match is the group being edited (excludeId)', async () => {
      const id = await addCustomGroup(buildGroup());

      expect(await isGroupNameUnique('testGroup', 'en', 'online', id)).toBe(true);
      expect(await isGroupNameUnique('testGroup', 'en', 'online', 'other-id')).toBe(false);
    });
  });
});
