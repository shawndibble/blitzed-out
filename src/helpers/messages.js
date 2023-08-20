export default function latestMessageByType(messages, type) {
  return messages
    .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)
    .find((m) => m.type === type);
}
