import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// setupTests mocks this module globally; these tests exercise the real one.
vi.unmock('@/services/migration/contentReadiness');

const serviceMocks = vi.hoisted(() => ({
  ensureLanguageMigrated: vi.fn(),
  verifyMigrationIntegrity: vi.fn(),
  fixMigrationStatusCorruption: vi.fn(),
}));

vi.mock('@/services/migrationService', () => serviceMocks);

import {
  waitForContentReady,
  useMigrationStatus,
  __resetContentReadinessForTests,
} from '@/services/migration/contentReadiness';
import {
  markLanguageMigrated,
  setLanguageMigrationInProgress,
} from '@/services/migration/statusManager';
import { MIGRATION_TIMEOUT } from '@/services/migration/constants';

const flushMicrotasks = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('contentReadiness', () => {
  beforeEach(() => {
    localStorage.clear();
    __resetContentReadinessForTests();
    serviceMocks.ensureLanguageMigrated.mockReset();
    serviceMocks.verifyMigrationIntegrity.mockResolvedValue(true);
    serviceMocks.fixMigrationStatusCorruption.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('waitForContentReady', () => {
    it('resolves immediately when status is completed, without self-triggering', async () => {
      markLanguageMigrated('en');

      // Fake timers: if the guard polled or slept, this await would hang.
      vi.useFakeTimers();
      await waitForContentReady('en');
      vi.useRealTimers();

      expect(serviceMocks.ensureLanguageMigrated).not.toHaveBeenCalled();
    });

    it('awaits in-flight seeding in this tab and resolves only after completion', async () => {
      let resolveSeed!: (ok: boolean) => void;
      serviceMocks.ensureLanguageMigrated.mockImplementation(
        () =>
          new Promise<boolean>((resolve) => {
            resolveSeed = resolve;
          })
      );

      const first = waitForContentReady('en');
      const second = waitForContentReady('en');

      let secondDone = false;
      second.then(() => {
        secondDone = true;
      });

      await flushMicrotasks();
      expect(serviceMocks.ensureLanguageMigrated).toHaveBeenCalledTimes(1);
      expect(secondDone).toBe(false);

      markLanguageMigrated('en');
      resolveSeed(true);
      await first;
      await second;
      expect(secondDone).toBe(true);
    });

    it('self-triggers seeding once; concurrent callers share one run', async () => {
      serviceMocks.ensureLanguageMigrated.mockImplementation(async (locale: string) => {
        markLanguageMigrated(locale);
        return true;
      });

      await Promise.all([
        waitForContentReady('en'),
        waitForContentReady('en'),
        waitForContentReady('en'),
      ]);

      expect(serviceMocks.ensureLanguageMigrated).toHaveBeenCalledTimes(1);
      expect(serviceMocks.ensureLanguageMigrated).toHaveBeenCalledWith('en');
      expect(useMigrationStatus.getState().phase).toBe('ready');
    });

    it('resolves on seeding failure, goes degraded, memoizes the failure, and retry() re-attempts', async () => {
      serviceMocks.ensureLanguageMigrated.mockRejectedValue(new Error('seed exploded'));

      await waitForContentReady('en');
      expect(useMigrationStatus.getState().phase).toBe('degraded');
      expect(useMigrationStatus.getState().error).toBeTruthy();

      // Second call must not re-trigger seeding (failure memoized per locale).
      await waitForContentReady('en');
      expect(serviceMocks.ensureLanguageMigrated).toHaveBeenCalledTimes(1);

      // retry() clears the memo and re-runs seeding.
      serviceMocks.ensureLanguageMigrated.mockImplementation(async (locale: string) => {
        markLanguageMigrated(locale);
        return true;
      });
      await useMigrationStatus.getState().retry();
      expect(serviceMocks.ensureLanguageMigrated).toHaveBeenCalledTimes(2);
      expect(useMigrationStatus.getState().phase).toBe('ready');
      expect(useMigrationStatus.getState().error).toBeNull();
    });

    it('goes degraded when seeding reports failure (returns false) without throwing', async () => {
      serviceMocks.ensureLanguageMigrated.mockResolvedValue(false);

      await waitForContentReady('en');
      expect(useMigrationStatus.getState().phase).toBe('degraded');
      expect(useMigrationStatus.getState().error).toBeTruthy();
    });

    it('waits on a cross-tab lock and resolves when the lock clears with status complete', async () => {
      vi.useFakeTimers();
      setLanguageMigrationInProgress('en', true);

      let done = false;
      const pending = waitForContentReady('en').then(() => {
        done = true;
      });

      await vi.advanceTimersByTimeAsync(1000);
      expect(done).toBe(false);
      expect(serviceMocks.ensureLanguageMigrated).not.toHaveBeenCalled();

      markLanguageMigrated('en');
      setLanguageMigrationInProgress('en', false);
      await vi.advanceTimersByTimeAsync(200);
      await pending;

      expect(done).toBe(true);
      expect(serviceMocks.ensureLanguageMigrated).not.toHaveBeenCalled();
    });

    it('does not hang on a lock older than the cap', async () => {
      vi.useFakeTimers();
      setLanguageMigrationInProgress('en', true);

      let done = false;
      const pending = waitForContentReady('en', { trigger: false }).then(() => {
        done = true;
      });

      await vi.advanceTimersByTimeAsync(MIGRATION_TIMEOUT + 1000);
      await pending;

      expect(done).toBe(true);
      expect(serviceMocks.ensureLanguageMigrated).not.toHaveBeenCalled();
    });

    it('never initiates seeding for trigger:false callers', async () => {
      await waitForContentReady('en', { trigger: false });
      expect(serviceMocks.ensureLanguageMigrated).not.toHaveBeenCalled();
    });
  });
});
