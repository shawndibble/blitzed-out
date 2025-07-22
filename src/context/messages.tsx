import { createContext, ReactNode, useEffect } from 'react';
import { Params, useParams } from 'react-router-dom';
import { getMessages } from '@/services/firebase';
import { Message } from '@/types/Message';
import { useMessagesStore } from '@/stores/messagesStore';

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
  const { id: room } = useParams<Params>();
  const {
    messages,
    loading: isLoading,
    loadMessages,
    setLoading,
    setRoom,
    clearMessages,
  } = useMessagesStore();

  useEffect(() => {
    setLoading(true);
    setRoom(room || null);

    if (!room) {
      clearMessages();
      return;
    }

    return getMessages(room, (newMessages: Message[]) => {
      loadMessages(newMessages);
    });
  }, [room, loadMessages, setLoading, setRoom, clearMessages]);

  const value = { messages, isLoading };

  return <MessagesContext.Provider value={value} {...props} />;
}
