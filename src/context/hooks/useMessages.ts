import React from 'react';
import { MessagesContext, MessagesContextType } from '../messages';

export default function useMessages(): MessagesContextType {
  const value = React.useContext(MessagesContext);

  if (!value) {
    // eslint-disable-next-line quotes
    throw new Error("MessagesContext's value is undefined.");
  }

  return value;
}
