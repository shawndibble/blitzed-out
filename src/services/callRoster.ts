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
 * The roster cannot be taken at face value. Ghosts accumulate whenever a client
 * dies without its socket closing, and a room only needs four of them to consume
 * every mesh slot and lock real participants out entirely — observed in `/PUBLIC`
 * with nine dead entries. Server-side pruning is a backstop that runs every five
 * minutes at best; this makes the client immune in the meantime.
 *
 * Sorting matters as much as filtering: when more participants are present than
 * MAX_PEERS allows, the slots should go to whoever is most likely still there.
 *
 * `staleMs` is a parameter because the badge judges freshness far more tightly
 * than dialling does — same rule, different tolerance.
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
 * How many people the badge should report: every live participant, including
 * yourself once you hold a slot. Camera state is ignored — someone listening
 * with their camera off is still in the call, and counting only `cam: 'on'`
 * would make the number twitch every time a peer backgrounds their tab.
 */
export function liveParticipantCount(users: unknown, now: number = Date.now()): number {
  return liveRoster(users, now, PRESENCE_STALE_MS).length;
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
