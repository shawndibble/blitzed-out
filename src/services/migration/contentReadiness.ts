/**
 * Content readiness — the single question data paths ask before touching
 * seeded content: "is content for this locale ready?"
 *
 * Replaces the 9-member MigrationContext. UI-facing store entry points await
 * `waitForContentReady`; components that need a status read `useMigrationStatus`.
 *
 * Resolution order (deliberate, see guard fast-path note below):
 *   1. completion status (synchronous localStorage read) → resolve immediately
 *   2. in-memory per-locale registry (seeding in flight in THIS tab) → await it
 *   3. cross-tab lock poll over the three migration lock keys, capped at
 *      MIGRATION_TIMEOUT past the lock's startedAt → then re-check status
 *   4. not started → self-trigger seeding once per locale per session
 *      (failures memoized per locale; retry() is the only re-attempt path)
 *   5. failure → resolve anyway (degraded). This promise never rejects.
 *
 * Fast-path requirement: when status is already completed the function returns
 * before any await, so Dexie liveQuery callers (CustomTileDialog) keep their
 * dependency tracking intact on the hot path.
 */

import i18next from 'i18next';
import { create } from 'zustand';
import {
  MIGRATION_IN_PROGRESS_KEY,
  CURRENT_LANGUAGE_MIGRATION_KEY,
  BACKGROUND_MIGRATION_IN_PROGRESS_KEY,
  MIGRATION_TIMEOUT,
  MIGRATION_KEY,
  GAME_MODES,
} from './constants';
import {
  isCurrentLanguageMigrationCompleted,
  isMigrationInProgress,
  isLanguageMigrationInProgress,
  isBackgroundMigrationInProgress,
} from './statusManager';

const LANGUAGE_CHANGE_DEBOUNCE = 300;
const LOCK_POLL_INTERVAL = 50;

export type ContentReadinessPhase = 'seeding' | 'ready' | 'degraded';

interface MigrationStatusState {
  /** Phase for the CURRENT locale; recomputed on language change. */
  phase: ContentReadinessPhase;
  error: string | null;
  /** Clears the per-locale failure memo and re-runs seeding. */
  retry: () => Promise<void>;
}

/** Seeding runs in flight in this tab, keyed by locale. */
const inFlight = new Map<string, Promise<void>>();
/** Locales whose self-triggered seeding failed this session (no retry loops). */
const failedLocales = new Map<string, string>();

let appStartTracked = false;
let integrityCheck: Promise<void> | null = null;

// Same fallback chain as the guarded queries (contentLibrary/customGroups) —
// a mismatch would seed one locale while the query filters by another.
const currentLocale = (): string => i18next.resolvedLanguage || i18next.language || 'en';

function computePhase(locale: string): { phase: ContentReadinessPhase; error: string | null } {
  if (isCurrentLanguageMigrationCompleted(locale)) return { phase: 'ready', error: null };
  const failure = failedLocales.get(locale);
  if (failure !== undefined) return { phase: 'degraded', error: failure };
  return { phase: 'seeding', error: null };
}

export const useMigrationStatus = create<MigrationStatusState>(() => ({
  ...computePhase(currentLocale()),
  retry: async () => {
    failedLocales.delete(currentLocale());
    refreshStatus();
    await ensureSeeded(currentLocale());
  },
}));

function refreshStatus(): void {
  const next = computePhase(currentLocale());
  const state = useMigrationStatus.getState();
  if (state.phase !== next.phase || state.error !== next.error) {
    useMigrationStatus.setState(next);
  }
}

/**
 * Trigger seeding for a locale, memoized per session: concurrent callers share
 * one run (registry set synchronously before the first await), and a failed
 * run is not re-attempted until retry(). Never rejects.
 */
function ensureSeeded(locale: string): Promise<void> {
  if (isCurrentLanguageMigrationCompleted(locale)) {
    refreshStatus();
    return Promise.resolve();
  }
  const existing = inFlight.get(locale);
  if (existing) return existing;
  if (failedLocales.has(locale)) return Promise.resolve();

  const run = (async () => {
    try {
      const { ensureLanguageMigrated } = await import('@/services/migrationService');
      const success = await ensureLanguageMigrated(locale);
      if (!success) {
        failedLocales.set(locale, `Content seeding failed for "${locale}"`);
      }
    } catch (error) {
      failedLocales.set(
        locale,
        error instanceof Error ? error.message : `Content seeding failed for "${locale}"`
      );
    } finally {
      inFlight.delete(locale);
      refreshStatus();
    }
  })();

  inFlight.set(locale, run);
  refreshStatus();
  return run;
}

interface LockRecord {
  startedAt?: string;
}

const readLock = (key: string): LockRecord | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as LockRecord) : null;
  } catch {
    return null;
  }
};

/**
 * Latest deadline (lock startedAt + MIGRATION_TIMEOUT) across the three active
 * migration locks, or null when no lock is active or all are past their cap —
 * a crashed tab's abandoned lock must not make every caller wait.
 */
function seedingLockDeadline(locale: string): number | null {
  const locks: Array<[boolean, string]> = [
    [isMigrationInProgress(), MIGRATION_IN_PROGRESS_KEY],
    [isLanguageMigrationInProgress(locale), CURRENT_LANGUAGE_MIGRATION_KEY],
    [isBackgroundMigrationInProgress(), BACKGROUND_MIGRATION_IN_PROGRESS_KEY],
  ];

  const now = Date.now();
  let deadline: number | null = null;
  for (const [active, key] of locks) {
    if (!active) continue;
    const startedAt = Date.parse(readLock(key)?.startedAt ?? '');
    // A lock without a parseable startedAt can never be stale-cleaned by
    // statusManager either — treat it as already expired rather than waiting
    // on a record that will outlive every cap.
    if (Number.isNaN(startedAt)) continue;
    const lockDeadline = startedAt + MIGRATION_TIMEOUT;
    if (lockDeadline > now && (deadline === null || lockDeadline > deadline)) {
      deadline = lockDeadline;
    }
  }
  return deadline;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function waitForCrossTabSeeding(locale: string): Promise<void> {
  // Hard total cap independent of per-lock deadlines (the deleted
  // migrationGuard had one): no lock state, however malformed or refreshed,
  // may hold every caller hostage past one timeout window.
  const cap = Date.now() + MIGRATION_TIMEOUT;
  while (seedingLockDeadline(locale) !== null && Date.now() < cap) {
    await sleep(LOCK_POLL_INTERVAL);
    // Seeding may have started in this tab meanwhile — join it.
    const pending = inFlight.get(locale);
    if (pending) {
      await pending;
      return;
    }
    if (isCurrentLanguageMigrationCompleted(locale)) return;
  }
}

/**
 * Resolve when seeded content for the locale is ready (or degraded — never
 * rejects). `trigger: false` callers (getTiles / sync paths) wait on active
 * seeding but never initiate it: a first-login cloud pull must not start
 * seeding.
 */
export async function waitForContentReady(
  locale?: string,
  opts: { trigger?: boolean } = {}
): Promise<void> {
  const target = locale || currentLocale();

  // (1) Fast path — must stay synchronous up to this return (liveQuery).
  if (isCurrentLanguageMigrationCompleted(target)) return;

  // (2) Seeding in flight in this tab.
  const pending = inFlight.get(target);
  if (pending) {
    await pending;
    return;
  }

  // (3) Another tab holds a migration lock — poll, capped past lock start.
  if (seedingLockDeadline(target) !== null) {
    await waitForCrossTabSeeding(target);
    if (isCurrentLanguageMigrationCompleted(target)) return;
    const joined = inFlight.get(target);
    if (joined) {
      await joined;
      return;
    }
  }

  // (4) Not started — self-trigger once per locale per session.
  if (opts.trigger === false) return;
  await ensureSeeded(target);
}

/** Best-effort app-start analytics, ported from the old MigrationProvider mount. */
async function trackAppStartOnce(): Promise<void> {
  if (appStartTracked) return;
  appStartTracked = true;
  try {
    const userType: 'new' | 'returning' = localStorage.getItem(MIGRATION_KEY) ? 'returning' : 'new';
    const { analytics } = await import('@/services/analytics');
    analytics.trackAppStart(performance.now(), userType);
  } catch {
    // Analytics failure must not block content readiness.
  }
}

/**
 * Corruption recovery ported from the old provider: localStorage claiming
 * "complete" over an empty Dexie would make the fast path lie forever, so
 * reset the status and let seeding re-run.
 */
function verifyIntegrityOnce(): Promise<void> {
  // Memoize the promise, not a flag: a second init during an in-flight check
  // must wait for the corruption reset, or it seeds against the lying status.
  if (!integrityCheck) {
    integrityCheck = (async () => {
      try {
        const { verifyMigrationIntegrity, fixMigrationStatusCorruption } =
          await import('@/services/migrationService');
        // Integrity is per game mode; corruption in either content set must
        // reset the status or the fast path lies forever.
        const locale = currentLocale();
        const results = await Promise.all(
          GAME_MODES.map((mode) => verifyMigrationIntegrity(locale, mode))
        );
        if (results.some((intact) => !intact)) fixMigrationStatusCorruption();
      } catch {
        // Non-blocking: seeding proceeds against whatever status remains.
      }
    })();
  }
  return integrityCheck;
}

/**
 * Start the content-readiness lifecycle: seed the current locale on init and
 * re-seed on (debounced) language changes. Call once from app entry after auth
 * resolves; returns a teardown. Waiter resolution is tied to statusManager
 * transitions via the seeding promise — never to the debounce timer.
 */
export function initContentReadiness(): () => void {
  let disposed = false;
  let debounce: ReturnType<typeof setTimeout> | null = null;

  const onLanguageChanged = (locale: string) => {
    refreshStatus();
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      debounce = null;
      if (!disposed) void ensureSeeded(locale);
    }, LANGUAGE_CHANGE_DEBOUNCE);
  };

  const start = async () => {
    if (disposed) return;
    i18next.on('languageChanged', onLanguageChanged);
    void trackAppStartOnce();
    await verifyIntegrityOnce();
    if (disposed) return;
    refreshStatus();
    void ensureSeeded(currentLocale());
  };

  if (i18next.isInitialized) {
    void start();
  } else {
    i18next.on('initialized', start);
  }

  return () => {
    disposed = true;
    i18next.off('initialized', start);
    i18next.off('languageChanged', onLanguageChanged);
    if (debounce) clearTimeout(debounce);
  };
}

/** Test-only: clear module state so cases don't leak into each other. */
export function __resetContentReadinessForTests(): void {
  inFlight.clear();
  failedLocales.clear();
  appStartTracked = false;
  integrityCheck = null;
  useMigrationStatus.setState(computePhase(currentLocale()));
}
