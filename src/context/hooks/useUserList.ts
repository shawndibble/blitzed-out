import { UserListContext, UserListContextType } from '@/context/userList';
import { useContext } from 'react';

export default function useUserList(): UserListContextType {
  const value = useContext(UserListContext);

  if (!value) {
    throw new Error("UserListContext's value is undefined.");
  }

  return value;
}
