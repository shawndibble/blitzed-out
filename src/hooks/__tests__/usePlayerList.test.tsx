import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import usePlayerList from '@/hooks/usePlayerList';

const BASE = 1_700_000_000_000;
const MIN = 60_000;

const h = vi.hoisted(() => ({
  onlineUsers: {} as Record<string, unknown>,
  user: { uid: 'self', displayName: 'Me' } as { uid: string; displayName: string } | null,
  room: 'PUBLIC' as string | undefined,
}));

vi.mock('@/stores/userListStore', () => ({
  useUserListStore: () => ({ onlineUsers: h.onlineUsers }),
}));
vi.mock('@/context/hooks/useAuth', () => ({ default: () => ({ user: h.user }) }));
vi.mock('@/context/hooks/useMessages', () => ({
  default: () => ({ messages: [], isLoading: false }),
}));
vi.mock('react-router-dom', () => ({ useParams: () => ({ id: h.room }) }));

function user(uid: string, lastSeenMs: number) {
  return { uid, displayName: uid, lastSeen: new Date(lastSeenMs) };
}

const uids = (result: { current: Array<{ uid: string }> }) =>
  result.current.map((p) => p.uid).sort();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(BASE);
  h.user = { uid: 'self', displayName: 'Me' };
  h.onlineUsers = {};
  h.room = 'PUBLIC';
});

afterEach(() => {
  vi.useRealTimers();
});

describe('usePlayerList presence filtering', () => {
  it('drops a 4-min-stale player in a PUBLIC room (3-min window)', () => {
    h.room = 'PUBLIC';
    h.onlineUsers = {
      self: user('self', BASE),
      a: user('a', BASE - MIN),
      b: user('b', BASE - 4 * MIN),
    };
    const { result } = renderHook(() => usePlayerList());
    expect(uids(result)).toEqual(['a', 'self']);
  });

  it('keeps the same 4-min-stale player in a PRIVATE room (5-min window)', () => {
    h.room = 'ABCDE';
    h.onlineUsers = {
      self: user('self', BASE),
      a: user('a', BASE - MIN),
      b: user('b', BASE - 4 * MIN),
    };
    const { result } = renderHook(() => usePlayerList());
    expect(uids(result)).toEqual(['a', 'b', 'self']);
  });

  it('keeps self even when self is stale', () => {
    h.room = 'PUBLIC';
    h.onlineUsers = { self: user('self', BASE - 10 * MIN) };
    const { result } = renderHook(() => usePlayerList());
    expect(uids(result)).toEqual(['self']);
  });

  it('drops a player on the 30s tick once their heartbeat crosses the window', () => {
    h.room = 'PUBLIC';
    // c is 10s shy of the 3-min public window at BASE -> present; +30s tick -> stale.
    h.onlineUsers = {
      self: user('self', BASE),
      c: user('c', BASE - (3 * MIN - 10_000)),
    };
    const { result } = renderHook(() => usePlayerList());
    expect(uids(result)).toEqual(['c', 'self']);

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(uids(result)).toEqual(['self']);
  });
});
