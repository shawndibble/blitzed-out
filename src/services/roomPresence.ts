import { getRealtimeDb } from '@/services/firebase';
import { DataSnapshot, get, onDisconnect, onValue, ref, remove, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// ========================
// ROOM PRESENCE
// ========================
// Sole owner of the RTDB `users/{uid}` presence shape: this module is the
// only code that WRITES it (enter room / heartbeat / leave room) and the
// only code that READS it (subscribe to who is here). Works with the
// server-side Cloud Function that cleans up stale users after 20 minutes.

interface UserPresenceData {
  displayName: string;
  isAnonymous: boolean;
  room: string;
  joinedAt?: number;
  lastSeen?: number;
}

interface SetPresenceOptions {
  newRoom: string;
  oldRoom: string | null;
  newDisplayName: string;
  removeOnDisconnect?: boolean;
}

/**
 * Set user presence in a room with automatic cleanup and server timestamp.
 * Works with the server-side cleanup function to manage stale users.
 */
export async function setMyPresence({
  newRoom,
  oldRoom,
  newDisplayName,
  removeOnDisconnect = true,
}: SetPresenceOptions): Promise<void> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    return;
  }

  const realtimeDb = getRealtimeDb();

  try {
    // Normalize room values to handle null/undefined cases
    const normalizedOldRoom = (oldRoom || '').toUpperCase();
    const normalizedNewRoom = (newRoom || '').toUpperCase();

    if (oldRoom && normalizedOldRoom !== normalizedNewRoom) {
      const oldUserRef = ref(realtimeDb, `users/${user.uid}`);
      await remove(oldUserRef);
    }

    // Set presence in new room with server timestamp for cleanup
    const userRef = ref(realtimeDb, `users/${user.uid}`);
    const presenceData: UserPresenceData = {
      displayName: newDisplayName || 'Unknown',
      isAnonymous: user.isAnonymous,
      room: normalizedNewRoom,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
    };

    await set(userRef, presenceData);

    // Set up automatic removal on disconnect
    if (removeOnDisconnect) {
      try {
        await onDisconnect(userRef).remove();
      } catch (disconnectError) {
        // Browsers can block onDisconnect in private browsing or with strict privacy settings
        // This is a user permission issue we can't control, so handle it gracefully
        if (disconnectError instanceof Error) {
          const errorName = disconnectError.name;
          const errorMessage = disconnectError.message?.toLowerCase() || '';

          // Check for various permission denied error patterns
          const isPermissionError =
            errorName === 'NotAllowedError' ||
            errorMessage.includes('not allowed') ||
            errorMessage.includes('permission');

          if (isPermissionError) {
            // Silently handle permission denial - this is expected behavior in some browsers
            return;
          }
        }
        // Re-throw other unexpected errors
        throw disconnectError;
      }
    }
  } catch (error) {
    console.error('Error setting user presence:', error);
    throw error;
  }
}

/**
 * Update user's lastSeen timestamp to keep them active.
 * Called periodically to prevent server-side cleanup (every 60 seconds).
 * Server cleanup removes users inactive for 20+ minutes.
 */
export async function updatePresenceHeartbeat(): Promise<void> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    return;
  }

  const realtimeDb = getRealtimeDb();
  const userRef = ref(realtimeDb, `users/${user.uid}`);

  try {
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const currentData = snapshot.val();
      const updatedData = {
        ...currentData,
        lastSeen: Date.now(),
      };
      await set(userRef, updatedData);
    }
  } catch (error) {
    console.error('Error updating presence heartbeat:', error);
  }
}

/**
 * Remove user from presence system.
 */
export async function removeMyPresence(): Promise<void> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    return;
  }

  const realtimeDb = getRealtimeDb();
  const userRef = ref(realtimeDb, `users/${user.uid}`);

  try {
    await remove(userRef);
  } catch (error) {
    console.error('Error removing user presence:', error);
  }
}

/**
 * Start a presence heartbeat interval that updates every minute.
 * Returns a cleanup function to stop the heartbeat.
 */
export function startPresenceHeartbeat(): () => void {
  const heartbeatInterval = setInterval(() => {
    updatePresenceHeartbeat();
  }, 60000); // 1 minute - well under the 20-minute server cleanup threshold

  // Initial heartbeat
  updatePresenceHeartbeat();

  // Return cleanup function
  return () => {
    clearInterval(heartbeatInterval);
  };
}

/**
 * Subscribe to the presence list for a room. Returns the RTDB unsubscribe
 * function, or undefined when no room is given.
 *
 * Publishes room occupants as plain data on every snapshot -- no de-dup
 * baseline, no key-string comparison. Referential stability is the
 * consumer's concern (userListStore already handles it).
 */
export function getUserList(
  roomId: string | null | undefined,
  callback: (data: Record<string, unknown>) => void
): (() => void) | undefined {
  if (!roomId) return undefined;

  const roomUpper = roomId.toUpperCase();
  const realtimeDb = getRealtimeDb();
  const usersRef = ref(realtimeDb, 'users');

  return onValue(
    usersRef,
    (snap: DataSnapshot) => {
      const allUsers = snap.val() as Record<string, any> | null;

      const roomUsers: Record<string, unknown> = {};
      if (allUsers) {
        Object.entries(allUsers).forEach(([uid, userData]) => {
          if (userData.room === roomUpper) {
            roomUsers[uid] = {
              displayName: userData.displayName,
              uid,
              lastSeen: userData.lastSeen ? new Date(userData.lastSeen) : new Date(),
              isAnonymous: userData.isAnonymous,
              joinedAt: userData.joinedAt ? new Date(userData.joinedAt) : new Date(),
              room: userData.room,
            };
          }
        });
      }

      callback(roomUsers);
    },
    (error) => {
      console.error('getUserList error', error);
    }
  );
}
