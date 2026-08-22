import { create } from 'zustand';
import { subscribeToCallRoster } from '@/services/callPresence';
import { PRESENCE_STALE_MS, ROSTER_STALE_MS, liveParticipantCount } from '@/services/callRoster';

/**
 * How often the counts are re-derived from the last snapshot. `onValue` only fires
 * when the node changes, but staleness is judged against the clock — without a
 * tick, a participant whose client died would stay advertised until somebody else
 * joined or left.
 */
export const PRESENCE_RECOUNT_INTERVAL_MS = 30_000;

export interface CallPresenceState {
  /** Live participants for the badge, including yourself once you hold a slot. */
  count: number;
  /**
   * The same roster counted by the window the mesh dials on. Higher than `count`
   * whenever someone's heartbeat is throttled — a backgrounded tab still holds a
   * `MAX_PEERS` slot in everyone's mesh, so the join gate has to respect it or it
   * would wave a seventh person into a call that cannot connect them.
   */
  capacityCount: number;
  /** Whether a snapshot has arrived. Zero is a real answer; unknown is not. */
  loaded: boolean;
  roomId: string | null;
  /** Start watching a room's call roster. Read-only — claims no slot. */
  watch: (roomId: string) => void;
  stopWatching: () => void;
}

/**
 * Passive view of who is on a room's video call.
 *
 * Deliberately separate from `videoCallStore`: that store owns media capture, peer
 * retries and the mesh cap, and none of that should be entangled with a badge.
 * This one only ever reads.
 */
export const useCallPresenceStore = create<CallPresenceState>((set, get) => {
  let detach: (() => void) | null = null;
  let recount: ReturnType<typeof setInterval> | null = null;
  /** Last snapshot, kept so the timer can re-judge freshness without a re-read. */
  let lastSnapshot: unknown = null;
  /**
   * Incremented on every teardown. The `onValue` callback can fire synchronously
   * during subscription — RTDB replays a cached view immediately when another
   * listener already holds one — so a marker assigned from the return value would
   * still be null on the first call, and truthy again for a stale callback after a
   * room switch. A counter captured in the closure is right in both directions.
   */
  let generation = 0;

  /** Publish counts, but only when one actually moved — see the timer's comment. */
  const applyCounts = (users: unknown): void => {
    const next = liveParticipantCount(users, Date.now(), PRESENCE_STALE_MS);
    const nextCapacity = liveParticipantCount(users, Date.now(), ROSTER_STALE_MS);
    const { count, capacityCount, loaded } = get();
    if (count === next && capacityCount === nextCapacity && loaded) return;
    set({ count: next, capacityCount: nextCapacity, loaded: true });
  };

  const teardown = (): void => {
    generation += 1;
    detach?.();
    detach = null;
    if (recount !== null) clearInterval(recount);
    recount = null;
    lastSnapshot = null;
  };

  return {
    count: 0,
    capacityCount: 0,
    loaded: false,
    roomId: null,

    watch: (roomId: string) => {
      if (get().roomId === roomId && detach) return;

      teardown();
      set({ count: 0, capacityCount: 0, loaded: false, roomId });

      const mine = generation;
      const unsubscribe = subscribeToCallRoster(roomId, (users) => {
        if (generation !== mine) return;
        lastSnapshot = users;
        applyCounts(users);
      });
      if (!unsubscribe) return;
      detach = unsubscribe;

      recount = setInterval(() => {
        // No snapshot yet means the read has not landed, not that nobody is here —
        // counting now would publish a fabricated zero as though it were known.
        if (generation !== mine || lastSnapshot === null) return;
        applyCounts(lastSnapshot);
      }, PRESENCE_RECOUNT_INTERVAL_MS);
    },

    stopWatching: () => {
      teardown();
      set({ count: 0, capacityCount: 0, loaded: false, roomId: null });
    },
  };
});
