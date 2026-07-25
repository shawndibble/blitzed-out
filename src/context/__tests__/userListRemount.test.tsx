/**
 * Integration reproduction of the "real trigger" the presence-merge critical
 * finding named: src/components/RouterSetup/index.tsx mounts a fresh
 * UserListProvider per route (/:id, /:id/settings, /:id/cast), so navigating
 * within the SAME room (e.g. MenuDrawer -> /{ROOM}/settings) unmounts one
 * provider and mounts a new one while the Zustand userListStore -- a
 * module-level singleton -- still holds the previous roster.
 *
 * Unlike src/context/__tests__/userList.test.tsx (which mocks
 * @/services/roomPresence entirely), this file uses the REAL roomPresence
 * module and the REAL userListStore, mocking only the underlying
 * firebase/database + firebase/auth SDK calls -- so a regression in either
 * roomPresence.ts's suppression logic OR userList.tsx's call site would show
 * up here even if each file's own unit tests stayed green in isolation.
 */
import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UserListProvider } from '../userList';
import { useUserListStore } from '@/stores/userListStore';

const h = vi.hoisted(() => ({
  onValue: vi.fn(),
  auth: { currentUser: null as { uid: string; isAnonymous: boolean } | null },
}));

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn((_db: unknown, path: string) => ({ path })),
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
  onValue: h.onValue,
  onDisconnect: vi.fn(() => ({ remove: vi.fn() })),
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

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'REMOUNT_ROOM' }),
}));

type RtdbSnapshot = { val: () => unknown };
let latestRtdbCallback: ((snap: RtdbSnapshot) => void) | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  latestRtdbCallback = undefined;

  h.onValue.mockImplementation((_ref: unknown, onNext: (snap: RtdbSnapshot) => void) => {
    latestRtdbCallback = onNext;
    return vi.fn();
  });

  // Reset the real store to a clean slate before seeding per-test state --
  // it's a module singleton and would otherwise leak between tests/files.
  useUserListStore.setState({ onlineUsers: {}, room: null });
});

afterEach(() => {
  useUserListStore.setState({ onlineUsers: {}, room: null });
});

describe('UserListProvider remount into the same room', () => {
  it('delivers a lastSeen-only snapshot after remount, even though the store already holds a matching roster', async () => {
    // Seed the store as if a prior UserListProvider instance (e.g. the /:id
    // route) already delivered this exact roster.
    useUserListStore.setState({
      onlineUsers: {
        alice: {
          displayName: 'Alice',
          uid: 'alice',
          lastSeen: new Date(1_000),
          isAnonymous: false,
        },
      },
    });

    // Mount #1 (e.g. the /:id route's provider), then unmount it -- this is
    // the navigation away from the room's main view.
    const { unmount } = render(<UserListProvider>{null}</UserListProvider>);
    await waitFor(() => expect(h.onValue).toHaveBeenCalledTimes(1));
    unmount();

    // Mount #2 (e.g. MenuDrawer navigating to /{ROOM}/settings) -- same room,
    // fresh provider instance, fresh RTDB subscription.
    render(<UserListProvider>{null}</UserListProvider>);
    await waitFor(() => expect(h.onValue).toHaveBeenCalledTimes(2));

    // Same key set as the stale roster already in the store, but lastSeen
    // has moved on -- this is the exact shape that used to get silently
    // evicted: identical keys compared against a frozen baseline built from
    // the pre-remount store snapshot.
    act(() => {
      latestRtdbCallback?.({
        val: () => ({
          alice: {
            room: 'REMOUNT_ROOM',
            displayName: 'Alice',
            isAnonymous: false,
            lastSeen: 2_000,
          },
        }),
      });
    });

    await waitFor(() => {
      expect(useUserListStore.getState().onlineUsers.alice?.lastSeen.getTime()).toBe(2_000);
    });
  });

  it('delivers an identical-roster snapshot after remount (no new-user, no value change)', async () => {
    useUserListStore.setState({
      onlineUsers: {
        alice: {
          displayName: 'Alice',
          uid: 'alice',
          lastSeen: new Date(1_000),
          isAnonymous: false,
        },
      },
    });

    const { unmount } = render(<UserListProvider>{null}</UserListProvider>);
    await waitFor(() => expect(h.onValue).toHaveBeenCalledTimes(1));
    unmount();

    render(<UserListProvider>{null}</UserListProvider>);
    await waitFor(() => expect(h.onValue).toHaveBeenCalledTimes(2));

    // Reference identity, not a spy: the component captures its store
    // actions into a ref during mount, before any test-installed spy could
    // intercept the call, so a spy on the store slot would silently miss the
    // real call path. handleUserUpdate always builds a brand-new validated
    // user object from the snapshot, so a genuinely-delivered callback swaps
    // the object reference even when its contents are byte-identical to
    // what's already in the store; a suppressed callback leaves the
    // pre-seeded reference untouched.
    const beforeRef = useUserListStore.getState().onlineUsers.alice;
    expect(beforeRef).toBeDefined();

    act(() => {
      latestRtdbCallback?.({
        val: () => ({
          alice: {
            room: 'REMOUNT_ROOM',
            displayName: 'Alice',
            isAnonymous: false,
            lastSeen: 1_000,
          },
        }),
      });
    });

    await waitFor(() => {
      expect(useUserListStore.getState().onlineUsers.alice).not.toBe(beforeRef);
    });
  });
});
