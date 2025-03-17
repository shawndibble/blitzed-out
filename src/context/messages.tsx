import { normalSortedMessages } from '@/helpers/messages';
import { createContext, useEffect, useState, ReactNode } from 'react';
import { Params, useParams } from 'react-router-dom';
import { getMessages } from '@/services/firebase';
import { Message } from '@/types/Message';

export interface MessagesContextType {
  messages: Message[];
  isLoading: boolean;
}

export const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

interface MessagesProviderProps {
  children: ReactNode;
  [key: string]: any;
}

export function MessagesProvider(props: MessagesProviderProps): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { id: room } = useParams<Params>();

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = getMessages(room, (newMessages: Message[]) => {
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
