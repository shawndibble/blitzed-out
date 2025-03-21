import { normalSortedMessages } from '@/helpers/messages';
import { createContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMessages } from '@/services/firebase';

export const MessagesContext = createContext();

export function MessagesProvider(props) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { id: room } = useParams();

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = getMessages(room, (newMessages) => {
      const sorted = normalSortedMessages(newMessages);
      setMessages(sorted);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [room]);

  // eslint-disable-next-line
  const value = { messages, isLoading };
  
  return <MessagesContext.Provider value={value} {...props} />;
}