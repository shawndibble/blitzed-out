export function sortedMessages(messages) {
  return messages.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());
}

export default function latestMessageByType(messages, type) {
  return sortedMessages(messages)
    .find((m) => m.type === type);
}

export function orderedMessagesByType(messages, type, order = 'ASC') {
  let sorted = sortedMessages(messages);
  if (order === 'DESC') {
    sorted = sorted.reverse();
  }
  return sorted.filter((m) => m.type === type);
}

export function latestMessageBy(messages, callback) {
  return sortedMessages(messages)
    .find(callback);
}

export function latestMessage(messages) {
  return sortedMessages(messages)[0];
}
