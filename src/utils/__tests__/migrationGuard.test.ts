import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitForMigration } from '../migrationGuard';
import { MIGRATION_IN_PROGRESS_KEY, MIGRATION_TIMEOUT } from '@/services/migration/constants';

describe('waitForMigration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('returns immediately when no migration in progress', async () => {
    const start = Date.now();
    await waitForMigration();
    expect(Date.now() - start).toBe(0);
  });

  it('returns immediately when migration started beyond MIGRATION_TIMEOUT ago', async () => {
    const staleStart = new Date(Date.now() - MIGRATION_TIMEOUT - 1000).toISOString();
    localStorage.setItem(MIGRATION_IN_PROGRESS_KEY, JSON.stringify({ startedAt: staleStart }));

    await waitForMigration();
    // Should resolve immediately — stale lock
  });

  it('waits and returns when migration completes during wait', async () => {
    localStorage.setItem(
      MIGRATION_IN_PROGRESS_KEY,
      JSON.stringify({ startedAt: new Date().toISOString() })
    );

    const waitPromise = waitForMigration();

    // Simulate migration completing after 3 ticks
    await vi.advanceTimersByTimeAsync(150);
    localStorage.removeItem(MIGRATION_IN_PROGRESS_KEY);
    await vi.advanceTimersByTimeAsync(50);

    await waitPromise;
    // No assertion needed — just ensure it resolved
  });

  it('returns after maxWait iterations even if migration never clears', async () => {
    localStorage.setItem(
      MIGRATION_IN_PROGRESS_KEY,
      JSON.stringify({ startedAt: new Date().toISOString() })
    );

    const waitPromise = waitForMigration();

    // Advance past the full timeout
    await vi.advanceTimersByTimeAsync(MIGRATION_TIMEOUT + 1000);

    await waitPromise;
    // Resolved without hanging
  });

  it('ignores invalid JSON in localStorage and returns immediately', async () => {
    localStorage.setItem(MIGRATION_IN_PROGRESS_KEY, 'not-valid-json');

    await waitForMigration();
    // Should not throw
  });

  it('returns immediately in non-browser environments', async () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error simulate no window
    delete globalThis.window;

    await waitForMigration();

    globalThis.window = originalWindow;
  });
});
