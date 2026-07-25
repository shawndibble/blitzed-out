import * as firebaseService from '@/services/firebase/chat';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

import { RollValueState } from '@/types/index';
import { TileExport } from '@/types/gameBoard';
import usePlayerMove from '../usePlayerMove';
import { makeTurnFields } from '@/__tests__/fixtures/turnFields.fixtures';

// Mock Firebase service
vi.mock('@/services/firebase/chat', () => ({
  sendMessage: vi.fn(),
}));

// Mock auth context
vi.mock('@/context/hooks/useAuth', () => ({
  default: () => ({
    user: {
      uid: 'test-user',
      displayName: 'TestUser',
      isAnonymous: false,
    },
  }),
}));

// Mock settings store
vi.mock('@/stores/settingsStore', () => ({
  useSettings: () => [
    {
      role: 'sub',
    },
  ],
}));

// Mock player list
const { mockPlayerLocation } = vi.hoisted(() => ({ mockPlayerLocation: { current: 1 } }));

vi.mock('../usePlayerList', () => ({
  default: () => [
    {
      isSelf: true,
      location: mockPlayerLocation.current,
      displayName: 'TestUser',
    },
  ],
}));

// Mock local players
vi.mock('../useLocalPlayers', () => ({
  useLocalPlayers: () => ({
    currentPlayer: null,
    hasLocalPlayers: false,
    isLocalPlayerRoom: false,
    advanceToNextPlayer: vi.fn(),
    session: null,
  }),
}));

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        roll: 'Roll',
        action: 'Action',
        unknownTile: 'Unknown Tile',
        restartingGame: 'Restarting Game',
        alreadyFinished: 'Already Finished',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock action string replacement
vi.mock('@/services/actionStringReplacement', () => ({
  default: (action: string, _role: string, displayName: string) =>
    `${displayName} ${action
      .replace('{player}', displayName)
      .replace('{sub}', displayName)
      .replace('{genital}', 'genitals')
      .replace('{hole}', 'hole')
      .replace('{chest}', 'chest')
      .replace('{pronoun_subject}', 'they')
      .replace('{pronoun_object}', 'them')
      .replace('{pronoun_possessive}', 'their')
      .replace('{pronoun_reflexive}', 'themselves')}`,
}));

// Mock messages store
vi.mock('@/stores/messagesStore', () => ({
  useMessagesStore: () => vi.fn(),
}));

// Mock messages context
vi.mock('@/context/hooks/useMessages', () => ({
  default: () => ({
    messages: [],
    loading: false,
  }),
}));

// Mock stats tracking
vi.mock('../useStatsTracking', () => ({
  useStatsTracking: () => ({
    trackTileLanding: vi.fn(),
    trackGameComplete: vi.fn(),
    trackGameStart: vi.fn(),
  }),
}));

describe('usePlayerMove', () => {
  const mockSendMessage = vi.mocked(firebaseService.sendMessage);

  const mockGameBoard: TileExport[] = [
    { title: 'Start', description: 'Welcome to the game!' },
    { title: 'Action 1', description: '{player} does something fun.' },
    { title: 'Action 2', description: '{player} takes a drink.' },
    { title: 'Finish', description: 'Game over!' },
  ];

  const mockRoomId = 'TEST_ROOM';

  beforeEach(() => {
    vi.clearAllMocks();
    mockPlayerLocation.current = 1;
    mockSendMessage.mockResolvedValue({
      id: 'test-message-id',
    } as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('message sending functionality', () => {
    it('should send a message when player rolls dice', async () => {
      const rollValue: RollValueState = {
        value: 2,
        time: Date.now(),
      };

      renderHook(() => usePlayerMove(mockRoomId, rollValue, mockGameBoard));

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            room: mockRoomId,
            user: expect.objectContaining({
              uid: 'test-user',
              displayName: 'TestUser',
            }),
            text: expect.stringContaining('Roll: 2'),
            type: 'actions',
          })
        );
      });
    });

    it('should include tile information in the message', async () => {
      const rollValue: RollValueState = {
        value: 1,
        time: Date.now(),
      };

      renderHook(() => usePlayerMove(mockRoomId, rollValue, mockGameBoard));

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            room: mockRoomId,
            user: expect.any(Object),
            text: expect.stringContaining('#3: Action 2'),
            type: 'actions',
          })
        );
      });
    });

    it('should include processed action description', async () => {
      const rollValue: RollValueState = {
        value: 1,
        time: Date.now(),
      };

      renderHook(() => usePlayerMove(mockRoomId, rollValue, mockGameBoard));

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            room: mockRoomId,
            user: expect.any(Object),
            text: expect.stringContaining('Action: TestUser TestUser takes a drink.'),
            type: 'actions',
          })
        );
      });
    });

    it('should not send duplicate messages for same roll', async () => {
      const rollTime = Date.now();
      const rollValue: RollValueState = {
        value: 1,
        time: rollTime,
      };

      const { rerender } = renderHook(() => usePlayerMove(mockRoomId, rollValue, mockGameBoard));

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledTimes(1);
      });

      // Rerender with same roll value
      rerender();

      // Should not send another message
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockSendMessage).toHaveBeenCalledTimes(1);
    });

    it('should handle sendMessage errors gracefully', async () => {
      mockSendMessage.mockRejectedValue(new Error('Network error'));

      const rollValue: RollValueState = {
        value: 1,
        time: Date.now(),
      };

      // Should not throw even when sendMessage fails
      expect(() => {
        renderHook(() => usePlayerMove(mockRoomId, rollValue, mockGameBoard));
      }).not.toThrow();
    });

    it('should handle invalid roll values', () => {
      const rollValue: RollValueState = {
        value: 0, // Invalid roll
        time: Date.now(),
      };

      renderHook(() => usePlayerMove(mockRoomId, rollValue, mockGameBoard));

      // Should not send a message for invalid roll
      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('should calculate correct tile position from current location', async () => {
      const rollValue: RollValueState = {
        value: 2, // Should move from position 5 to position 7, but we only have 4 tiles (0-3)
        time: Date.now(),
      };

      renderHook(() => usePlayerMove(mockRoomId, rollValue, mockGameBoard));

      // Should move to finish tile (last tile)
      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            room: mockRoomId,
            user: expect.any(Object),
            text: expect.stringContaining('#4: Finish'),
            type: 'actions',
          })
        );
      });
    });
  });

  describe('turn fields (colon-bearing description, defect 1)', () => {
    it('carries the full description in turn.description even when it contains a colon', async () => {
      mockPlayerLocation.current = 0;

      const colonBoard: TileExport[] = [
        { title: 'Start', description: 'Welcome!' },
        { title: 'Action 1', description: 'बात करो: कुछ बोलो' },
        { title: 'Action 2', description: 'more' },
        { title: 'Finish', description: 'Game over!' },
      ];

      const rollValue: RollValueState = {
        value: 1,
        time: Date.now(),
      };

      renderHook(() => usePlayerMove(mockRoomId, rollValue, colonBoard));

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            turn: expect.objectContaining({
              description: expect.stringContaining('TestUser बात करो: कुछ बोलो'),
            }),
          })
        );
      });
    });
  });

  describe('landing on finish tile', () => {
    it('should not crash on the real finish-tile description format (space-separated, no colon)', async () => {
      mockPlayerLocation.current = 2; // one tile before finish

      const finishBoard: TileExport[] = [
        { title: 'Start', description: 'Welcome to the game!' },
        { title: 'Action 1', description: '{player} does something fun.' },
        { title: 'Action 2', description: '{player} takes a drink.' },
        {
          title: 'Finish',
          description: 'No Orgasm 100%\r\nRuined Orgasm 0%\r\nNormal Orgasm 0%',
        },
      ];

      const rollValue: RollValueState = {
        value: 1, // moves from tile #3 to tile #4 (Finish)
        time: Date.now(),
      };

      renderHook(() => usePlayerMove(mockRoomId, rollValue, finishBoard));

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            room: mockRoomId,
            user: expect.any(Object),
            text: expect.stringContaining('#4: Finish'),
            type: 'actions',
          })
        );
      });
    });
  });

  describe('already finished tile', () => {
    it('should stay on the finish tile when rolling a number >= board length while already finished', async () => {
      mockPlayerLocation.current = 3; // on the finish tile (last index of 4-tile board)

      const rollValue: RollValueState = {
        value: 5, // bigger than gameBoard.length (4)
        time: Date.now(),
      };

      renderHook(() => usePlayerMove(mockRoomId, rollValue, mockGameBoard));

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            room: mockRoomId,
            user: expect.any(Object),
            text: expect.stringContaining('Already Finished'),
            type: 'actions',
          })
        );
      });

      const sentText = mockSendMessage.mock.calls[0][0].text;
      expect(sentText).toMatch(/#4:/);
    });

    it('should stay on the finish tile (not move backward) when rolling a number smaller than lastTile while already finished', async () => {
      mockPlayerLocation.current = 3; // on the finish tile (last index of 4-tile board)

      const rollValue: RollValueState = {
        value: 1, // smaller than lastTile (3) - must not be treated as an absolute position
        time: Date.now(),
      };

      renderHook(() => usePlayerMove(mockRoomId, rollValue, mockGameBoard));

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            room: mockRoomId,
            user: expect.any(Object),
            text: expect.stringContaining('Already Finished'),
            type: 'actions',
          })
        );
      });

      const sentText = mockSendMessage.mock.calls[0][0].text;
      expect(sentText).toMatch(/#4:/);
    });
  });

  describe('restart functionality', () => {
    it('should handle restart roll (-1)', async () => {
      const rollValue: RollValueState = {
        value: -1,
        time: Date.now(),
      };

      renderHook(() => usePlayerMove(mockRoomId, rollValue, mockGameBoard));

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            room: mockRoomId,
            user: expect.any(Object),
            text: expect.stringContaining('Restarting Game'),
            type: 'actions',
          })
        );
      });
    });
  });

  // Producer-side coverage: every field the consumers (usePlayerList,
  // ActionCard) assume is present is asserted here against the real emitted
  // `turn`, using the same fixture builder the consumer tests use. A future
  // change to the encoder that silently drops/renames a field, or gets
  // `finished`/`kind` wrong, fails here first.
  describe('turn fields (producer): kind and finished for every path', () => {
    it('emits kind "normal" and finished:false for an ordinary non-finishing roll', async () => {
      mockPlayerLocation.current = 1; // Action 1
      const rollValue: RollValueState = { value: 1, time: Date.now() };

      renderHook(() => usePlayerMove(mockRoomId, rollValue, mockGameBoard));

      await waitFor(() => expect(mockSendMessage).toHaveBeenCalled());

      const { turn } = mockSendMessage.mock.calls[0][0];
      expect(turn).toStrictEqual(
        makeTurnFields({
          kind: 'normal',
          roll: 1,
          location: 2,
          title: 'Action 2',
          description: 'TestUser TestUser takes a drink.',
          finished: false,
        })
      );
    });

    it('emits kind "normal" and finished:true when a normal roll lands exactly on the last tile', async () => {
      mockPlayerLocation.current = 1;
      const rollValue: RollValueState = { value: 2, time: Date.now() }; // 1 + 2 === lastTile (3)

      renderHook(() => usePlayerMove(mockRoomId, rollValue, mockGameBoard));

      await waitFor(() => expect(mockSendMessage).toHaveBeenCalled());

      const { turn } = mockSendMessage.mock.calls[0][0];
      expect(turn).toStrictEqual(
        makeTurnFields({
          kind: 'normal',
          roll: 2,
          location: 3,
          title: 'Finish',
          description: 'TestUser Game over!',
          finished: true,
        })
      );
    });

    it('emits kind "alreadyFinished" and finished:true, carrying the actual roll (not null)', async () => {
      mockPlayerLocation.current = 3; // already on the last tile
      const rollValue: RollValueState = { value: 5, time: Date.now() };

      renderHook(() => usePlayerMove(mockRoomId, rollValue, mockGameBoard));

      await waitFor(() => expect(mockSendMessage).toHaveBeenCalled());

      const { turn } = mockSendMessage.mock.calls[0][0];
      expect(turn).toStrictEqual(
        makeTurnFields({
          kind: 'alreadyFinished',
          roll: 5,
          location: 3,
          title: 'Finish',
          description: 'TestUser Game over!',
          finished: true,
        })
      );
    });

    it('emits kind "restart" with roll:null, location:0, finished:false', async () => {
      const rollValue: RollValueState = { value: -1, time: Date.now() };

      renderHook(() => usePlayerMove(mockRoomId, rollValue, mockGameBoard));

      await waitFor(() => expect(mockSendMessage).toHaveBeenCalled());

      const { turn } = mockSendMessage.mock.calls[0][0];
      expect(turn).toStrictEqual(
        makeTurnFields({
          kind: 'restart',
          roll: null,
          location: 0,
          title: 'Start',
          description: 'TestUser Welcome to the game!',
          finished: false,
        })
      );
    });
  });

  // Characterization: the persisted `text` must stay byte-identical to
  // develop's pre-refactor encoder output. Optimistic-message dedup and every
  // pre-migration message in Firestore depend on this string not changing.
  describe('encoder text is byte-identical to develop (characterization)', () => {
    it('normal roll', async () => {
      mockPlayerLocation.current = 1;
      const rollValue: RollValueState = { value: 1, time: Date.now() };

      renderHook(() => usePlayerMove(mockRoomId, rollValue, mockGameBoard));

      await waitFor(() => expect(mockSendMessage).toHaveBeenCalled());

      expect(mockSendMessage.mock.calls[0][0].text).toBe(
        'Roll: 1\n#3: Action 2\nAction: TestUser TestUser takes a drink.'
      );
    });

    it('restart', async () => {
      const rollValue: RollValueState = { value: -1, time: Date.now() };

      renderHook(() => usePlayerMove(mockRoomId, rollValue, mockGameBoard));

      await waitFor(() => expect(mockSendMessage).toHaveBeenCalled());

      expect(mockSendMessage.mock.calls[0][0].text).toBe(
        'Restarting Game\n#1: Start\nAction: TestUser Welcome to the game!'
      );
    });

    it('already finished', async () => {
      mockPlayerLocation.current = 3;
      const rollValue: RollValueState = { value: 5, time: Date.now() };

      renderHook(() => usePlayerMove(mockRoomId, rollValue, mockGameBoard));

      await waitFor(() => expect(mockSendMessage).toHaveBeenCalled());

      expect(mockSendMessage.mock.calls[0][0].text).toBe(
        'Already Finished\nRoll: 5\n#4: Finish\nAction: TestUser Game over!'
      );
    });
  });
});
