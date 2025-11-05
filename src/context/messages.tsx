import React, { ReactNode, useEffect } from 'react';
import { Params, useParams } from 'react-router-dom';
import { getMessages } from '@/services/firebase';
import { Message } from '@/types/Message';
import { useMessagesStore } from '@/stores/messagesStore';

export interface MessagesContextType {
  messages: Message[];
  isLoading: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const MessagesContext = React.createContext<MessagesContextType | undefined>(undefined);

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

    return getMessages(room, (newMessages: Array<Record<string, unknown>>) => {
      loadMessages(newMessages as unknown as Message[]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]); // Only depend on room - Zustand actions are stable

  const value = { messages, isLoading };

  return <MessagesContext.Provider value={value} {...props} />;
}
