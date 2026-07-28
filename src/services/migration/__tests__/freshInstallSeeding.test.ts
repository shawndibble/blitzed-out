import { beforeEach, describe, expect, it, vi } from 'vitest';

// setupTests mocks this module globally (waitForContentReady resolved,
// phase 'ready') — no test exercises the real seeding path without this.
// This suite is the fresh-install characterization: empty localStorage,
// empty Dexie (fake-indexeddb, global via setupTests), real bundles.
vi.unmock('@/services/migration/contentReadiness');

// Force '@/i18n' (and its react-i18next/language-detector chain) to resolve
// as a static import up front. The seeding path reaches it only through a
// dynamic import (contentReadiness -> migration/index -> fileDiscovery ->
// '@/i18n'); triggering that resolution for the first time from inside a
// dynamic import races Vitest's SSR module transform.
import '@/i18n';

import {
  waitForContentReady,
  __resetContentReadinessForTests,
} from '@/services/migration/contentReadiness';
import {
  isCurrentLanguageMigrationCompleted,
  setLanguageMigrationInProgress,
} from '@/services/migration/statusManager';
import {
  BACKGROUND_MIGRATION_KEY,
  CURRENT_LANGUAGE_MIGRATION_KEY,
} from '@/services/migration/constants';
import { migrateCurrentLanguage } from '@/services/migration';
import db from '@/stores/store';

describe('fresh install seeding (real Dexie + real bundles)', () => {
  beforeEach(async () => {
    localStorage.clear();
    __resetContentReadinessForTests();
    await db.customGroups.clear();
    await db.customTiles.clear();
  });

  it('seeds the current locale from an empty localStorage and empty Dexie', async () => {
    expect(localStorage.getItem(CURRENT_LANGUAGE_MIGRATION_KEY)).toBeNull();
    const groupsBefore = await db.customGroups.where('locale').equals('en').toArray();
    expect(groupsBefore.length).toBe(0);

    await waitForContentReady('en');

    const groups = await db.customGroups.where('locale').equals('en').toArray();
    expect(groups.length).toBeGreaterThan(0);

    const groupIds = groups.map((g) => g.id);
    const tiles = await db.customTiles
      .filter((t) => !!t.group_id && groupIds.includes(t.group_id))
      .toArray();
    expect(tiles.length).toBeGreaterThan(0);

    expect(isCurrentLanguageMigrationCompleted('en')).toBe(true);
  });

  it('does not spin-deadlock: resolves quickly from a completely empty localStorage', async () => {
    const start = Date.now();
    await waitForContentReady('en');
    const elapsed = Date.now() - start;

    // Real seeding of the bundled en content should take well under a second;
    // MIGRATION_TIMEOUT (the hang the prior attempt caused) is 30s.
    expect(elapsed).toBeLessThan(5000);
    expect(isCurrentLanguageMigrationCompleted('en')).toBe(true);
  }, 15000);

  it('does not spin-deadlock on a stale (past-cap) cross-language-migration lock', async () => {
    // Simulate an abandoned lock from a crashed tab: inProgress with a
    // startedAt far older than MIGRATION_TIMEOUT. The live guard must treat
    // this as expired rather than waiting the full cap.
    setLanguageMigrationInProgress('en', true);
    const staleRecord = JSON.parse(localStorage.getItem(CURRENT_LANGUAGE_MIGRATION_KEY)!);
    staleRecord.startedAt = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1h old
    localStorage.setItem(CURRENT_LANGUAGE_MIGRATION_KEY, JSON.stringify(staleRecord));

    const start = Date.now();
    await waitForContentReady('en');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(5000);
    expect(isCurrentLanguageMigrationCompleted('en')).toBe(true);
  }, 15000);

  it('seeding the same locale concurrently from two callers does not duplicate groups', async () => {
    // The lock reduction (contentReadiness now polls only the
    // current-language-migration lock) makes cross-tab double-seeding
    // possible in a way the old three-lock guard also allowed; the safety
    // property this relies on is that migrateCurrentLanguage itself is
    // idempotent per locale, not that only one caller ever runs it.
    const [first, second] = await Promise.all([
      migrateCurrentLanguage('en'),
      migrateCurrentLanguage('en'),
    ]);

    expect(first).toBe(true);
    expect(second).toBe(true);

    const groups = await db.customGroups.where('locale').equals('en').toArray();
    const names = groups.map((g) => `${g.name}:${g.gameMode}`);
    expect(new Set(names).size).toBe(names.length);
  }, 15000);

  describe('upgrading a device that already seeded an older bundle', () => {
    // Everything here goes through the real gate rather than clearing
    // localStorage: a fresh install proves nothing about reachability, and
    // reachability is the whole point of the version bump.
    const throatTrainingGroup = () =>
      db.customGroups
        .filter((g) => g.name === 'throatTraining' && g.gameMode === 'local' && g.locale === 'en')
        .first();

    const pretendSeededOnOlderVersion = () => {
      const status = JSON.parse(localStorage.getItem(BACKGROUND_MIGRATION_KEY)!);
      localStorage.setItem(
        BACKGROUND_MIGRATION_KEY,
        JSON.stringify({ ...status, version: '2.6.0' })
      );
    };

    it('re-seeds when the stored status predates the current MIGRATION_VERSION', async () => {
      await migrateCurrentLanguage('en');
      expect(isCurrentLanguageMigrationCompleted('en')).toBe(true);

      pretendSeededOnOlderVersion();

      expect(isCurrentLanguageMigrationCompleted('en')).toBe(false);
    }, 15000);

    it('drops a default tile whose action the bundle no longer contains', async () => {
      await migrateCurrentLanguage('en');
      const group = await throatTrainingGroup();
      expect(group).toBeDefined();

      // Stand in for a reworded default: text this device seeded from an older
      // bundle, which the current bundle no longer has.
      const staleId = await db.customTiles.add({
        group_id: group!.id,
        intensity: 1,
        action: "{sub} plays with the tip of {dom}'s {genital}.",
        tags: ['default'],
        isEnabled: 1,
        isCustom: 0,
      } as any);

      pretendSeededOnOlderVersion();
      await migrateCurrentLanguage('en');

      expect(await db.customTiles.get(staleId)).toBeUndefined();
      // The replacement the bundle does carry survives the same pass.
      const replacement = await db.customTiles
        .filter((t) => t.action === "{sub} plays with {dom}'s {tip}.")
        .first();
      expect(replacement).toBeDefined();
    }, 15000);

    it('keeps a player-authored tile the bundle never had', async () => {
      await migrateCurrentLanguage('en');
      const group = await throatTrainingGroup();

      const customId = await db.customTiles.add({
        group_id: group!.id,
        intensity: 1,
        action: 'Something the player wrote themselves.',
        tags: ['custom'],
        isEnabled: 1,
        isCustom: 1,
      } as any);

      pretendSeededOnOlderVersion();
      await migrateCurrentLanguage('en');

      expect(await db.customTiles.get(customId)).toBeDefined();
    }, 15000);

    it('renames the Oral Play intensity ladder in place', async () => {
      await migrateCurrentLanguage('en');
      const group = await throatTrainingGroup();

      // An older bundle's labels, at the same positional values.
      await db.customGroups.update(group!.id, {
        intensities: group!.intensities.map((i) =>
          i.value === 2 ? { ...i, label: 'Oral (Penetrative)' } : i
        ),
      });

      pretendSeededOnOlderVersion();
      await migrateCurrentLanguage('en');

      const updated = await throatTrainingGroup();
      expect(updated!.intensities.find((i) => i.value === 2)?.label).toBe('Sucking');
    }, 15000);
  });
});
