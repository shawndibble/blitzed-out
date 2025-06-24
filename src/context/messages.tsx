import { normalSortedMessages } from '@/helpers/messages';
import { createContext, ReactNode, useEffect, useState } from 'react';
import { Params, useParams } from 'react-router-dom';
import { getMessages } from '@/services/firebase';
import { Message } from '@/types/Message';

export interface MessagesContextType {
  messages: Message[];
  isLoading: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
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
    return getMessages(room, (newMessages: Message[]) => {
      const sorted = normalSortedMessages(newMessages);
      setMessages(sorted);
      setIsLoading(false);
    });
  }, [room]);

  const value = { messages, isLoading };

  return <MessagesContext.Provider value={value} {...props} />;
}
