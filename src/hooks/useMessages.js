import React from 'react';
import { MessagesContext } from '../context/messages';

export default function useAuth() {
  const value = React.useContext(MessagesContext);

  if (!value) {
    // eslint-disable-next-line quotes
    throw new Error("MessagesContext's value is undefined.");
  }

  return value;
}
