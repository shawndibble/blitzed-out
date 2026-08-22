import { onValue, ref } from 'firebase/database';
import { getRealtimeDb } from '@/services/firebase/app';
import { logger } from '@/utils/logger';

/**
 * Watch a room's video-call roster without joining it.
 *
 * Read-only on purpose: the participant badge has to show a number to people who
 * have not joined, and on desktop opening the call panel *is* joining. Claiming a
 * slot here would turn merely entering a room into joining the call.
 *
 * Owns the RTDB call so the store above it holds nothing but state — same split as
 * `roomPresence.getUserList`. Returns the unsubscribe function, or undefined when
 * there is nothing to watch.
 */
export function subscribeToCallRoster(
  roomId: string | null | undefined,
  callback: (users: unknown) => void
): (() => void) | undefined {
  if (!roomId) return undefined;

  // `ref()` throws synchronously on `.`, `#`, `$`, `[` and `]`, and the room id is
  // a raw URL segment that nothing validates — the catch-all route hands us
  // `robots.txt` and any shared link with a stray dot. This runs on room entry for
  // every user, so an unguarded throw would take the whole room down.
  let usersRef;
  try {
    usersRef = ref(getRealtimeDb(), `video-calls/${roomId}/users`);
  } catch (error) {
    logger.warn('[callpresence] Not a usable room id', roomId, error);
    return undefined;
  }

  return onValue(
    usersRef,
    (snapshot) => callback(snapshot.val()),
    (error) => {
      // Leaves the last known count in place rather than reporting a confident
      // zero, which is what an unhandled read failure would otherwise look like.
      logger.warn('[callpresence] Could not read the call roster', error);
    }
  );
}
