import { beforeEach, describe, expect, it, vi } from 'vitest';

// The global setupTests mock makes the guard invisible everywhere else in the
// suite — these tests pin the CALL SITES, so removing a guard from a store
// entry point (or flipping getTiles back to self-triggering) fails loudly.
const readinessMocks = vi.hoisted(() => ({
  waitForContentReady: vi.fn(async () => undefined),
}));

vi.mock('@/services/migration/contentReadiness', () => ({
  waitForContentReady: readinessMocks.waitForContentReady,
  initContentReadiness: vi.fn(() => () => {}),
  useMigrationStatus: () => ({ phase: 'ready', error: null, retry: vi.fn() }),
}));

import db from '../store';
import { getTiles } from '../customTiles';
import { getAllAvailableGroups } from '../customGroups';
import { getGroupsWithTiles, getTileCountsByGroup } from '../contentLibrary';

describe('content-readiness guard wiring at store entry points', () => {
  beforeEach(async () => {
    readinessMocks.waitForContentReady.mockClear();
    await db.customTiles.clear();
    await db.customGroups.clear();
  });

  it('getTiles waits without triggering seeding (sync paths must not start it)', async () => {
    await getTiles({ isCustom: 1 });
    expect(readinessMocks.waitForContentReady).toHaveBeenCalledWith(undefined, {
      trigger: false,
    });
  });

  it('getTiles passes its locale filter through to the guard', async () => {
    await getTiles({ locale: 'fr' });
    expect(readinessMocks.waitForContentReady).toHaveBeenCalledWith('fr', { trigger: false });
  });

  it('getAllAvailableGroups guards on its locale argument, not the UI language', async () => {
    await getAllAvailableGroups('es', 'online');
    expect(readinessMocks.waitForContentReady).toHaveBeenCalledWith('es');
  });

  it('getGroupsWithTiles is guarded (the wizard data path on fresh installs)', async () => {
    await getGroupsWithTiles('online');
    expect(readinessMocks.waitForContentReady).toHaveBeenCalled();
  });

  it('getTileCountsByGroup guards on its locale argument', async () => {
    await getTileCountsByGroup('de', 'local');
    expect(readinessMocks.waitForContentReady).toHaveBeenCalledWith('de');
  });
});
