import { describe, expect, it } from 'vitest';

import getPrivateRoomBackground from '@/helpers/getPrivateRoomBackground';
import { Message } from '@/types/Message';

function roomMessage(settings: Record<string, unknown>): Message {
  return {
    id: 'm1',
    uid: 'other',
    text: '',
    displayName: 'Other',
    timestamp: new Date().toISOString() as unknown as Message['timestamp'],
    type: 'room',
    settings: JSON.stringify(settings),
    boardSize: 60,
    gameMode: 'online',
    roomTileCount: 60,
  } as Message;
}

describe('getPrivateRoomBackground', () => {
  // Regression test for the substring-match bug: `['color', 'gray'].some((c) =>
  // url.includes(c))` blanks any URL that merely CONTAINS "color" or "gray"
  // anywhere in its text, not just the built-in-theme sentinels.
  it('does not blank a direct image URL whose text happens to contain "color"', () => {
    const messages = [roomMessage({ roomBackgroundURL: 'https://example.com/discolored.png' })];
    const result = getPrivateRoomBackground(messages);
    expect(result.url).toBe('https://example.com/discolored.png');
  });

  it('does not blank an imgur URL whose text happens to contain "gray"', () => {
    const messages = [roomMessage({ roomBackgroundURL: 'https://i.imgur.com/graysky.jpg' })];
    const result = getPrivateRoomBackground(messages);
    expect(result.url).toBe('https://i.imgur.com/graysky.jpg');
    // isVideo is always true for imgur URLs (a preexisting, out-of-scope
    // quirk unrelated to the sentinel fix under test here).
    expect(result.isVideo).toBe(true);
  });

  it('resolves the built-in "color" theme sentinel to an empty url', () => {
    const messages = [roomMessage({ roomBackground: 'color' })];
    expect(getPrivateRoomBackground(messages)).toEqual({ url: '', isVideo: false });
  });

  it('resolves the built-in "gray" theme sentinel to an empty url', () => {
    const messages = [roomMessage({ roomBackground: 'gray' })];
    expect(getPrivateRoomBackground(messages)).toEqual({ url: '', isVideo: false });
  });

  it('uses roomBackgroundURL when roomBackground is "custom"', () => {
    const messages = [
      roomMessage({ roomBackground: 'custom', roomBackgroundURL: 'https://example.com/bg.mp4' }),
    ];
    const result = getPrivateRoomBackground(messages);
    expect(result.url).toBe('https://example.com/bg.mp4');
    expect(result.isVideo).toBe(true);
  });

  it('falls back to roomBackgroundURL when roomBackground is absent (legacy rooms)', () => {
    const messages = [roomMessage({ roomBackgroundURL: 'https://example.com/bg.jpg' })];
    const result = getPrivateRoomBackground(messages);
    expect(result.url).toBe('https://example.com/bg.jpg');
    expect(result.isVideo).toBe(false);
  });

  it('returns an empty background when settings JSON is malformed', () => {
    const messages: Message[] = [
      {
        id: 'm1',
        uid: 'other',
        text: '',
        displayName: 'Other',
        timestamp: new Date().toISOString() as unknown as Message['timestamp'],
        type: 'room',
        settings: '{not json',
        boardSize: 60,
        gameMode: 'online',
        roomTileCount: 60,
      } as Message,
    ];
    expect(getPrivateRoomBackground(messages)).toEqual({ url: '', isVideo: false });
  });

  it('returns an empty background when there is no room-type message', () => {
    expect(getPrivateRoomBackground([])).toEqual({ url: '', isVideo: false });
  });
});
