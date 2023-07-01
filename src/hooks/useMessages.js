import React from 'react';
import { getMessages } from 'services/firebase';

export default function useMessages(roomId) {
  const [messages, setMessages] = React.useState([]);

  React.useEffect(() => {
    const unsubscribe = getMessages(roomId, setMessages);
    return unsubscribe;
  }, [roomId]);

  return messages;
}
