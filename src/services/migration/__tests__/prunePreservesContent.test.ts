import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.unmock('@/services/migration/contentReadiness');

// Resolve '@/i18n' as a static import up front — the seeding path only reaches
// it through a dynamic import, and triggering that resolution for the first
// time from inside one races Vitest's SSR module transform.
import '@/i18n';

const insert = vi.hoisted(() => ({ shouldFail: false }));

// The prune deletes seeded defaults the bundle no longer carries. It must not
// run when the replacement insert failed — importCustomTilesSafely swallows a
// bulkAdd error, so nothing else would notice the group had shrunk.
vi.mock('@/stores/customTiles', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/stores/customTiles')>();
  return {
    ...actual,
    importCustomTiles: (...args: Parameters<typeof actual.importCustomTiles>) =>
      insert.shouldFail
        ? Promise.reject(new Error('QuotaExceededError'))
        : actual.importCustomTiles(...args),
  };
});

import { BACKGROUND_MIGRATION_KEY } from '@/services/migration/constants';
import { __resetContentReadinessForTests } from '@/services/migration/contentReadiness';
import { migrateCurrentLanguage } from '@/services/migration';
import db from '@/stores/store';

describe('pruning stale defaults', () => {
  beforeEach(async () => {
    insert.shouldFail = false;
    localStorage.clear();
    __resetContentReadinessForTests();
    await db.customGroups.clear();
    await db.customTiles.clear();
  });

  const pretendSeededOnOlderVersion = () => {
    const status = JSON.parse(localStorage.getItem(BACKGROUND_MIGRATION_KEY)!);
    localStorage.setItem(BACKGROUND_MIGRATION_KEY, JSON.stringify({ ...status, version: '2.6.0' }));
  };

  const seedStaleTile = async () => {
    const group = await db.customGroups
      .filter((g) => g.name === 'throatTraining' && g.gameMode === 'local' && g.locale === 'en')
      .first();

    const staleId = await db.customTiles.add({
      group_id: group!.id,
      intensity: 1,
      action: 'Wording an older bundle shipped.',
      tags: ['default'],
      isEnabled: 1,
      isCustom: 0,
    } as never);

    return { staleId, groupId: group!.id };
  };

  it('keeps the stale tile when the replacement insert fails', async () => {
    await migrateCurrentLanguage('en');
    const { staleId, groupId } = await seedStaleTile();

    // Stand this group up as a genuine reword: one action the bundle carries is
    // missing locally (so the re-seed has something to insert) alongside one
    // stored action the bundle has dropped. The guard is per-group, so both
    // halves have to sit in the same group for there to be a failure to survive.
    const bundleTile = await db.customTiles
      .filter((t) => t.group_id === groupId && t.isCustom !== 1 && t.id !== staleId)
      .first();
    await db.customTiles.delete(bundleTile!.id!);

    const countBefore = await db.customTiles.count();

    insert.shouldFail = true;
    pretendSeededOnOlderVersion();
    await migrateCurrentLanguage('en');

    // Nothing was added, so nothing may be taken away — the group would
    // otherwise shrink with no replacement, on a locale marked complete.
    expect(await db.customTiles.get(staleId)).toBeDefined();
    expect(await db.customTiles.count()).toBe(countBefore);
  }, 20000);

  it('removes the stale tile on a healthy re-seed', async () => {
    await migrateCurrentLanguage('en');
    const { staleId } = await seedStaleTile();

    pretendSeededOnOlderVersion();
    await migrateCurrentLanguage('en');

    expect(await db.customTiles.get(staleId)).toBeUndefined();
  }, 20000);
});
