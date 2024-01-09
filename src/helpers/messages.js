export function sortedMessages(messages) {
  return messages.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
}

export default function latestMessageByType(messages, type) {
  return sortedMessages(messages)
    .find((m) => m.type === type);
}

export function latestMessageBy(messages, callback) {
  return sortedMessages(messages)
    .find(callback);
}

export function latestMessage(messages) {
  return sortedMessages(messages)[0];
}
