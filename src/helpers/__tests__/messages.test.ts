import { describe, expect, it } from 'vitest';
import {
  filterMessages,
  filterMessagesByType,
  latestMessage,
  latestMessageBy,
  latestMessageByType,
  normalSortedMessages,
  orderedMessagesByType,
  sortedMessages,
} from '../messages';
import { Message, MessageType } from '@/types/Message';

const makeMessage = (text: string, type: MessageType, isoDate: string): Message =>
  ({
    id: text,
    text,
    type,
    timestamp: isoDate,
    uid: 'user1',
    displayName: 'Test',
  }) as unknown as Message;

const old = makeMessage('old', 'chat', '2024-01-01T00:00:00.000Z');
const mid = makeMessage('mid', 'chat', '2024-01-02T00:00:00.000Z');
const recent = makeMessage('recent', 'actions', '2024-01-03T00:00:00.000Z');

describe('normalSortedMessages', () => {
  it('sorts ASC by timestamp (oldest first)', () => {
    const result = normalSortedMessages([recent, old, mid]);
    expect(result.map((m) => m.text)).toEqual(['old', 'mid', 'recent']);
  });

  it('does not mutate input array', () => {
    const input = [recent, old, mid];
    const original = [...input];
    normalSortedMessages(input);
    expect(input).toEqual(original);
  });
});

describe('sortedMessages', () => {
  it('reverses to DESC order (newest first)', () => {
    const result = sortedMessages([old, mid, recent]);
    expect(result.map((m) => m.text)).toEqual(['recent', 'mid', 'old']);
  });

  it('does not mutate input array', () => {
    const input = [old, mid, recent];
    const copy = [...input];
    sortedMessages(input);
    expect(input).toEqual(copy);
  });

  it('preserves object references (no deep copy)', () => {
    const input = [old, mid];
    const result = sortedMessages(input);
    expect(result[0]).toBe(mid);
    expect(result[1]).toBe(old);
  });
});

describe('filterMessagesByType', () => {
  it('returns messages matching type', () => {
    expect(filterMessagesByType([old, mid, recent], 'chat')).toEqual([old, mid]);
    expect(filterMessagesByType([old, mid, recent], 'actions')).toEqual([recent]);
  });

  it('returns empty array when none match', () => {
    expect(filterMessagesByType([old], 'settings')).toEqual([]);
  });

  it('does not mutate input', () => {
    const input = [old, mid, recent];
    const copy = [...input];
    filterMessagesByType(input, 'chat');
    expect(input).toEqual(copy);
  });
});

describe('filterMessages', () => {
  it('filters by predicate', () => {
    const result = filterMessages([old, mid, recent], (m) => m.type === 'chat');
    expect(result).toEqual([old, mid]);
  });

  it('returns empty array when predicate matches nothing', () => {
    expect(filterMessages([old], (m) => m.uid === 'nobody')).toEqual([]);
  });

  it('preserves object references', () => {
    const result = filterMessages([old, mid], (m) => m.text === 'old');
    expect(result[0]).toBe(old);
  });
});

describe('orderedMessagesByType', () => {
  it('ASC order returns oldest first', () => {
    const result = orderedMessagesByType([mid, old], 'chat', 'ASC');
    expect(result.map((m) => m.text)).toEqual(['old', 'mid']);
  });

  it('DESC order returns newest first', () => {
    const result = orderedMessagesByType([old, mid], 'chat', 'DESC');
    expect(result.map((m) => m.text)).toEqual(['mid', 'old']);
  });

  it('filters out non-matching types', () => {
    const result = orderedMessagesByType([old, mid, recent], 'chat');
    expect(result.every((m) => m.type === 'chat')).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('defaults to ASC', () => {
    const result = orderedMessagesByType([mid, old], 'chat');
    expect(result[0].text).toBe('old');
  });
});

describe('latestMessageByType', () => {
  it('returns newest message of given type', () => {
    expect(latestMessageByType([old, mid, recent], 'chat')).toBe(mid);
  });

  it('returns undefined when none match', () => {
    expect(latestMessageByType([old], 'settings')).toBeUndefined();
  });
});

describe('latestMessageBy', () => {
  it('returns newest message matching predicate', () => {
    const result = latestMessageBy([old, mid, recent], (m) => m.type === 'chat');
    expect(result).toBe(mid);
  });

  it('returns undefined when predicate matches nothing', () => {
    expect(latestMessageBy([old], (m) => m.uid === 'nobody')).toBeUndefined();
  });
});

describe('latestMessage', () => {
  it('returns most recent message', () => {
    expect(latestMessage([old, mid, recent])).toBe(recent);
  });

  it('returns undefined for empty array', () => {
    expect(latestMessage([])).toBeUndefined();
  });
});
