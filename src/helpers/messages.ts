import { Message, MessageType } from '@/types/Message';
import { parseMessageTimestamp } from '@/helpers/timestamp';

// chat box
export function normalSortedMessages(messages: Message[]): Message[] {
  return messages.sort((a, b) => {
    const aDate = parseMessageTimestamp(a.timestamp);
    const bDate = parseMessageTimestamp(b.timestamp);
    if (!aDate || !bDate) return 0;
    return aDate.getTime() - bDate.getTime();
  });
}

// latest on top
export function sortedMessages(messages: Message[]): Message[] {
  const newMessage = JSON.parse(JSON.stringify(messages));
  return newMessage.reverse();
}

export default function latestMessageByType(
  messages: Message[],
  type: MessageType
): Message | undefined {
  return sortedMessages(messages).find((m) => m.type === type);
}

export function orderedMessagesByType(
  messages: Message[],
  type: string,
  order: 'ASC' | 'DESC' = 'ASC'
): Message[] {
  let sorted = sortedMessages(messages);
  if (order === 'DESC') {
    sorted = sorted.reverse();
  }
  return sorted.filter((m) => m.type === type);
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
