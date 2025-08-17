import React, { useMemo, useEffect, useCallback, ReactNode, useRef } from 'react';
import { Params, useParams } from 'react-router-dom';
import { getUserList } from '@/services/firebase';
import { useUserListStore } from '@/stores/userListStore';

export interface OnlineUser {
  displayName: string;
  uid: string;
  lastSeen: Date;
  [key: string]: any;
}

// Runtime validation function for OnlineUser objects
function isValidOnlineUser(obj: unknown): obj is OnlineUser {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const user = obj as Record<string, unknown>;

  return (
    typeof user.displayName === 'string' &&
    typeof user.uid === 'string' &&
    (user.lastSeen instanceof Date ||
      typeof user.lastSeen === 'number' ||
      typeof user.lastSeen === 'string')
  );
}

export interface UserListContextType {
  onlineUsers: Record<string, OnlineUser>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const UserListContext = React.createContext<UserListContextType | undefined>(undefined);

interface UserListProviderProps {
  children: ReactNode;
  [key: string]: any;
}

function UserListProvider(props: UserListProviderProps): JSX.Element {
  const { id: room } = useParams<Params>();
  const { onlineUsers } = useUserListStore();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const prevRoomRef = useRef<string | undefined>(room);
  const onlineUsersRef = useRef(onlineUsers);

  // Keep ref updated with current onlineUsers for Firebase deduplication
  // This prevents adding onlineUsers to useEffect deps (which would cause infinite loops)
  useEffect(() => {
    onlineUsersRef.current = onlineUsers;
  }, [onlineUsers]);

  // Stable callback ref to prevent infinite useEffect loops
  // This pattern ensures Firebase callback doesn't change reference on every render
  const handleUserUpdateRef = useRef<(newUsers: Record<string, unknown> | null) => void>(() => {});

  // Get store methods - these change reference on every render in Zustand
  const { setUsers, clearUsers, setRoom, flushPendingUpdates } = useUserListStore();

  // Create stable reference to store methods to prevent infinite loops
  // Without this, useEffect would re-run every time store methods change (every render)
  const setUsersRef = useRef(setUsers);
  const clearUsersRef = useRef(clearUsers);
  const setRoomRef = useRef(setRoom);
  const flushPendingUpdatesRef = useRef(flushPendingUpdates);

  // Update refs when store methods change (but don't use in useEffect deps)
  // This keeps refs current while preventing dependency loops
  useEffect(() => {
    setUsersRef.current = setUsers;
    clearUsersRef.current = clearUsers;
    setRoomRef.current = setRoom;
    flushPendingUpdatesRef.current = flushPendingUpdates;
  }, [setUsers, clearUsers, setRoom, flushPendingUpdates]);

  // Update the callback ref when dependencies change
  useEffect(() => {
    handleUserUpdateRef.current = (newUsers: Record<string, unknown> | null) => {
      if (newUsers === null) {
        clearUsersRef.current();
      } else {
        // Validate and transform the users data
        const validatedUsers: Record<string, OnlineUser> = {};

        Object.entries(newUsers).forEach(([uid, userData]) => {
          if (isValidOnlineUser(userData)) {
            // Ensure lastSeen is a Date object
            const user: OnlineUser = {
              ...userData,
              lastSeen:
                userData.lastSeen instanceof Date
                  ? userData.lastSeen
                  : new Date(userData.lastSeen as string | number),
            };
            validatedUsers[uid] = user;
          } else {
            // Log invalid user data for debugging
            // Note: In production, consider using a proper logging service instead
            console.warn(`Invalid user data for uid ${uid}:`, userData);
          }
        });

        setUsersRef.current(validatedUsers);
      }
    };
  }, []);

  // Stable callback function that doesn't change reference
  const handleUserUpdate = useCallback((newUsers: Record<string, unknown> | null) => {
    handleUserUpdateRef.current?.(newUsers);
  }, []);

  // Cleanup function for Firebase listener
  const cleanup = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    // Flush any pending updates before cleanup
    flushPendingUpdatesRef.current();
  }, []);

  // Main effect: manages Firebase listener lifecycle
  // Only depends on room and stable callbacks (NOT store methods or onlineUsers)
  useEffect(() => {
    // Only update room if it actually changed
    if (prevRoomRef.current !== room) {
      setRoomRef.current(room || null);
      prevRoomRef.current = room;
    }

    if (!room) {
      cleanup();
      clearUsersRef.current();
      return;
    }

    // Clean up previous listener
    cleanup();

    // Set up new listener - use ref to get current onlineUsers for deduplication
    // This avoids adding onlineUsers to deps (which would cause infinite loops)
    const unsubscribe = getUserList(room, handleUserUpdate, onlineUsersRef.current);
    unsubscribeRef.current = unsubscribe || null;

    // Cleanup on unmount or room change
    return cleanup;
  }, [room, handleUserUpdate, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Memoized context value with stable reference
  const value = useMemo(() => ({ onlineUsers }), [onlineUsers]);

  return <UserListContext.Provider value={value} {...props} />;
}

export { UserListProvider };
