import { describe, expect, it } from 'vitest';
import {
  PRIVATE_PRESENCE_TIMEOUT_MS,
  PUBLIC_PRESENCE_TIMEOUT_MS,
  isUserPresent,
  presenceTimeoutForRoom,
} from '@/helpers/presence';

describe('presenceTimeoutForRoom', () => {
  it('uses the public window for PUBLIC (any case)', () => {
    expect(presenceTimeoutForRoom('PUBLIC')).toBe(PUBLIC_PRESENCE_TIMEOUT_MS);
    expect(presenceTimeoutForRoom('public')).toBe(PUBLIC_PRESENCE_TIMEOUT_MS);
  });

  it('uses the private window for any non-public room', () => {
    expect(presenceTimeoutForRoom('ABCDE')).toBe(PRIVATE_PRESENCE_TIMEOUT_MS);
    expect(presenceTimeoutForRoom(undefined)).toBe(PRIVATE_PRESENCE_TIMEOUT_MS);
  });

  it('keeps the public window shorter than the private window', () => {
    expect(PUBLIC_PRESENCE_TIMEOUT_MS).toBeLessThan(PRIVATE_PRESENCE_TIMEOUT_MS);
  });
});

describe('isUserPresent', () => {
  const now = 1_000_000_000_000;

  it('treats a fresh heartbeat as present', () => {
    expect(isUserPresent(now - 60_000, now, PUBLIC_PRESENCE_TIMEOUT_MS)).toBe(true);
  });

  it('treats exactly-at-threshold as present (inclusive)', () => {
    expect(isUserPresent(now - PUBLIC_PRESENCE_TIMEOUT_MS, now, PUBLIC_PRESENCE_TIMEOUT_MS)).toBe(
      true
    );
  });

  it('treats past-threshold as not present', () => {
    expect(
      isUserPresent(now - PUBLIC_PRESENCE_TIMEOUT_MS - 1, now, PUBLIC_PRESENCE_TIMEOUT_MS)
    ).toBe(false);
  });

  it('accepts a Date as well as a number', () => {
    expect(isUserPresent(new Date(now - 60_000), now, PUBLIC_PRESENCE_TIMEOUT_MS)).toBe(true);
    expect(isUserPresent(new Date(now - 10 * 60_000), now, PUBLIC_PRESENCE_TIMEOUT_MS)).toBe(false);
  });

  it('a 4-minute-idle player is gone from a public room but kept in a private room', () => {
    const fourMinAgo = now - 4 * 60_000;
    expect(isUserPresent(fourMinAgo, now, PUBLIC_PRESENCE_TIMEOUT_MS)).toBe(false);
    expect(isUserPresent(fourMinAgo, now, PRIVATE_PRESENCE_TIMEOUT_MS)).toBe(true);
  });

  it('treats missing/invalid lastSeen as not present', () => {
    expect(isUserPresent(null, now, PUBLIC_PRESENCE_TIMEOUT_MS)).toBe(false);
    expect(isUserPresent(undefined, now, PUBLIC_PRESENCE_TIMEOUT_MS)).toBe(false);
    expect(isUserPresent(Number.NaN, now, PUBLIC_PRESENCE_TIMEOUT_MS)).toBe(false);
  });
});
