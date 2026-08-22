import { vi } from 'vitest';

/**
 * A fake Realtime Database that models **registrations per path**.
 *
 * The per-file `vi.mock('firebase/database')` factories each return a bare
 * `onValue: vi.fn()` and a bare `off: vi.fn()`, so no test can observe what the
 * real SDK does when two listeners share a node. That is how a blanket
 * `off(ref)` in `videoCallStore.cleanup()` shipped green while silently
 * detaching the participant badge's listener on the same path.
 *
 * This fake reproduces the two SDK behaviours those stubs erase:
 *
 * 1. `off(query)` with no event type and no callback removes **every**
 *    registration at that location, not just the caller's.
 * 2. `onValue` replays the last known value **synchronously** when the path is
 *    already cached — which it is whenever another listener is up.
 *
 * Both are real, both are load-bearing, and neither is visible to a `vi.fn()`.
 */

interface Registration {
  callback: (snapshot: { val: () => unknown }) => void;
  onError?: (error: Error) => void;
}

class FakeRealtimeDatabase {
  private registrations = new Map<string, Registration[]>();
  private cache = new Map<string, unknown>();

  reset(): void {
    this.registrations.clear();
    this.cache.clear();
  }

  /** RTDB rejects these outright; `ref()` throws synchronously on them. */
  private static readonly INVALID_PATH = /[.#$[\]]/;

  ref(path: string): { path: string } {
    if (FakeRealtimeDatabase.INVALID_PATH.test(path)) {
      throw new Error(`child failed: path argument was an invalid path = "${path}"`);
    }
    return { path };
  }

  onValue(
    query: { path: string },
    callback: Registration['callback'],
    onError?: Registration['onError']
  ): () => void {
    const registration: Registration = { callback, onError };
    const existing = this.registrations.get(query.path) ?? [];
    this.registrations.set(query.path, [...existing, registration]);

    // The cached-view replay. Only fires when someone else already holds the
    // path open, which is exactly when a guard keyed on `onValue`'s own return
    // value is still unset.
    if (this.cache.has(query.path)) {
      const value = this.cache.get(query.path);
      callback({ val: () => value });
    }

    return () => {
      const current = this.registrations.get(query.path) ?? [];
      this.registrations.set(
        query.path,
        current.filter((entry) => entry !== registration)
      );
    };
  }

  /** No event type and no callback means detach everything here — the real trap. */
  off(query: { path: string }): void {
    this.registrations.set(query.path, []);
  }

  // ---- test controls ----

  /** Write a value and notify everyone still listening at that path. */
  publish(path: string, value: unknown): void {
    this.cache.set(path, value);
    [...(this.registrations.get(path) ?? [])].forEach((entry) =>
      entry.callback({ val: () => value })
    );
  }

  /** Fail the read for every listener at a path, as a rules denial would. */
  fail(path: string, error = new Error('permission_denied')): void {
    [...(this.registrations.get(path) ?? [])].forEach((entry) => entry.onError?.(error));
  }

  listenerCount(path: string): number {
    return (this.registrations.get(path) ?? []).length;
  }
}

export const fakeDatabase = new FakeRealtimeDatabase();

/**
 * The `firebase/database` module shape, backed by {@link fakeDatabase}. Pass to
 * `vi.mock('firebase/database', () => realtimeDatabaseModule())` — it must be
 * called inside the factory, since `vi.mock` is hoisted above imports.
 */
export function realtimeDatabaseModule() {
  return {
    getDatabase: vi.fn(() => ({})),
    ref: vi.fn((_db: unknown, path: string) => fakeDatabase.ref(path)),
    onValue: vi.fn(
      (
        query: { path: string },
        callback: Registration['callback'],
        onError?: Registration['onError']
      ) => fakeDatabase.onValue(query, callback, onError)
    ),
    off: vi.fn((query: { path: string }) => fakeDatabase.off(query)),
  };
}
