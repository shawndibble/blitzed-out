/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { PRESENCE_STALE_MS } from '@/services/callRoster';
import { PRESENCE_RECOUNT_INTERVAL_MS, useCallPresenceStore } from '../callPresenceStore';

const harness = vi.hoisted(() => ({
  listeners: [] as Array<(snapshot: { val: () => unknown }) => void>,
  paths: [] as string[],
  unsubscribes: [] as Array<() => void>,
}));

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn((_db: unknown, path: string) => {
    harness.paths.push(path);
    return { path };
  }),
  onValue: vi.fn((_ref, callback) => {
    harness.listeners.push(callback);
    const unsubscribe = vi.fn();
    harness.unsubscribes.push(unsubscribe);
    return unsubscribe;
  }),
}));

/** Publish a snapshot to every listener the store registered. */
function publish(users: unknown) {
  harness.listeners.forEach((listener) => listener({ val: () => users }));
}

/** A snapshot of `count` participants, all heartbeating right now. */
function freshUsers(count: number): Record<string, { lastSeen: number }> {
  return Object.fromEntries(
    Array.from({ length: count }, (_, index) => [`user-${index}`, { lastSeen: Date.now() }])
  );
}

describe('callPresenceStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    harness.listeners.length = 0;
    harness.paths.length = 0;
    harness.unsubscribes.length = 0;
  });

  afterEach(() => {
    useCallPresenceStore.getState().unsubscribe();
    vi.useRealTimers();
  });

  test('reads the call roster, not room membership', () => {
    useCallPresenceStore.getState().subscribe('PUBLIC');

    expect(harness.paths).toEqual(['video-calls/PUBLIC/users']);
  });

  test('reports the live participant count', () => {
    useCallPresenceStore.getState().subscribe('PUBLIC');
    publish(freshUsers(3));

    expect(useCallPresenceStore.getState().count).toBe(3);
  });

  test('starts at zero and unloaded', () => {
    expect(useCallPresenceStore.getState().count).toBe(0);
    expect(useCallPresenceStore.getState().loaded).toBe(false);
  });

  // An empty call is a real answer, not a missing one — the badge has to be able
  // to tell "nobody here" from "not known yet".
  test('marks itself loaded on an empty snapshot', () => {
    useCallPresenceStore.getState().subscribe('PUBLIC');
    publish(null);

    expect(useCallPresenceStore.getState().loaded).toBe(true);
    expect(useCallPresenceStore.getState().count).toBe(0);
  });

  // Every participant's heartbeat rewrites `lastSeen` every 30s, so the snapshot
  // churns constantly while the count sits still. Re-setting state on each one
  // would re-render the badge for nothing.
  test('does not restate an unchanged count', () => {
    useCallPresenceStore.getState().subscribe('PUBLIC');
    publish(freshUsers(2));

    const listener = vi.fn();
    const stop = useCallPresenceStore.subscribe(listener);
    publish(freshUsers(2));
    stop();

    expect(listener).not.toHaveBeenCalled();
  });

  // `onValue` does not fire when nothing changes, but staleness is time-based, so
  // a crashed participant would otherwise be advertised until someone else moved.
  test('ages out a stale participant with no new snapshot', () => {
    useCallPresenceStore.getState().subscribe('PUBLIC');
    publish(freshUsers(2));
    expect(useCallPresenceStore.getState().count).toBe(2);

    vi.advanceTimersByTime(PRESENCE_STALE_MS + PRESENCE_RECOUNT_INTERVAL_MS);

    expect(useCallPresenceStore.getState().count).toBe(0);
  });

  test('resubscribing to the same room does not open a second listener', () => {
    useCallPresenceStore.getState().subscribe('PUBLIC');
    useCallPresenceStore.getState().subscribe('PUBLIC');

    expect(harness.listeners).toHaveLength(1);
  });

  test('switching rooms drops the previous listener and resets the count', () => {
    useCallPresenceStore.getState().subscribe('PUBLIC');
    publish(freshUsers(2));

    useCallPresenceStore.getState().subscribe('OTHER');

    expect(harness.unsubscribes[0]).toHaveBeenCalled();
    expect(harness.paths).toEqual(['video-calls/PUBLIC/users', 'video-calls/OTHER/users']);
    expect(useCallPresenceStore.getState().count).toBe(0);
    expect(useCallPresenceStore.getState().loaded).toBe(false);
  });

  test('unsubscribe tears down the listener and the recount timer', () => {
    useCallPresenceStore.getState().subscribe('PUBLIC');
    publish(freshUsers(2));

    useCallPresenceStore.getState().unsubscribe();

    expect(harness.unsubscribes[0]).toHaveBeenCalled();
    expect(useCallPresenceStore.getState().count).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  // A snapshot arriving after teardown must not resurrect the count — the room
  // has already gone.
  test('ignores a snapshot that lands after unsubscribe', () => {
    useCallPresenceStore.getState().subscribe('PUBLIC');
    useCallPresenceStore.getState().unsubscribe();

    publish(freshUsers(3));

    expect(useCallPresenceStore.getState().count).toBe(0);
  });
});
