/**
 * Characterization tests for src/services/roomPresence.ts -- the sole owner
 * of the RTDB `users/{uid}` presence shape, both directions:
 *
 *   - WRITERS: setMyPresence, updatePresenceHeartbeat, removeMyPresence,
 *     startPresenceHeartbeat (moved here from the now-deleted src/services/presence.ts)
 *   - READER: getUserList (moved here from src/services/firebase.ts, with the
 *     `existingData` baseline parameter dropped -- see the inverted tests below)
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  onValue: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
  onDisconnectRemove: vi.fn(),
  onDisconnect: vi.fn(),
  auth: {
    currentUser: null as { uid: string; isAnonymous: boolean } | null,
  },
}));

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn((_db: unknown, path: string) => ({ path })),
  get: h.get,
  set: h.set,
  remove: h.remove,
  onValue: h.onValue,
  onDisconnect: h.onDisconnect,
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

let rtdbCallback: ((snap: RtdbSnapshot) => void) | undefined;
const rtdbUnsubscribe = vi.fn();

beforeEach(async () => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  rtdbCallback = undefined;
  h.auth.currentUser = null;

  h.onValue.mockImplementation((_ref: unknown, onNext: (snap: RtdbSnapshot) => void) => {
    rtdbCallback = onNext;
    return rtdbUnsubscribe;
  });
  h.onDisconnectRemove.mockResolvedValue(undefined);
  h.onDisconnect.mockReturnValue({ remove: h.onDisconnectRemove });
  h.set.mockResolvedValue(undefined);
  h.remove.mockResolvedValue(undefined);
  h.get.mockResolvedValue({ exists: () => false, val: () => null });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('setMyPresence', () => {
  it('does nothing when no user is authenticated', async () => {
    const { setMyPresence } = await import('../roomPresence');
    h.auth.currentUser = null;

    await setMyPresence({ newRoom: 'abcd', oldRoom: null, newDisplayName: 'Alex' });

    expect(h.set).not.toHaveBeenCalled();
  });

  it('writes users/{uid} with the four rules-validated fields and an uppercased room', async () => {
    const { setMyPresence } = await import('../roomPresence');
    h.auth.currentUser = { uid: 'user-1', isAnonymous: false };

    await setMyPresence({ newRoom: 'abcd', oldRoom: null, newDisplayName: 'Alex' });

    expect(h.set).toHaveBeenCalledWith(
      { path: 'users/user-1' },
      expect.objectContaining({
        displayName: 'Alex',
        isAnonymous: false,
        room: 'ABCD',
        joinedAt: expect.any(Number),
        lastSeen: expect.any(Number),
      })
    );
  });

  it('removes the old record only when the room actually changes', async () => {
    const { setMyPresence } = await import('../roomPresence');
    h.auth.currentUser = { uid: 'user-1', isAnonymous: false };

    await setMyPresence({ newRoom: 'newroom', oldRoom: 'oldroom', newDisplayName: 'Alex' });

    expect(h.remove).toHaveBeenCalledWith({ path: 'users/user-1' });
  });

  it('does not remove anything when the room is unchanged', async () => {
    const { setMyPresence } = await import('../roomPresence');
    h.auth.currentUser = { uid: 'user-1', isAnonymous: false };

    await setMyPresence({ newRoom: 'sameroom', oldRoom: 'sameroom', newDisplayName: 'Alex' });

    expect(h.remove).not.toHaveBeenCalled();
  });

  it('registers onDisconnect().remove() only when removeOnDisconnect is true', async () => {
    const { setMyPresence } = await import('../roomPresence');
    h.auth.currentUser = { uid: 'user-1', isAnonymous: false };

    await setMyPresence({
      newRoom: 'abcd',
      oldRoom: null,
      newDisplayName: 'Alex',
      removeOnDisconnect: false,
    });

    expect(h.onDisconnect).not.toHaveBeenCalled();
  });

  it('swallows a permission-denial error from onDisconnect', async () => {
    const { setMyPresence } = await import('../roomPresence');
    h.auth.currentUser = { uid: 'user-1', isAnonymous: false };
    h.onDisconnectRemove.mockRejectedValueOnce(
      Object.assign(new Error('permission denied'), { name: 'NotAllowedError' })
    );

    await expect(
      setMyPresence({ newRoom: 'abcd', oldRoom: null, newDisplayName: 'Alex' })
    ).resolves.toBeUndefined();
  });

  it('rethrows a non-permission error from onDisconnect', async () => {
    const { setMyPresence } = await import('../roomPresence');
    h.auth.currentUser = { uid: 'user-1', isAnonymous: false };
    h.onDisconnectRemove.mockRejectedValueOnce(new Error('network unreachable'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      setMyPresence({ newRoom: 'abcd', oldRoom: null, newDisplayName: 'Alex' })
    ).rejects.toThrow('network unreachable');

    consoleErrorSpy.mockRestore();
  });
});

describe('updatePresenceHeartbeat', () => {
  it('is a no-op when no user is authenticated', async () => {
    const { updatePresenceHeartbeat } = await import('../roomPresence');
    h.auth.currentUser = null;

    await updatePresenceHeartbeat();

    expect(h.get).not.toHaveBeenCalled();
  });

  it('is a no-op when the presence record does not exist', async () => {
    const { updatePresenceHeartbeat } = await import('../roomPresence');
    h.auth.currentUser = { uid: 'user-1', isAnonymous: false };
    h.get.mockResolvedValueOnce({ exists: () => false, val: () => null });

    await updatePresenceHeartbeat();

    expect(h.set).not.toHaveBeenCalled();
  });

  it('gets the current record then sets it back with a refreshed lastSeen', async () => {
    const { updatePresenceHeartbeat } = await import('../roomPresence');
    h.auth.currentUser = { uid: 'user-1', isAnonymous: false };
    h.get.mockResolvedValueOnce({
      exists: () => true,
      val: () => ({ displayName: 'Alex', room: 'ABCD', isAnonymous: false, lastSeen: 1 }),
    });

    await updatePresenceHeartbeat();

    expect(h.set).toHaveBeenCalledWith(
      { path: 'users/user-1' },
      expect.objectContaining({ displayName: 'Alex', room: 'ABCD', lastSeen: expect.any(Number) })
    );
  });
});

describe('removeMyPresence', () => {
  it('is a no-op when no user is authenticated', async () => {
    const { removeMyPresence } = await import('../roomPresence');
    h.auth.currentUser = null;

    await removeMyPresence();

    expect(h.remove).not.toHaveBeenCalled();
  });

  it('removes users/{uid}', async () => {
    const { removeMyPresence } = await import('../roomPresence');
    h.auth.currentUser = { uid: 'user-1', isAnonymous: false };

    await removeMyPresence();

    expect(h.remove).toHaveBeenCalledWith({ path: 'users/user-1' });
  });

  it('swallows errors', async () => {
    const { removeMyPresence } = await import('../roomPresence');
    h.auth.currentUser = { uid: 'user-1', isAnonymous: false };
    h.remove.mockRejectedValueOnce(new Error('boom'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(removeMyPresence()).resolves.toBeUndefined();

    consoleErrorSpy.mockRestore();
  });
});

describe('startPresenceHeartbeat', () => {
  it('fires an initial heartbeat immediately, then every 60s, and stops on cleanup', async () => {
    const { startPresenceHeartbeat } = await import('../roomPresence');
    h.auth.currentUser = { uid: 'user-1', isAnonymous: false };
    h.get.mockResolvedValue({
      exists: () => true,
      val: () => ({ displayName: 'Alex', room: 'ABCD', isAnonymous: false }),
    });

    const stop = startPresenceHeartbeat();

    await vi.advanceTimersByTimeAsync(0);
    expect(h.get).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(60000);
    expect(h.get).toHaveBeenCalledTimes(2);

    stop();

    await vi.advanceTimersByTimeAsync(60000);
    expect(h.get).toHaveBeenCalledTimes(2);
  });
});

describe('getUserList', () => {
  it('returns a cleanup function that invokes the underlying RTDB unsubscribe', async () => {
    const { getUserList } = await import('../roomPresence');
    const cleanup = getUserList('ul-unsub', vi.fn());

    expect(typeof cleanup).toBe('function');
    expect(h.onValue).toHaveBeenCalledTimes(1);

    cleanup?.();
    expect(rtdbUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('filters a multi-room snapshot down to the requested room and shapes each user', async () => {
    const { getUserList } = await import('../roomPresence');
    const callback = vi.fn();
    getUserList('ul-filter', callback);

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
    const { getUserList } = await import('../roomPresence');
    const callback = vi.fn();
    getUserList('ul-null', callback);

    rtdbCallback?.({ val: () => null });

    expect(callback).toHaveBeenCalledWith({});
  });

  it('returns undefined and never subscribes for a falsy roomId', async () => {
    const { getUserList } = await import('../roomPresence');
    const callback = vi.fn();

    expect(getUserList(null, callback)).toBeUndefined();
    expect(getUserList(undefined, callback)).toBeUndefined();
    expect(getUserList('', callback)).toBeUndefined();

    expect(h.onValue).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
  });

  // Inverted: the old firebase.ts#getUserList took a 3rd `existingData` param
  // and suppressed the callback when Object.keys(newData).sort().join(',')
  // matched Object.keys(existingData).sort().join(','). That comparison is
  // gone -- there is no 3rd parameter at all, and every snapshot is delivered,
  // including a repeat of the exact same key set (the case that used to be
  // suppressed and, worse, stayed suppressed for the rest of a session after
  // any provider remount left a stale non-empty baseline in place).
  it('delivers every snapshot to the caller, including a repeat of the same key set', async () => {
    const { getUserList } = await import('../roomPresence');
    const callback = vi.fn();
    getUserList('ul-repeat', callback);

    const snapshot = {
      val: () => ({ alice: { room: 'UL-REPEAT', displayName: 'Alice', isAnonymous: false } }),
    };

    rtdbCallback?.(snapshot);
    rtdbCallback?.(snapshot);
    rtdbCallback?.(snapshot);

    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('delivers an empty roster when the room empties, even though the global users node is still populated', async () => {
    const { getUserList } = await import('../roomPresence');
    const callback = vi.fn();
    getUserList('ul-emptied', callback);

    rtdbCallback?.({
      val: () => ({ alice: { room: 'OTHER-ROOM', displayName: 'Alice', isAnonymous: false } }),
    });

    expect(callback).toHaveBeenCalledWith({});
  });

  it('only takes (roomId, callback) -- no baseline parameter exists on the signature', async () => {
    const roomPresence = await import('../roomPresence');
    expect(roomPresence.getUserList.length).toBe(2);
  });
});
