import { useState, useEffect } from 'react';
import { getMessages } from 'services/firebase';

export default function useMessages(roomId) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = getMessages(roomId, (newMessages) => {
      setMessages(newMessages);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [roomId]);

  return { messages, isLoading };
}
