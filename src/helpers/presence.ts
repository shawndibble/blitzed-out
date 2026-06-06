import { isPublicRoom } from '@/helpers/strings';

/**
 * Client-side presence staleness windows.
 *
 * Presence is kept fresh by a 60s heartbeat that writes `lastSeen` while the
 * tab is alive — independent of user interaction. So a player who is idle but
 * still has a live tab (looking at another tab, phone in hand between turns)
 * keeps heartbeating and stays present; only a dead tab (closed/crashed/killed
 * without firing `onDisconnect`) goes stale.
 *
 * Public rooms favour a live, realtime roster (shorter window). Private rooms
 * are manually joined and turn-based, so we keep players around longer through
 * brief absences.
 */
export const PUBLIC_PRESENCE_TIMEOUT_MS = 3 * 60 * 1000;
export const PRIVATE_PRESENCE_TIMEOUT_MS = 5 * 60 * 1000;

export function presenceTimeoutForRoom(room?: string): number {
  return isPublicRoom(room) ? PUBLIC_PRESENCE_TIMEOUT_MS : PRIVATE_PRESENCE_TIMEOUT_MS;
}

/**
 * A user is considered present if their last heartbeat is within `timeoutMs`.
 * Missing/invalid `lastSeen` is treated as not present.
 */
export function isUserPresent(
  lastSeen: Date | number | null | undefined,
  now: number,
  timeoutMs: number
): boolean {
  if (lastSeen == null) return false;
  const ts = lastSeen instanceof Date ? lastSeen.getTime() : lastSeen;
  if (!Number.isFinite(ts)) return false;
  return now - ts <= timeoutMs;
}
