import { createContext, useState, useMemo, useEffect, ReactNode } from 'react';
import { Params, useParams } from 'react-router-dom';
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

// eslint-disable-next-line react-refresh/only-export-components
export const UserListContext = createContext<UserListContextType | undefined>(undefined);

interface UserListProviderProps {
  children: ReactNode;
  [key: string]: any;
}

function UserListProvider(props: UserListProviderProps): JSX.Element {
  const { id: room } = useParams<Params>();
  const [onlineUsers, setOnlineUsers] = useState<Record<string, OnlineUser>>({});

  useEffect(() => {
    return getUserList(room, (newUsers: Record<string, OnlineUser>) => setOnlineUsers(newUsers));
  }, [room]);

  const value = useMemo(() => ({ onlineUsers }), [onlineUsers]);

  return <UserListContext.Provider value={value} {...props} />;
}

export { UserListProvider };
