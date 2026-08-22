import { create } from 'zustand';
import { getDatabase, onValue, ref } from 'firebase/database';
import { PRESENCE_STALE_MS, liveParticipantCount } from '@/services/callRoster';

/**
 * How often the count is re-derived from the last snapshot. `onValue` only fires
 * when the node changes, but staleness is judged against the clock — without a
 * tick, a participant whose client died would stay advertised until somebody
 * else joined or left.
 */
export const PRESENCE_RECOUNT_INTERVAL_MS = 30_000;

export interface CallPresenceState {
  /** Live participants in the call, including yourself once you hold a slot. */
  count: number;
  /** Whether the first snapshot has arrived. Zero is a real answer. */
  loaded: boolean;
  /** The room currently being observed, or null. */
  roomId: string | null;
  /**
   * Start watching a room's call roster. Read-only: no presence slot is claimed
   * and no camera is opened, which is the whole point — the count has to be
   * visible to people who have not joined, and on desktop opening the panel is
   * itself joining.
   */
  subscribe: (roomId: string) => void;
  unsubscribe: () => void;
}

/**
 * Passive view of who is on a room's video call.
 *
 * Deliberately separate from `videoCallStore`: that store owns media capture,
 * peer retries and the mesh cap, and none of that should be entangled with a
 * badge. This one only ever reads.
 */
export const useCallPresenceStore = create<CallPresenceState>((set, get) => {
  let detach: (() => void) | null = null;
  let recount: ReturnType<typeof setInterval> | null = null;
  /** Last snapshot, kept so the timer can re-judge freshness without a re-read. */
  let lastSnapshot: unknown = null;

  /** Publish a count, but only when it actually moved — see the timer's comment. */
  const applyCount = (next: number): void => {
    const { count, loaded } = get();
    if (count === next && loaded) return;
    set({ count: next, loaded: true });
  };

  const teardown = (): void => {
    detach?.();
    detach = null;
    if (recount !== null) clearInterval(recount);
    recount = null;
    lastSnapshot = null;
  };

  return {
    count: 0,
    loaded: false,
    roomId: null,

    subscribe: (roomId: string) => {
      if (get().roomId === roomId && detach) return;

      teardown();
      set({ count: 0, loaded: false, roomId });

      const usersRef = ref(getDatabase(), `video-calls/${roomId}/users`);

      detach = onValue(usersRef, (snapshot) => {
        // A snapshot can land after teardown; `detach` is the generation marker.
        if (!detach) return;
        lastSnapshot = snapshot.val();
        applyCount(liveParticipantCount(lastSnapshot));
      });

      recount = setInterval(() => {
        if (!detach) return;
        applyCount(liveParticipantCount(lastSnapshot));
      }, PRESENCE_RECOUNT_INTERVAL_MS);
    },

    unsubscribe: () => {
      teardown();
      set({ count: 0, loaded: false, roomId: null });
    },
  };
});

/** Re-exported so callers reason about one freshness window, not two. */
export { PRESENCE_STALE_MS };
