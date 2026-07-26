import * as firebaseService from '@/services/firebase/chat';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import useReturnToStart from '../useReturnToStart';
import { makeTurnFields } from '@/__tests__/fixtures/turnFields.fixtures';

vi.mock('@/services/firebase/chat', () => ({
  sendMessage: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  default: () => ({
    user: {
      uid: 'test-user',
      displayName: 'TestUser',
      isAnonymous: false,
    },
  }),
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'TEST_ROOM' }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        start: 'Start',
        restartingGame: 'Restarting Game',
        action: 'Action',
      };
      return translations[key] || key;
    },
  }),
}));

describe('useReturnToStart', () => {
  const mockSendMessage = vi.mocked(firebaseService.sendMessage);

  beforeEach(() => {
    vi.clearAllMocks();
    mockSendMessage.mockResolvedValue({ id: 'test-message-id' } as any);
  });

  it('emits the restart turn fields: kind restart, roll null, location 0, finished false', async () => {
    const { result } = renderHook(() => useReturnToStart());

    await result.current();

    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        room: 'TEST_ROOM',
        type: 'actions',
      })
    );

    const { turn } = mockSendMessage.mock.calls[0][0];
    expect(turn).toStrictEqual(
      makeTurnFields({
        kind: 'restart',
        roll: null,
        location: 0,
        title: 'Start',
        description: 'Start',
        finished: false,
      })
    );
  });

  it("emits a text string byte-identical to develop's pre-refactor encoder", async () => {
    const { result } = renderHook(() => useReturnToStart());

    await result.current();

    expect(mockSendMessage.mock.calls[0][0].text).toBe('Restarting Game\n#1: Start\nAction: Start');
  });
});
