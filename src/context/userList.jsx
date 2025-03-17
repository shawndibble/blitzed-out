import React, { createContext, useState, useMemo, useEffect, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { getUserList } from '@/services/firebase';

export interface OnlineUser {
  displayName: string;
  uid: string;
  lastSeen: Date;
  [key: string]: any;
}

export interface UserListContextType {
  onlineUsers: Record<string, OnlineUser>;
}

export const UserListContext = createContext<UserListContextType | undefined>(undefined);

interface UserListProviderProps {
  children: ReactNode;
  [key: string]: any;
}

interface RouteParams {
  id: string;
}

function UserListProvider(props: UserListProviderProps): JSX.Element {
  const { id: room } = useParams<RouteParams>();
  const [onlineUsers, setOnlineUsers] = useState<Record<string, OnlineUser>>({});

  useEffect(() => {
    getUserList(room, (newUsers: Record<string, OnlineUser>) => setOnlineUsers(newUsers), onlineUsers);
  }, [room]);

  const value = useMemo(() => ({ onlineUsers }), [onlineUsers]);

  return <UserListContext.Provider value={value} {...props} />;
}

export { UserListProvider };
