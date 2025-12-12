import React, { useMemo, useEffect, useCallback, ReactNode, useRef } from 'react';
import { Params, useParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { getUserList } from '@/services/firebase';
import { useUserListStore } from '@/stores/userListStore';

export interface OnlineUser {
  displayName: string;
  uid: string;
  lastSeen: Date;
  [key: string]: any;
}

function isValidOnlineUser(obj: unknown): obj is OnlineUser {
  if (!obj || typeof obj !== 'object') return false;

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
  const onlineUsers = useUserListStore((s) => s.onlineUsers);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const prevRoomRef = useRef<string | undefined>(undefined);
  const onlineUsersRef = useRef(onlineUsers);

  useEffect(() => {
    onlineUsersRef.current = onlineUsers;
  }, [onlineUsers]);

  const handleUserUpdateRef = useRef<(newUsers: Record<string, unknown> | null) => void>(() => {});

  const { setUsers, clearUsers, setRoom, flushPendingUpdates } = useUserListStore(
    useShallow((s) => ({
      setUsers: s.setUsers,
      clearUsers: s.clearUsers,
      setRoom: s.setRoom,
      flushPendingUpdates: s.flushPendingUpdates,
    }))
  );

  const setUsersRef = useRef(setUsers);
  const clearUsersRef = useRef(clearUsers);
  const setRoomRef = useRef(setRoom);
  const flushPendingUpdatesRef = useRef(flushPendingUpdates);

  useEffect(() => {
    setUsersRef.current = setUsers;
    clearUsersRef.current = clearUsers;
    setRoomRef.current = setRoom;
    flushPendingUpdatesRef.current = flushPendingUpdates;
  }, [setUsers, clearUsers, setRoom, flushPendingUpdates]);

  useEffect(() => {
    handleUserUpdateRef.current = (newUsers: Record<string, unknown> | null) => {
      if (newUsers === null) {
        clearUsersRef.current();
        return;
      }

      const validatedUsers: Record<string, OnlineUser> = {};

      Object.entries(newUsers).forEach(([uid, userData]) => {
        if (isValidOnlineUser(userData)) {
          const user: OnlineUser = {
            ...userData,
            lastSeen:
              userData.lastSeen instanceof Date
                ? userData.lastSeen
                : new Date(userData.lastSeen as string | number),
          };
          validatedUsers[uid] = user;
        }
      });

      setUsersRef.current(validatedUsers);
    };
  }, []);

  const handleUserUpdate = useCallback((newUsers: Record<string, unknown> | null) => {
    handleUserUpdateRef.current?.(newUsers);
  }, []);

  const cleanup = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    flushPendingUpdatesRef.current();
  }, []);

  useEffect(() => {
    if (prevRoomRef.current !== room) {
      setRoomRef.current(room || null);
      prevRoomRef.current = room;
    }

    if (!room) {
      cleanup();
      clearUsersRef.current();
      return;
    }

    cleanup();

    // Disable debouncing for user list - we need real-time updates for presence
    const unsubscribe = getUserList(room, handleUserUpdate, onlineUsersRef.current, {
      enableDebounce: false,
    });
    unsubscribeRef.current = unsubscribe || null;

    return cleanup;
  }, [room, handleUserUpdate, cleanup]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const value = useMemo(() => ({ onlineUsers }), [onlineUsers]);

  return <UserListContext.Provider value={value} {...props} />;
}

export { UserListProvider };
