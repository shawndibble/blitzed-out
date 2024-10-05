import { UserListContext } from '@/context/userList';
import React from 'react';

export default function useUserList() {
  const value = React.useContext(UserListContext);

  if (!value) {
    throw new Error("UserListContext's value is undefined.");
  }

  return value;
}
