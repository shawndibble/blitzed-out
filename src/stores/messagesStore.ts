import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Message, MessageType } from '@/types/Message';
import latestMessageByType, {
  normalSortedMessages,
  orderedMessagesByType,
  latestMessage,
} from '@/helpers/messages';

interface MessagesState {
  messages: Message[];
  loading: boolean;
  error: string | null;
  room: string | null;
  paginationCursor: string | null;
}

interface MessagesActions {
  loadMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRoom: (room: string | null) => void;
  setPaginationCursor: (cursor: string | null) => void;
}

interface MessagesSelectors {
  getMessagesByType: (type: MessageType) => Message[];
  getLatestMessage: () => Message | undefined;
  getLatestMessageByType: (type: MessageType) => Message | undefined;
  getFilteredMessages: (predicate: (message: Message) => boolean) => Message[];
  getOrderedMessagesByType: (type: string, order?: 'ASC' | 'DESC') => Message[];
}

interface MessagesStore extends MessagesState, MessagesActions, MessagesSelectors {}

const initialState: MessagesState = {
  messages: [],
  loading: true,
  error: null,
  room: null,
  paginationCursor: null,
};

export const useMessagesStore = create<MessagesStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Actions
      loadMessages: (messages) => {
        // Cast messages to proper type since Firebase returns any[]
        const typedMessages = messages as Message[];
        const sortedMessages = normalSortedMessages(typedMessages);
        set({
          messages: sortedMessages,
          loading: false,
          error: null,
        });
      },

      addMessage: (message) => {
        const { messages } = get();
        // Check for duplicate messages to prevent unnecessary updates
        const existingMessage = messages.find((msg) => msg.id === message.id);
        if (existingMessage) {
          return; // Message already exists, no update needed
        }

        const newMessages = [...messages, message];
        const sortedMessages = normalSortedMessages(newMessages);
        set({ messages: sortedMessages });
      },

      updateMessage: (id, updates) => {
        const { messages } = get();
        let hasChanges = false;
        const updatedMessages = messages.map((msg) => {
          if (msg.id === id) {
            // Check if updates actually change anything
            const updatedMsg = { ...msg, ...updates } as Message;
            const hasActualChanges = Object.keys(updates).some(
              (key) => (msg as any)[key] !== (updates as any)[key]
            );
            if (hasActualChanges) {
              hasChanges = true;
              return updatedMsg;
            }
          }
          return msg;
        });

        // Only update state if there were actual changes
        if (hasChanges) {
          const sortedMessages = normalSortedMessages(updatedMessages);
          set({ messages: sortedMessages });
        }
      },

      clearMessages: () => {
        set({ messages: [], loading: false, error: null });
      },

      setLoading: (loading) => {
        const { loading: currentLoading } = get();
        if (currentLoading !== loading) {
          set({ loading });
        }
      },

      setError: (error) => {
        const { error: currentError } = get();
        if (currentError !== error) {
          set({ error });
        }
      },

      setRoom: (room) => {
        const { room: currentRoom } = get();
        if (currentRoom !== room) {
          set({ room });
        }
      },

      setPaginationCursor: (cursor) => {
        const { paginationCursor: currentCursor } = get();
        if (currentCursor !== cursor) {
          set({ paginationCursor: cursor });
        }
      },

      // Selectors - Optimized for performance
      getMessagesByType: (type) => {
        const { messages } = get();
        // Use a more efficient filter approach for large message arrays
        const filtered: Message[] = [];
        for (let i = 0; i < messages.length; i++) {
          if (messages[i].type === type) {
            filtered.push(messages[i]);
          }
        }
        return filtered;
      },

      getLatestMessage: () => {
        const { messages } = get();
        return latestMessage(messages);
      },

      getLatestMessageByType: (type) => {
        const { messages } = get();
        return latestMessageByType(messages, type);
      },

      getFilteredMessages: (predicate) => {
        const { messages } = get();
        // Use for loop for better performance on large arrays
        const filtered: Message[] = [];
        for (let i = 0; i < messages.length; i++) {
          if (predicate(messages[i])) {
            filtered.push(messages[i]);
          }
        }
        return filtered;
      },

      getOrderedMessagesByType: (type, order = 'ASC') => {
        const { messages } = get();
        return orderedMessagesByType(messages, type, order);
      },
    }),
    {
      name: 'messages-storage', // localStorage key
      partialize: (state) => ({
        messages: state.messages,
        room: state.room,
        paginationCursor: state.paginationCursor,
      }),
      // Add TTL functionality
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Clear messages older than 24 hours on rehydration
            const twentyFourHoursAgo = new Date();
            twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

            const validMessages = state.messages.filter((msg) => {
              try {
                let messageTime: Date | null = null;

                if (msg.timestamp && typeof msg.timestamp.toDate === 'function') {
                  // Firebase Timestamp format
                  messageTime = msg.timestamp.toDate();
                } else if (msg.timestamp && typeof msg.timestamp === 'string') {
                  // Serialized timestamp format
                  messageTime = new Date(msg.timestamp);
                  if (isNaN(messageTime.getTime())) {
                    throw new Error('Invalid serialized timestamp format');
                  }
                } else if (msg.timestamp && typeof msg.timestamp === 'number') {
                  // Unix timestamp (milliseconds or seconds)
                  const timestamp = msg.timestamp;
                  // If timestamp is less than year 3000 in seconds, convert to milliseconds
                  const timestampMs = timestamp < 32503680000 ? timestamp * 1000 : timestamp;
                  messageTime = new Date(timestampMs);
                  if (isNaN(messageTime.getTime())) {
                    throw new Error('Invalid numeric timestamp format');
                  }
                } else if (
                  msg.timestamp &&
                  typeof msg.timestamp === 'object' &&
                  msg.timestamp.seconds
                ) {
                  // Firestore Timestamp serialized object format {seconds: number, nanoseconds: number}
                  const timestampObj = msg.timestamp as { seconds: number; nanoseconds?: number };
                  messageTime = new Date(
                    timestampObj.seconds * 1000 + (timestampObj.nanoseconds || 0) / 1000000
                  );
                  if (isNaN(messageTime.getTime())) {
                    throw new Error('Invalid Firestore timestamp object format');
                  }
                } else if (msg.timestamp instanceof Date) {
                  // Already a Date object
                  messageTime = msg.timestamp;
                } else {
                  // Log the actual timestamp value for debugging
                  console.warn(
                    `Unsupported timestamp format for message ${msg.id}:`,
                    typeof msg.timestamp,
                    msg.timestamp
                  );
                  throw new Error(`Unsupported timestamp format: ${typeof msg.timestamp}`);
                }

                return messageTime > twentyFourHoursAgo;
              } catch (error) {
                // Log specific error messages for debugging
                console.warn(
                  `Failed to parse message timestamp for message ID ${msg.id}:`,
                  (error as Error).message
                );
                return true; // Keep the message if parsing fails
              }
            });

            if (validMessages.length !== state.messages.length) {
              state.loadMessages(validMessages);
            }
          }
        };
      },
    }
  )
);

// Compatibility hook for existing useMessages pattern
export const useMessages = () => {
  const { messages, loading: isLoading } = useMessagesStore();
  return { messages, isLoading };
};
