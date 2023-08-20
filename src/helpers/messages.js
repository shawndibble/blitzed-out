export default function latestMessageByType(messages, type) {
  return messages.sort((a, b) => b.timestamp - a.timestamp).find((m) => m.type === type);
}
