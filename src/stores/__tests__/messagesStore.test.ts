import { describe, it, expect, beforeEach } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { Message } from '@/types/Message';
import { useMessagesStore } from '@/stores/messagesStore';

function chat(partial: Partial<Message> & { uid: string; text: string }): Message {
  return {
    id: partial.id,
    uid: partial.uid,
    displayName: partial.displayName ?? 'Tester',
    text: partial.text,
    type: 'chat',
    timestamp: partial.timestamp ?? Timestamp.now(),
    pending: partial.pending,
  } as Message;
}

describe('messagesStore.loadMessages', () => {
  beforeEach(() => {
    useMessagesStore.setState({
      messages: [],
      loading: true,
      error: null,
      room: null,
      paginationCursor: null,
    });
  });

  it('preserves a pending optimistic message when real messages load without it', () => {
    useMessagesStore
      .getState()
      .addMessage(chat({ id: 'optimistic-1', uid: 'u1', text: 'hello', pending: true }));

    // Real query result that does not yet contain the optimistic message
    useMessagesStore.getState().loadMessages([chat({ id: 'real-x', uid: 'u2', text: 'hi there' })]);

    const { messages } = useMessagesStore.getState();
    expect(messages.map((m) => m.id)).toContain('optimistic-1');
    expect(messages.map((m) => m.id)).toContain('real-x');
  });

  it('drops the optimistic message once its real counterpart (same uid+text) arrives', () => {
    useMessagesStore
      .getState()
      .addMessage(chat({ id: 'optimistic-1', uid: 'u1', text: 'hello', pending: true }));

    useMessagesStore.getState().loadMessages([chat({ id: 'real-1', uid: 'u1', text: 'hello' })]);

    const { messages } = useMessagesStore.getState();
    expect(messages).toHaveLength(1);
    expect(messages[0].id).toBe('real-1');
  });

  it('clears loading and never duplicates real messages', () => {
    useMessagesStore
      .getState()
      .loadMessages([
        chat({ id: 'real-1', uid: 'u1', text: 'a' }),
        chat({ id: 'real-2', uid: 'u2', text: 'b' }),
      ]);

    const state = useMessagesStore.getState();
    expect(state.loading).toBe(false);
    expect(state.messages).toHaveLength(2);
  });
});
