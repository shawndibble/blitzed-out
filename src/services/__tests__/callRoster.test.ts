import { describe, expect, test } from 'vitest';
import {
  PRESENCE_STALE_MS,
  ROSTER_STALE_MS,
  liveParticipantCount,
  liveRoster,
  rosterMediaStates,
} from '../callRoster';

// Observed in production: /PUBLIC held nine dead roster entries, and four is
// enough to consume every mesh slot and lock real participants out entirely.
describe('liveRoster', () => {
  const FRESH = { lastSeen: 1_000_000 };

  test('drops entries older than the stale threshold', () => {
    const roster = liveRoster(
      { alive: FRESH, ghost: { lastSeen: 1_000_000 - ROSTER_STALE_MS - 1 } },
      1_000_000
    );

    expect(roster).toEqual(['alive']);
  });

  // These are the entries that survive forever: nothing can age out a
  // timestamp that was never written.
  test('drops entries with no usable timestamp', () => {
    const roster = liveRoster({ alive: FRESH, ghost: { status: 'online' } }, 1_000_000);

    expect(roster).toEqual(['alive']);
  });

  test('falls back to joinedAt for clients that predate the heartbeat', () => {
    const roster = liveRoster({ old: { joinedAt: 999_000 } }, 1_000_000);

    expect(roster).toEqual(['old']);
  });

  // When more participants are present than MAX_PEERS allows, slots should go
  // to whoever is most likely still there.
  test('orders the freshest participants first', () => {
    const roster = liveRoster(
      {
        stale: { lastSeen: 900_000 },
        freshest: { lastSeen: 999_999 },
        mid: { lastSeen: 950_000 },
      },
      1_000_000
    );

    expect(roster).toEqual(['freshest', 'mid', 'stale']);
  });

  test('handles a missing or malformed snapshot', () => {
    expect(liveRoster(null)).toEqual([]);
    expect(liveRoster('nonsense')).toEqual([]);
  });

  test('honours a caller-supplied window', () => {
    const roster = liveRoster({ recent: { lastSeen: 999_000 } }, 1_000_000, 500);

    expect(roster).toEqual([]);
  });
});

describe('liveParticipantCount', () => {
  // The whole reason the badge has its own window: a crashed client stays
  // dialable for ten minutes, but must stop being advertised long before that.
  test('drops a participant the dialling window would still keep', () => {
    const users = {
      here: { lastSeen: 1_000_000 },
      crashed: { lastSeen: 1_000_000 - PRESENCE_STALE_MS - 1 },
    };

    expect(liveRoster(users, 1_000_000)).toHaveLength(2);
    expect(liveParticipantCount(users, 1_000_000)).toBe(1);
  });

  test('counts yourself along with everyone else', () => {
    const count = liveParticipantCount(
      { self: { lastSeen: 1_000_000 }, other: { lastSeen: 1_000_000 } },
      1_000_000
    );

    expect(count).toBe(2);
  });

  // Camera state must not move the number, or backgrounding a tab looks like
  // someone leaving.
  test('counts participants whose camera is off or absent', () => {
    const count = liveParticipantCount(
      {
        watching: { lastSeen: 1_000_000, cam: 'off' },
        noHardware: { lastSeen: 1_000_000, cam: 'none' },
        backgrounded: { lastSeen: 1_000_000, cam: 'hidden' },
      },
      1_000_000
    );

    expect(count).toBe(3);
  });

  test('is zero for an empty or malformed snapshot', () => {
    expect(liveParticipantCount(null)).toBe(0);
    expect(liveParticipantCount({}, 1_000_000)).toBe(0);
  });
});

describe('rosterMediaStates', () => {
  test('reads published flags per participant', () => {
    const states = rosterMediaStates({
      a: { cam: 'on', mic: 'off' },
      b: { cam: 'hidden' },
    });

    expect(states.get('a')).toEqual({ cam: 'on', mic: 'off' });
    expect(states.get('b')).toEqual({ cam: 'hidden' });
  });

  test('handles a missing snapshot', () => {
    expect(rosterMediaStates(null).size).toBe(0);
  });
});
