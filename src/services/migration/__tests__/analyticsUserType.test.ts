import { afterEach, describe, expect, it, vi } from 'vitest';

// setupTests mocks this module globally (waitForContentReady resolved,
// phase 'ready') — these tests exercise the real module-eval snapshot.
vi.unmock('@/services/migration/contentReadiness');

/**
 * The `app_lifecycle` 'new'/'returning' cohort read must be a module-eval
 * snapshot, not a lazy read: guarded store reads (contentLibrary,
 * customGroups, customTiles) can reach `ensureSeeded` and complete seeding
 * before `initContentReadiness`'s effect ever runs (AllProviders mounts
 * after the store layer may already have read once). A lazy read would let
 * that in-session seeding flip a brand-new user to 'returning' — the same
 * class of bug this change fixes, inverted. These tests drive real
 * module-eval semantics via vi.resetModules() + dynamic import, not the
 * test-only reset helper (which would recompute the snapshot on a path
 * production never takes).
 */
describe('trackAppStart user-type cohort (module-eval snapshot)', () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('@/services/analytics');
    vi.doUnmock('@/services/migrationService');
    localStorage.clear();
  });

  it('reports "new" when localStorage is empty at module import', async () => {
    localStorage.clear();
    vi.resetModules();

    const trackAppStart = vi.fn();
    vi.doMock('@/services/analytics', () => ({ analytics: { trackAppStart } }));
    vi.doMock('@/services/migrationService', () => ({
      ensureLanguageMigrated: vi.fn().mockResolvedValue(true),
      verifyMigrationIntegrity: vi.fn().mockResolvedValue(true),
      fixMigrationStatusCorruption: vi.fn(),
    }));

    const i18next = (await import('i18next')).default as unknown as {
      isInitialized: boolean;
    };
    i18next.isInitialized = true;

    const { initContentReadiness } = await import('@/services/migration/contentReadiness');
    const dispose = initContentReadiness();
    await vi.waitFor(() => expect(trackAppStart).toHaveBeenCalled());
    dispose();

    expect(trackAppStart).toHaveBeenCalledWith(expect.any(Number), 'new');
  });

  it('reports "returning" when a locale was already seeded before module import', async () => {
    localStorage.setItem(
      'blitzed-out-background-migration',
      JSON.stringify({ version: '2.6.0', completedLanguages: ['en'], inProgress: false })
    );
    vi.resetModules();

    const trackAppStart = vi.fn();
    vi.doMock('@/services/analytics', () => ({ analytics: { trackAppStart } }));
    vi.doMock('@/services/migrationService', () => ({
      ensureLanguageMigrated: vi.fn().mockResolvedValue(true),
      verifyMigrationIntegrity: vi.fn().mockResolvedValue(true),
      fixMigrationStatusCorruption: vi.fn(),
    }));

    const i18next = (await import('i18next')).default as unknown as {
      isInitialized: boolean;
    };
    i18next.isInitialized = true;

    const { initContentReadiness } = await import('@/services/migration/contentReadiness');
    const dispose = initContentReadiness();
    await vi.waitFor(() => expect(trackAppStart).toHaveBeenCalled());
    dispose();

    expect(trackAppStart).toHaveBeenCalledWith(expect.any(Number), 'returning');
  });

  it('still reports "new" when seeding completes in-session before initContentReadiness runs', async () => {
    localStorage.clear();
    vi.resetModules();

    const trackAppStart = vi.fn();
    vi.doMock('@/services/analytics', () => ({ analytics: { trackAppStart } }));

    const statusManager = await import('@/services/migration/statusManager');
    vi.doMock('@/services/migrationService', () => ({
      ensureLanguageMigrated: vi.fn(async (locale: string) => {
        statusManager.markLanguageMigrated(locale);
        return true;
      }),
      verifyMigrationIntegrity: vi.fn().mockResolvedValue(true),
      fixMigrationStatusCorruption: vi.fn(),
    }));

    const i18next = (await import('i18next')).default as unknown as {
      isInitialized: boolean;
    };
    i18next.isInitialized = true;

    // Module-eval happens HERE, against still-empty localStorage — before any
    // seeding has occurred this session.
    const { waitForContentReady, initContentReadiness } =
      await import('@/services/migration/contentReadiness');

    // A guarded store read reaches the seeding gate first, exactly like a
    // component mounted above/before AllProviders' effect could.
    await waitForContentReady('en');
    expect(statusManager.isCurrentLanguageMigrationCompleted('en')).toBe(true);

    // AllProviders' effect only fires now.
    const dispose = initContentReadiness();
    await vi.waitFor(() => expect(trackAppStart).toHaveBeenCalled());
    dispose();

    expect(trackAppStart).toHaveBeenCalledWith(expect.any(Number), 'new');
  });
});
