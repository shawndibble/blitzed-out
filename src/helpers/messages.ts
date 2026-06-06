import { Message, MessageType } from '@/types/Message';
import { parseMessageTimestamp } from '@/helpers/timestamp';

// chat box — non-mutating ASC sort
export function normalSortedMessages(messages: Message[]): Message[] {
  return [...messages].sort((a, b) => {
    const aDate = parseMessageTimestamp(a.timestamp);
    const bDate = parseMessageTimestamp(b.timestamp);
    if (!aDate || !bDate) return 0;
    return aDate.getTime() - bDate.getTime();
  });
}

// latest on top — non-mutating DESC (preserves object refs)
export function sortedMessages(messages: Message[]): Message[] {
  return [...messages].reverse();
}

export function filterMessagesByType(messages: Message[], type: MessageType): Message[] {
  return messages.filter((m) => m.type === type);
}

export function filterMessages(
  messages: Message[],
  predicate: (message: Message) => boolean
): Message[] {
  return messages.filter(predicate);
}

export function latestMessageByType(messages: Message[], type: MessageType): Message | undefined {
  return sortedMessages(messages).find((m) => m.type === type);
}

export function orderedMessagesByType(
  messages: Message[],
  type: string,
  order: 'ASC' | 'DESC' = 'ASC'
): Message[] {
  // Sort by timestamp properly
  const filtered = messages.filter((m) => m.type === type);
  return filtered.sort((a, b) => {
    const aDate = parseMessageTimestamp(a.timestamp);
    const bDate = parseMessageTimestamp(b.timestamp);
    if (!aDate || !bDate) return 0;
    // ASC = oldest first, DESC = newest first
    return order === 'DESC' ? bDate.getTime() - aDate.getTime() : aDate.getTime() - bDate.getTime();
  });
}

export function latestMessageBy(
  messages: Message[],
  callback: (message: Message) => boolean
): Message | undefined {
  return sortedMessages(messages).find(callback);
}

export function latestMessage(messages: Message[]): Message | undefined {
  return sortedMessages(messages)[0];
}
