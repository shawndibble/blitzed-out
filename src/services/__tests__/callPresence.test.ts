import { beforeEach, describe, expect, test, vi } from 'vitest';
import { subscribeToCallRoster } from '../callPresence';

const harness = vi.hoisted(() => ({
  paths: [] as string[],
  /** Room-id characters RTDB rejects; `ref()` throws on them synchronously. */
  invalid: /[.#$[\]]/,
  onValueArgs: [] as unknown[][],
}));

vi.mock('@/services/firebase/app', () => ({
  getRealtimeDb: vi.fn(() => ({})),
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn((_db: unknown, path: string) => {
    if (harness.invalid.test(path.replace('video-calls/', '').replace('/users', ''))) {
      throw new Error(`path argument was an invalid path = "${path}"`);
    }
    harness.paths.push(path);
    return { path };
  }),
  onValue: vi.fn((...args: unknown[]) => {
    harness.onValueArgs.push(args);
    return vi.fn();
  }),
}));

describe('subscribeToCallRoster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    harness.paths.length = 0;
    harness.onValueArgs.length = 0;
  });

  test('reads the call roster, not room membership', () => {
    subscribeToCallRoster('PUBLIC', vi.fn());

    expect(harness.paths).toEqual(['video-calls/PUBLIC/users']);
  });

  test('hands each snapshot to the caller unwrapped', () => {
    const callback = vi.fn();
    subscribeToCallRoster('PUBLIC', callback);

    const onSnapshot = harness.onValueArgs[0][1] as (s: { val: () => unknown }) => void;
    onSnapshot({ val: () => ({ a: 1 }) });

    expect(callback).toHaveBeenCalledWith({ a: 1 });
  });

  test('returns the unsubscribe function', () => {
    expect(typeof subscribeToCallRoster('PUBLIC', vi.fn())).toBe('function');
  });

  test('watches nothing without a room', () => {
    expect(subscribeToCallRoster('', vi.fn())).toBeUndefined();
    expect(subscribeToCallRoster(null, vi.fn())).toBeUndefined();
    expect(harness.onValueArgs).toHaveLength(0);
  });

  // The room id is a raw URL segment off a catch-all route, and `ref()` throws
  // synchronously on `.`, `#`, `$`, `[` and `]`. This runs on room entry for every
  // user, so an unguarded throw takes the whole room down rather than one feature.
  test.each(['robots.txt', 'A#B', 'A$B', 'A[B]'])('survives the unusable id %s', (roomId) => {
    expect(() => subscribeToCallRoster(roomId, vi.fn())).not.toThrow();
    expect(subscribeToCallRoster(roomId, vi.fn())).toBeUndefined();
  });

  // Without one, a permission-denied or offline read is swallowed and the caller
  // is left to report a confident zero.
  test('passes an error handler to onValue', () => {
    subscribeToCallRoster('PUBLIC', vi.fn());

    expect(typeof harness.onValueArgs[0][2]).toBe('function');
  });
});
