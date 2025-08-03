import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import usePlayerMove from '../usePlayerMove';
import * as firebaseService from '@/services/firebase';
import { RollValueState } from '@/types/index';
import { TileExport } from '@/types/gameBoard';

// Mock Firebase service
vi.mock('@/services/firebase', () => ({
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
vi.mock('../usePlayerList', () => ({
  default: () => [
    {
      isSelf: true,
      location: 1,
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
    `${displayName} ${action.replace('{player}', displayName).replace('{sub}', displayName)}`,
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
        expect(mockSendMessage).toHaveBeenCalledWith({
          room: mockRoomId,
          user: expect.objectContaining({
            uid: 'test-user',
            displayName: 'TestUser',
          }),
          text: expect.stringContaining('Roll: 2'),
          type: 'actions',
        });
      });
    });

    it('should include tile information in the message', async () => {
      const rollValue: RollValueState = {
        value: 1,
        time: Date.now(),
      };

      renderHook(() => usePlayerMove(mockRoomId, rollValue, mockGameBoard));

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith({
          room: mockRoomId,
          user: expect.any(Object),
          text: expect.stringContaining('#3: Action 2'),
          type: 'actions',
        });
      });
    });

    it('should include processed action description', async () => {
      const rollValue: RollValueState = {
        value: 1,
        time: Date.now(),
      };

      renderHook(() => usePlayerMove(mockRoomId, rollValue, mockGameBoard));

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith({
          room: mockRoomId,
          user: expect.any(Object),
          text: expect.stringContaining('Action: TestUser TestUser takes a drink.'),
          type: 'actions',
        });
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
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSendMessage.mockRejectedValue(new Error('Network error'));

      const rollValue: RollValueState = {
        value: 1,
        time: Date.now(),
      };

      renderHook(() => usePlayerMove(mockRoomId, rollValue, mockGameBoard));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to send message:', expect.any(Error));
      });

      consoleSpy.mockRestore();
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
        expect(mockSendMessage).toHaveBeenCalledWith({
          room: mockRoomId,
          user: expect.any(Object),
          text: expect.stringContaining('#4: Finish'),
          type: 'actions',
        });
      });
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
        expect(mockSendMessage).toHaveBeenCalledWith({
          room: mockRoomId,
          user: expect.any(Object),
          text: expect.stringContaining('Restarting Game'),
          type: 'actions',
        });
      });
    });
  });

  describe('error handling', () => {
    it('should handle missing tile gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const rollValue: RollValueState = {
        value: 10, // Roll that goes beyond game board
        time: Date.now(),
      };

      // Use empty game board to force missing tile error
      renderHook(() => usePlayerMove(mockRoomId, rollValue, []));

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid location or missing tile'),
        expect.any(Boolean)
      );

      consoleSpy.mockRestore();
    });

    it('should validate roll number type', () => {
      const rollValue: RollValueState = {
        value: 'invalid' as any,
        time: Date.now(),
      };

      renderHook(() => usePlayerMove(mockRoomId, rollValue, mockGameBoard));

      // Should not send message for invalid roll type
      expect(mockSendMessage).not.toHaveBeenCalled();
    });
  });
});
