import { MediaState, parseMediaState } from '@/types/videoCall';

/**
 * A roster entry older than this is treated as a ghost and never dialled. Well
 * clear of the 30s heartbeat so a throttled background tab is not mistaken for
 * one, and matches the server-side prune threshold.
 */
export const ROSTER_STALE_MS = 10 * 60 * 1000;

/**
 * The window the participant badge counts by — four missed heartbeats rather
 * than twenty. Dialling can afford to be conservative because a ghost only
 * costs a mesh slot; a badge is a number people act on, so being wrong for ten
 * minutes after a crash would send them into an empty call.
 */
export const PRESENCE_STALE_MS = 2 * 60 * 1000;

/**
 * Reduce a presence snapshot to participants worth dialling, freshest first.
 *
 * Ghosts accumulate whenever a client dies without its socket closing, and four of
 * them consume every mesh slot — `/PUBLIC` was found holding nine. Server-side
 * pruning is a five-minute backstop; this makes the client immune meanwhile.
 * Sorting matters as much as filtering: over MAX_PEERS, slots should go to whoever
 * is most likely still there. `staleMs` is a parameter because the badge judges
 * freshness far more tightly than dialling — same rule, different tolerance.
 */
export function liveRoster(
  users: unknown,
  now: number = Date.now(),
  staleMs: number = ROSTER_STALE_MS
): string[] {
  if (!users || typeof users !== 'object') return [];

  return Object.entries(users as Record<string, { lastSeen?: unknown; joinedAt?: unknown }>)
    .map(([userId, presence]) => {
      const seen = presence?.lastSeen ?? presence?.joinedAt;
      // No usable timestamp means a presence node we cannot reason about; treat
      // it as expired rather than letting it hold a slot forever.
      return { userId, seen: typeof seen === 'number' ? seen : 0 };
    })
    .filter(({ seen }) => now - seen < staleMs)
    .sort((a, b) => b.seen - a.seen)
    .map(({ userId }) => userId);
}

/**
 * How many people are in the call, including yourself once you hold a slot. Camera
 * state is ignored — someone listening with their camera off is still there, and
 * counting only `cam: 'on'` would make the number twitch every time a peer
 * backgrounds their tab.
 */
export function liveParticipantCount(
  users: unknown,
  now: number = Date.now(),
  staleMs: number = PRESENCE_STALE_MS
): number {
  return liveRoster(users, now, staleMs).length;
}

/**
 * Read every roster entry's published media flags. Rebuilt per snapshot rather than
 * merged, so a participant who leaves takes their last known state with them.
 */
export function rosterMediaStates(users: unknown): Map<string, MediaState> {
  const states = new Map<string, MediaState>();
  if (!users || typeof users !== 'object') return states;

  for (const [userId, entry] of Object.entries(users as Record<string, unknown>)) {
    states.set(userId, parseMediaState(entry));
  }
  return states;
}
