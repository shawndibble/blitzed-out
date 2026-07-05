/**
 * Characterization tests for the realtime subscription functions in
 * src/services/firebase.ts: getUserList, getMessages, getSchedule.
 *
 * These pin down the externally observable caller contract (query shape,
 * callback payload shape, unsubscribe behavior) so the internal query-cache /
 * debounce / connection-pool machinery can be deleted safely.
 *
 * Timing note: the current implementation debounces subscriptions (50-300ms
 * depending on priority); the target implementation subscribes synchronously.
 * Tests therefore call `flush()` (advance fake timers + drain microtasks)
 * before asserting — a no-op when the subscription is synchronous — so they
 * pass against both implementations.
 *
 * Cache note: the current implementation caches results per room key for
 * 5-30s, so each test uses a distinct room id to avoid cross-test cache hits.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getMessages, getSchedule, getUserList } from '@/services/firebase';

const h = vi.hoisted(() => ({
  onValue: vi.fn(),
  onSnapshot: vi.fn(),
  collection: vi.fn((_db: unknown, ...pathSegments: string[]) => ({ pathSegments })),
  query: vi.fn((...parts: unknown[]) => ({ parts })),
  where: vi.fn((field: string, op: string, value: unknown) => ({
    type: 'where',
    field,
    op,
    value,
  })),
  orderBy: vi.fn((field: string, direction: string) => ({ type: 'orderBy', field, direction })),
  limit: vi.fn((n: number) => ({ type: 'limit', n })),
  auth: {
    currentUser: null as { uid: string } | null,
    onAuthStateChanged: vi.fn(),
  },
}));

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn((_db: unknown, path: string) => ({ path })),
  push: vi.fn(() => ({ key: 'mock-key' })),
  set: vi.fn(),
  remove: vi.fn(),
  onValue: h.onValue,
  onChildAdded: vi.fn(),
  onDisconnect: vi.fn(() => ({ remove: vi.fn(), set: vi.fn() })),
}));

vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn(() => ({})),
  persistentLocalCache: vi.fn(() => ({})),
  persistentMultipleTabManager: vi.fn(() => ({})),
  collection: h.collection,
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: h.query,
  where: h.where,
  orderBy: h.orderBy,
  limit: h.limit,
  startAfter: vi.fn(),
  onSnapshot: h.onSnapshot,
  serverTimestamp: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: vi.fn((date: Date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 })),
  },
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => h.auth),
  signInAnonymously: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  linkWithCredential: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  EmailAuthProvider: { credential: vi.fn() },
}));

type RtdbSnapshot = { val: () => unknown };
type FirestoreSnapshot = { docs: Array<{ id: string; data: () => Record<string, unknown> }> };

let rtdbCallback: ((snap: RtdbSnapshot) => void) | undefined;
let snapshotCallback: ((snap: FirestoreSnapshot) => void) | undefined;
let authCallback: ((user: { uid: string } | null) => void) | undefined;
const rtdbUnsubscribe = vi.fn();
const firestoreUnsubscribe = vi.fn();
const authUnsubscribe = vi.fn();

/** Drain any debounce timers + microtasks; harmless when subscription is synchronous. */
async function flush(ms = 500): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  rtdbCallback = undefined;
  snapshotCallback = undefined;
  authCallback = undefined;
  h.auth.currentUser = null;
  h.onValue.mockImplementation((_ref: unknown, onNext: (snap: RtdbSnapshot) => void) => {
    rtdbCallback = onNext;
    return rtdbUnsubscribe;
  });
  h.onSnapshot.mockImplementation((_query: unknown, onNext: (snap: FirestoreSnapshot) => void) => {
    snapshotCallback = onNext;
    return firestoreUnsubscribe;
  });
  h.auth.onAuthStateChanged.mockImplementation((cb: (user: { uid: string } | null) => void) => {
    authCallback = cb;
    return authUnsubscribe;
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getUserList', () => {
  it('returns a cleanup function that invokes the underlying RTDB unsubscribe', async () => {
    const cleanup = getUserList('ul-unsub', vi.fn());

    expect(typeof cleanup).toBe('function');
    await flush();
    expect(h.onValue).toHaveBeenCalledTimes(1);

    cleanup?.();
    expect(rtdbUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('filters a multi-room snapshot down to the requested room and shapes each user', async () => {
    const callback = vi.fn();
    getUserList('ul-filter', callback);
    await flush();

    rtdbCallback?.({
      val: () => ({
        alice: {
          room: 'UL-FILTER',
          displayName: 'Alice',
          isAnonymous: false,
          lastSeen: 1_000,
          joinedAt: 500,
        },
        bob: { room: 'OTHER-ROOM', displayName: 'Bob', isAnonymous: true },
      }),
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({
      alice: {
        displayName: 'Alice',
        uid: 'alice',
        lastSeen: new Date(1_000),
        isAnonymous: false,
        joinedAt: new Date(500),
        room: 'UL-FILTER',
      },
    });
  });

  it('invokes the callback with an empty object for a null snapshot', async () => {
    const callback = vi.fn();
    getUserList('ul-null', callback);
    await flush();

    rtdbCallback?.({ val: () => null });

    expect(callback).toHaveBeenCalledWith({});
  });

  it('suppresses the callback when the user set matches existingData', async () => {
    const callback = vi.fn();
    getUserList('ul-same', callback, { alice: {} });
    await flush();

    rtdbCallback?.({
      val: () => ({ alice: { room: 'UL-SAME', displayName: 'Alice', isAnonymous: false } }),
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('delivers the callback when the user set differs from existingData', async () => {
    const callback = vi.fn();
    getUserList('ul-diff', callback, { bob: {} });
    await flush();

    rtdbCallback?.({
      val: () => ({ alice: { room: 'UL-DIFF', displayName: 'Alice', isAnonymous: false } }),
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('returns undefined and never subscribes for a falsy roomId', async () => {
    const callback = vi.fn();

    expect(getUserList(null, callback)).toBeUndefined();
    expect(getUserList(undefined, callback)).toBeUndefined();
    expect(getUserList('', callback)).toBeUndefined();

    await flush();
    expect(h.onValue).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('getMessages', () => {
  const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

  it('queries the room messages collection with a ~3h window, desc order, limit 50', async () => {
    h.auth.currentUser = { uid: 'user-1' };
    getMessages('msg-query', vi.fn());
    await flush();

    expect(h.collection).toHaveBeenCalledWith(
      expect.anything(),
      'chat-rooms',
      'MSG-QUERY',
      'messages'
    );
    expect(h.where).toHaveBeenCalledWith('timestamp', '>', expect.any(Date));
    const timeWindow = h.where.mock.calls[0][2] as Date;
    expect(Math.abs(timeWindow.getTime() - (Date.now() - THREE_HOURS_MS))).toBeLessThan(60_000);
    expect(h.orderBy).toHaveBeenCalledWith('timestamp', 'desc');
    expect(h.limit).toHaveBeenCalledWith(50);
    expect(h.onSnapshot).toHaveBeenCalledTimes(1);
  });

  it('maps snapshot docs to {id, ...data} objects', async () => {
    h.auth.currentUser = { uid: 'user-1' };
    const callback = vi.fn();
    getMessages('msg-docs', callback);
    await flush();

    snapshotCallback?.({
      docs: [
        { id: 'm1', data: () => ({ text: 'hello', type: 'chat' }) },
        { id: 'm2', data: () => ({ text: 'hi' }) },
      ],
    });

    expect(callback).toHaveBeenCalledWith([
      { id: 'm1', text: 'hello', type: 'chat' },
      { id: 'm2', text: 'hi' },
    ]);
  });

  it('returns a function that detaches the Firestore listener', async () => {
    h.auth.currentUser = { uid: 'user-1' };
    const cleanup = getMessages('msg-detach', vi.fn());
    await flush();

    expect(typeof cleanup).toBe('function');
    expect(h.onSnapshot).toHaveBeenCalledTimes(1);

    cleanup?.();
    expect(firestoreUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('defers the query until auth resolves, then subscribes and drops the auth listener', async () => {
    h.auth.currentUser = null;
    getMessages('msg-auth-wait', vi.fn());
    await flush();

    expect(h.auth.onAuthStateChanged).toHaveBeenCalledTimes(1);
    expect(h.onSnapshot).not.toHaveBeenCalled();

    authCallback?.({ uid: 'user-1' });
    await flush();

    expect(h.onSnapshot).toHaveBeenCalledTimes(1);
    expect(authUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('cleanup before auth resolves detaches the auth listener and never subscribes', async () => {
    h.auth.currentUser = null;
    const cleanup = getMessages('msg-auth-cleanup', vi.fn());

    cleanup?.();
    expect(authUnsubscribe).toHaveBeenCalledTimes(1);

    await flush();
    expect(h.onSnapshot).not.toHaveBeenCalled();
  });

  it('returns undefined for a falsy roomId', async () => {
    const callback = vi.fn();

    expect(getMessages(null, callback)).toBeUndefined();
    expect(getMessages(undefined, callback)).toBeUndefined();
    expect(getMessages('', callback)).toBeUndefined();

    await flush();
    expect(h.onSnapshot).not.toHaveBeenCalled();
  });
});

describe('getSchedule', () => {
  const FIVE_MINUTES_MS = 5 * 60 * 1000;

  it('queries the schedule collection with a ~5min lookback, asc order, limit 50', async () => {
    getSchedule(vi.fn());
    await flush();

    expect(h.collection).toHaveBeenCalledWith(expect.anything(), 'schedule');
    expect(h.where).toHaveBeenCalledWith('dateTime', '>', expect.any(Date));
    const cutoff = h.where.mock.calls[0][2] as Date;
    expect(Math.abs(cutoff.getTime() - (Date.now() - FIVE_MINUTES_MS))).toBeLessThan(60_000);
    expect(h.orderBy).toHaveBeenCalledWith('dateTime', 'asc');
    expect(h.limit).toHaveBeenCalledWith(50);
    expect(h.onSnapshot).toHaveBeenCalledTimes(1);
  });

  it('always returns a function, and it detaches the Firestore listener', async () => {
    const cleanup = getSchedule(vi.fn());

    expect(typeof cleanup).toBe('function');
    await flush();
    expect(h.onSnapshot).toHaveBeenCalledTimes(1);

    cleanup();
    expect(firestoreUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
