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

  // Optimized user update handler with batching
  const handleUserUpdate = useCallback(
    (newUsers: Record<string, OnlineUser> | null) => {
      if (newUsers === null) {
        clearUsers();
      } else {
        setUsers(newUsers);
      }
    },
    [setUsers, clearUsers]
  );

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
    getUserList(room, handleUserUpdate);
    unsubscribeRef.current = null; // TODO: getUserList should return unsubscribe function

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
