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
  const { onlineUsers, setUsers, setRoom, clearUsers, flushPendingUpdates } = useUserListStore();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const prevRoomRef = useRef<string | undefined>(room);

  // Stable callback ref to prevent infinite useEffect loops
  const handleUserUpdateRef = useRef<(newUsers: Record<string, unknown> | null) => void>(() => {});

  // Update the callback ref when dependencies change
  useEffect(() => {
    handleUserUpdateRef.current = (newUsers: Record<string, unknown> | null) => {
      if (newUsers === null) {
        clearUsers();
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
            console.warn(`Invalid user data for uid ${uid}:`, userData);
          }
        });

        setUsers(validatedUsers);
      }
    };
  }, [setUsers, clearUsers]);

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
    flushPendingUpdates();
  }, [flushPendingUpdates]);

  useEffect(() => {
    // Only update room if it actually changed
    if (prevRoomRef.current !== room) {
      setRoom(room || null);
      prevRoomRef.current = room;
    }

    if (!room) {
      cleanup();
      clearUsers();
      return;
    }

    // Clean up previous listener
    cleanup();

    // Set up new listener
    const unsubscribe = getUserList(room, handleUserUpdate, onlineUsers);
    unsubscribeRef.current = unsubscribe || null;

    // Cleanup on unmount or room change
    return cleanup;
  }, [room, setRoom, clearUsers, handleUserUpdate, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Memoized context value with stable reference
  const value = useMemo(() => ({ onlineUsers }), [onlineUsers]);

  return <UserListContext.Provider value={value} {...props} />;
}

export { UserListProvider };
