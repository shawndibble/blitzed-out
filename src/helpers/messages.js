export default function latestMessageByType(messages, type) {
  return messages
    .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)
    .find((m) => m.type === type);
}

export function latestMessageBy(messages, callback) {
  return messages
    .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)
    .find(callback);
}
