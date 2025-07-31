import { get, getDatabase, onDisconnect, onValue, ref, remove, set } from 'firebase/database';

import { getAuth } from 'firebase/auth';

// ========================
// USER PRESENCE SYSTEM
// ========================
// This module manages user presence in rooms with automatic server-side cleanup
// Works with Firebase Cloud Functions to clean up stale users after 20 minutes

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
 * Set user presence in a room with automatic cleanup and server timestamp
 * Works with the server-side cleanup function to manage stale users
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
    console.warn('Cannot set presence: user not authenticated');
    return;
  }

  const realtimeDb = getDatabase();

  try {
    // Remove from old room if different
    if (oldRoom && oldRoom !== newRoom && oldRoom.toUpperCase() !== newRoom.toUpperCase()) {
      const oldUserRef = ref(realtimeDb, `users/${user.uid}`);
      await remove(oldUserRef);
    }

    // Set presence in new room with server timestamp for cleanup
    const userRef = ref(realtimeDb, `users/${user.uid}`);
    const presenceData: UserPresenceData = {
      displayName: newDisplayName || 'Unknown',
      isAnonymous: user.isAnonymous,
      room: newRoom.toUpperCase(),
      joinedAt: Date.now(),
      lastSeen: Date.now(), // This will be managed by server timestamp
    };

    await set(userRef, presenceData);

    // Set up automatic removal on disconnect
    if (removeOnDisconnect) {
      onDisconnect(userRef).remove();
    }
  } catch (error) {
    console.error('Error setting user presence:', error);
  }
}

/**
 * Update user's lastSeen timestamp to keep them active
 * Called periodically to prevent server-side cleanup (every 60 seconds)
 * Server cleanup removes users inactive for 20+ minutes
 */
export async function updatePresenceHeartbeat(): Promise<void> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    return;
  }

  const realtimeDb = getDatabase();
  const userRef = ref(realtimeDb, `users/${user.uid}`);

  try {
    // Get current user data first to preserve all required fields
    const currentUserRef = ref(realtimeDb, `users/${user.uid}`);
    const snapshot = await get(currentUserRef);

    if (snapshot.exists()) {
      const currentData = snapshot.val();
      // Update the entire user object with new lastSeen timestamp
      // This satisfies the validation rule that requires all children
      const updatedData = {
        ...currentData,
        lastSeen: Date.now(),
      };
      await set(userRef, updatedData);
    } else {
      // If no existing data, skip the heartbeat update
      // This prevents errors when user data doesn't exist yet
      console.warn('No existing user data found, skipping heartbeat update');
    }
  } catch (error) {
    console.error('Error updating presence heartbeat:', error);
  }
}

/**
 * Remove user from presence system
 */
export async function removeMyPresence(): Promise<void> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    return;
  }

  const realtimeDb = getDatabase();
  const userRef = ref(realtimeDb, `users/${user.uid}`);

  try {
    await remove(userRef);
    console.log('User presence removed');
  } catch (error) {
    console.error('Error removing user presence:', error);
  }
}

/**
 * Get all users in a specific room
 */
export function getUsersInRoom(
  roomId: string,
  callback: (
    users: Array<{
      uid: string;
      displayName: string;
      isAnonymous: boolean;
      joinedAt?: number;
      lastSeen?: number;
    }>
  ) => void
): () => void {
  const realtimeDb = getDatabase();
  const usersRef = ref(realtimeDb, 'users');

  const unsubscribe = onValue(usersRef, (snapshot) => {
    const users: Array<{
      uid: string;
      displayName: string;
      isAnonymous: boolean;
      joinedAt?: number;
      lastSeen?: number;
    }> = [];

    if (snapshot.exists()) {
      const usersData = snapshot.val();
      Object.entries(usersData).forEach(([uid, userData]: [string, any]) => {
        if (userData.room === roomId.toUpperCase()) {
          users.push({
            uid,
            displayName: userData.displayName,
            isAnonymous: userData.isAnonymous,
            joinedAt: userData.joinedAt,
            lastSeen: userData.lastSeen,
          });
        }
      });
    }

    callback(users);
  });

  return unsubscribe;
}

/**
 * Get total count of online users across all rooms
 */
export function getOnlineUserCount(callback: (count: number) => void): () => void {
  const realtimeDb = getDatabase();
  const usersRef = ref(realtimeDb, 'users');

  const unsubscribe = onValue(usersRef, (snapshot) => {
    const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    callback(count);
  });

  return unsubscribe;
}

/**
 * Get all online users with their room information
 */
export function getAllOnlineUsers(
  callback: (
    users: Array<{
      uid: string;
      displayName: string;
      isAnonymous: boolean;
      room: string;
      joinedAt?: number;
      lastSeen?: number;
    }>
  ) => void
): () => void {
  const realtimeDb = getDatabase();
  const usersRef = ref(realtimeDb, 'users');

  const unsubscribe = onValue(usersRef, (snapshot) => {
    const users: Array<{
      uid: string;
      displayName: string;
      isAnonymous: boolean;
      room: string;
      joinedAt?: number;
      lastSeen?: number;
    }> = [];

    if (snapshot.exists()) {
      const usersData = snapshot.val();
      Object.entries(usersData).forEach(([uid, userData]: [string, any]) => {
        users.push({
          uid,
          displayName: userData.displayName,
          isAnonymous: userData.isAnonymous,
          room: userData.room,
          joinedAt: userData.joinedAt,
          lastSeen: userData.lastSeen,
        });
      });
    }

    callback(users);
  });

  return unsubscribe;
}

/**
 * Start a presence heartbeat interval that updates every minute
 * Returns a cleanup function to stop the heartbeat
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
 * Enhanced presence hook that manages heartbeat and cleanup automatically
 * Call this when a user enters a room to start presence management
 */
export function initializePresenceForRoom(
  roomId: string,
  displayName: string,
  removeOnDisconnect: boolean = true
): () => void {
  // Set initial presence
  setMyPresence({
    newRoom: roomId,
    oldRoom: null,
    newDisplayName: displayName,
    removeOnDisconnect,
  });

  // Start heartbeat
  const stopHeartbeat = startPresenceHeartbeat();

  // Set up cleanup on page unload
  const handleBeforeUnload = () => {
    removeMyPresence();
  };
  window.addEventListener('beforeunload', handleBeforeUnload);

  // Return comprehensive cleanup function
  return () => {
    stopHeartbeat();
    window.removeEventListener('beforeunload', handleBeforeUnload);
    removeMyPresence();
  };
}
