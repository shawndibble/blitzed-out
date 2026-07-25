import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sendRoomSettingsMessage } from '@/services/roomSettingsService';
import { sendMessage } from '@/services/firebase';
import type { Settings } from '@/types/Settings';
import type { User } from '@/types';

vi.mock('@/services/firebase', () => ({
  sendMessage: vi.fn().mockResolvedValue(undefined),
}));

const user = { uid: 'u1', displayName: 'Alex' } as User;

function settingsWith(roomRealtime: boolean): Settings {
  return { room: 'ABCDE', roomRealtime } as Settings;
}

/** The broadcast text of the most recent sendMessage call. */
function lastMessageText(): string {
  const calls = vi.mocked(sendMessage).mock.calls;
  return (calls[calls.length - 1][0] as { text: string }).text;
}

/**
 * Asserts on translation KEYS rather than English words: the test environment resolves t() to the
 * key itself, and the defect is which key gets chosen, so keys are the precise assertion target.
 */
describe('sendRoomSettingsMessage — roomRealtime is announced with the polarity it is stored', () => {
  beforeEach(() => {
    vi.mocked(sendMessage).mockClear();
  });

  // roomRealtime true means real-time presence: usePresence.ts:34 passes it as removeOnDisconnect,
  // RoomSection.tsx:155 renders it as the "realtime" toggle position, and CONTEXT.md documents it
  // that way. The broadcast used to invert it, announcing "delayed" for a realtime room.
  it('announces realtime when roomRealtime is true', async () => {
    await sendRoomSettingsMessage(settingsWith(true), user);

    expect(lastMessageText()).toContain('playerList: realtime');
    expect(lastMessageText()).not.toContain('delayed');
  });

  it('announces delayed when roomRealtime is false', async () => {
    await sendRoomSettingsMessage(settingsWith(false), user);

    expect(lastMessageText()).toContain('playerList: delayed');
    expect(lastMessageText()).not.toContain('realtime');
  });
});
