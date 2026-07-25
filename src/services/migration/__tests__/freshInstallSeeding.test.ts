import { beforeEach, describe, expect, it, vi } from 'vitest';

// setupTests mocks this module globally (waitForContentReady resolved,
// phase 'ready') — no test exercises the real seeding path without this.
// This suite is the fresh-install characterization: empty localStorage,
// empty Dexie (fake-indexeddb, global via setupTests), real bundles.
vi.unmock('@/services/migration/contentReadiness');

// Force '@/i18n' (and its react-i18next/language-detector chain) to resolve
// as a static import up front. The seeding path reaches it only through a
// dynamic import (contentReadiness -> migrationService -> migration/index ->
// fileDiscovery -> '@/i18n'); triggering that resolution for the first time
// from inside a dynamic import races Vitest's SSR module transform.
import '@/i18n';

import {
  waitForContentReady,
  __resetContentReadinessForTests,
} from '@/services/migration/contentReadiness';
import {
  isCurrentLanguageMigrationCompleted,
  setLanguageMigrationInProgress,
} from '@/services/migration/statusManager';
import { CURRENT_LANGUAGE_MIGRATION_KEY } from '@/services/migration/constants';
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
});
