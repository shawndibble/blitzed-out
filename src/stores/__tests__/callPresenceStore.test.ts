/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { PRESENCE_STALE_MS, ROSTER_STALE_MS } from '@/services/callRoster';
import { PRESENCE_RECOUNT_INTERVAL_MS, useCallPresenceStore } from '../callPresenceStore';

const harness = vi.hoisted(() => ({
  callbacks: [] as Array<(users: unknown) => void>,
  rooms: [] as string[],
  unsubscribes: [] as Array<() => void>,
  /** When set, the seam reports "nothing to watch" — an unusable room id. */
  refuse: false,
  /** When set, the seam replays a cached snapshot synchronously, as RTDB does. */
  replay: null as unknown,
}));

vi.mock('@/services/callPresence', () => ({
  subscribeToCallRoster: vi.fn((roomId: string, callback: (users: unknown) => void) => {
    harness.rooms.push(roomId);
    if (harness.refuse) return undefined;
    harness.callbacks.push(callback);
    const unsubscribe = vi.fn();
    harness.unsubscribes.push(unsubscribe);
    // RTDB raises the first event synchronously when the node is already cached,
    // i.e. whenever another listener on that path is up.
    if (harness.replay !== null) callback(harness.replay);
    return unsubscribe;
  }),
}));

/** Publish a snapshot to every live callback. */
function publish(users: unknown) {
  harness.callbacks.forEach((callback) => callback(users));
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
    harness.callbacks.length = 0;
    harness.rooms.length = 0;
    harness.unsubscribes.length = 0;
    harness.refuse = false;
    harness.replay = null;
  });

  afterEach(() => {
    useCallPresenceStore.getState().stopWatching();
    vi.useRealTimers();
  });

  test('watches the room it was given', () => {
    useCallPresenceStore.getState().watch('PUBLIC');

    expect(harness.rooms).toEqual(['PUBLIC']);
  });

  test('reports the live participant count', () => {
    useCallPresenceStore.getState().watch('PUBLIC');
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
    useCallPresenceStore.getState().watch('PUBLIC');
    publish(null);

    expect(useCallPresenceStore.getState().loaded).toBe(true);
    expect(useCallPresenceStore.getState().count).toBe(0);
  });

  // Every participant's heartbeat rewrites `lastSeen` every 30s, so the snapshot
  // churns constantly while the count sits still. Re-setting state on each one
  // would re-render the badge for nothing.
  test('does not restate an unchanged count', () => {
    useCallPresenceStore.getState().watch('PUBLIC');
    publish(freshUsers(2));

    const listener = vi.fn();
    const stop = useCallPresenceStore.subscribe(listener);
    publish(freshUsers(2));
    stop();

    expect(listener).not.toHaveBeenCalled();
  });

  test('ages out a stale participant with no new snapshot', () => {
    useCallPresenceStore.getState().watch('PUBLIC');
    publish(freshUsers(2));
    expect(useCallPresenceStore.getState().count).toBe(2);

    vi.advanceTimersByTime(PRESENCE_STALE_MS + PRESENCE_RECOUNT_INTERVAL_MS);

    expect(useCallPresenceStore.getState().count).toBe(0);
  });

  test('re-watching the same room does not open a second listener', () => {
    useCallPresenceStore.getState().watch('PUBLIC');
    useCallPresenceStore.getState().watch('PUBLIC');

    expect(harness.callbacks).toHaveLength(1);
  });

  test('switching rooms drops the previous listener and resets the count', () => {
    useCallPresenceStore.getState().watch('PUBLIC');
    publish(freshUsers(2));

    useCallPresenceStore.getState().watch('OTHER');

    expect(harness.unsubscribes[0]).toHaveBeenCalled();
    expect(harness.rooms).toEqual(['PUBLIC', 'OTHER']);
    expect(useCallPresenceStore.getState().count).toBe(0);
    expect(useCallPresenceStore.getState().loaded).toBe(false);
  });

  test('stopWatching tears down the listener and the recount timer', () => {
    useCallPresenceStore.getState().watch('PUBLIC');
    publish(freshUsers(2));

    useCallPresenceStore.getState().stopWatching();

    expect(harness.unsubscribes[0]).toHaveBeenCalled();
    expect(useCallPresenceStore.getState().count).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  test('ignores a snapshot that lands after teardown', () => {
    useCallPresenceStore.getState().watch('PUBLIC');
    const [stale] = harness.callbacks;
    useCallPresenceStore.getState().stopWatching();

    stale(freshUsers(3));

    expect(useCallPresenceStore.getState().count).toBe(0);
  });

  // A stale callback from the room we just left must not overwrite the new room's
  // count. Keying the guard on "is there a detach handle" cannot tell the two
  // apart, because after re-watching there is one again.
  test('ignores a snapshot from the room it just left', () => {
    useCallPresenceStore.getState().watch('PUBLIC');
    const [previousRoom] = harness.callbacks;

    useCallPresenceStore.getState().watch('OTHER');
    publish(freshUsers(1));
    previousRoom(freshUsers(5));

    expect(useCallPresenceStore.getState().count).toBe(1);
  });

  // RTDB replays a cached view synchronously when another listener on the node is
  // already up — which is the case whenever a call is active. A guard keyed on the
  // subscribe call's return value is still unset at that moment and drops it.
  test('keeps a snapshot delivered synchronously during subscription', () => {
    harness.replay = freshUsers(2);

    useCallPresenceStore.getState().watch('PUBLIC');

    expect(useCallPresenceStore.getState().count).toBe(2);
    expect(useCallPresenceStore.getState().loaded).toBe(true);
  });

  // A failed read leaves no snapshot. Counting anyway would publish a confident
  // zero, and `loaded` would claim the answer is known.
  test('does not fabricate a count before the first snapshot', () => {
    useCallPresenceStore.getState().watch('PUBLIC');

    vi.advanceTimersByTime(PRESENCE_RECOUNT_INTERVAL_MS * 3);

    expect(useCallPresenceStore.getState().loaded).toBe(false);
    expect(useCallPresenceStore.getState().count).toBe(0);
  });

  test('starts no timer when the room id is unusable', () => {
    harness.refuse = true;

    useCallPresenceStore.getState().watch('bad.id');

    expect(vi.getTimerCount()).toBe(0);
    expect(useCallPresenceStore.getState().loaded).toBe(false);
  });

  // The badge wants responsiveness; the mesh cap wants to respect anyone still
  // holding a slot. A throttled background tab is the case that splits them.
  describe('capacityCount', () => {
    test('keeps a participant the badge has already dropped', () => {
      useCallPresenceStore.getState().watch('PUBLIC');
      const now = Date.now();
      publish({
        here: { lastSeen: now },
        backgrounded: { lastSeen: now - PRESENCE_STALE_MS - 1 },
      });

      expect(useCallPresenceStore.getState().count).toBe(1);
      expect(useCallPresenceStore.getState().capacityCount).toBe(2);
    });

    test('drops a participant past the dialling window too', () => {
      useCallPresenceStore.getState().watch('PUBLIC');
      const now = Date.now();
      publish({
        here: { lastSeen: now },
        gone: { lastSeen: now - ROSTER_STALE_MS - 1 },
      });

      expect(useCallPresenceStore.getState().capacityCount).toBe(1);
    });

    test('matches the badge when everyone is heartbeating', () => {
      useCallPresenceStore.getState().watch('PUBLIC');
      publish(freshUsers(3));

      expect(useCallPresenceStore.getState().capacityCount).toBe(3);
      expect(useCallPresenceStore.getState().count).toBe(3);
    });
  });
});
