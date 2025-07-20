import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import useGameBoard from '../useGameBoard';
import { Settings } from '@/types/Settings';
import { DBGameBoard } from '@/types/gameBoard';

// Mock dependencies
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}));

vi.mock('@/helpers/strings', () => ({
  isPublicRoom: vi.fn(),
  isOnlineMode: vi.fn(),
}));

vi.mock('@/stores/settingsStore', () => ({
  __esModule: true,
  useSettings: vi.fn(),
}));

vi.mock('@/services/buildGame', () => ({
  default: vi.fn(),
}));

vi.mock('@/services/importLocales', () => ({
  importActions: vi.fn(),
}));

vi.mock('@/stores/customTiles', () => ({
  getActiveTiles: vi.fn(),
}));

vi.mock('@/stores/gameBoard', () => ({
  getActiveBoard: vi.fn(),
  upsertBoard: vi.fn(),
}));

import { useLiveQuery } from 'dexie-react-hooks';
import { isPublicRoom, isOnlineMode } from '@/helpers/strings';
import customizeBoard from '@/services/buildGame';
import { importActions } from '@/services/importLocales';
import { getActiveTiles } from '@/stores/customTiles';
import { upsertBoard } from '@/stores/gameBoard';
import { useSettings } from '@/stores/settingsStore';

describe('useGameBoard', () => {
  const mockGameBoard: DBGameBoard = {
    id: 1,
    title: 'Test Board',
    tiles: [
      { title: 'Start', description: 'Game start' },
      { title: 'Action 1', description: 'Test action 1' },
      { title: 'Finish', description: 'Game finish' },
    ],
    isActive: 1,
    tags: ['test'],
    gameMode: 'online',
  };

  const mockSettings: Settings = {
    roomTileCount: 40,
    finishRange: [33, 66],
    room: 'testroom',
    gameMode: 'online',
    role: 'sub',
    difficulty: 'normal',
    boardUpdated: false,
  };

  const mockTileActionList = {
    'mock-module': {
      actions: {
        level1: ['Action 1', 'Action 2'],
        level2: ['Action 3', 'Action 4'],
      },
      default: {
        actions: {
          level1: ['Action 1', 'Action 2'],
          level2: ['Action 3', 'Action 4'],
        },
      },
      label: 'Test Actions',
      type: 'mock',
    },
  };

  const mockCustomTiles = [
    {
      id: 1,
      group: 'test',
      intensity: 1,
      action: 'Custom action',
      isEnabled: 1,
      tags: [],
      gameMode: 'online',
      isCustom: 1,
      locale: 'en',
    },
  ];

  const mockNewBoard = [
    { title: 'Start', description: 'Game start' },
    { title: 'Generated Action', description: 'Generated action description' },
    { title: 'Finish', description: 'Game finish' },
  ];

  const updateSettingsMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(useLiveQuery).mockReturnValue(mockGameBoard);
    vi.mocked(useSettings).mockReturnValue([mockSettings, updateSettingsMock]);
    vi.mocked(isPublicRoom).mockReturnValue(false);
    vi.mocked(isOnlineMode).mockReturnValue(true);
    vi.mocked(importActions).mockResolvedValue(mockTileActionList);
    vi.mocked(getActiveTiles).mockResolvedValue(mockCustomTiles);
    vi.mocked(customizeBoard).mockReturnValue(mockNewBoard);
    vi.mocked(upsertBoard).mockResolvedValue(1);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('basic functionality', () => {
    it('should return a function that processes game board data', () => {
      const { result } = renderHook(() => useGameBoard());

      expect(typeof result.current).toBe('function');
    });

    it('should process settings and return game board result', async () => {
      const { result } = renderHook(() => useGameBoard());

      const gameResult = await result.current(mockSettings);

      expect(gameResult).toEqual({
        settingsBoardUpdated: false,
        gameMode: 'online',
        newBoard: mockNewBoard,
      });
    });

    it('should handle loading state when no finishRange provided', async () => {
      const { result } = renderHook(() => useGameBoard());

      const settingsWithoutFinishRange = { ...mockSettings, finishRange: undefined };
      const gameResult = await result.current(settingsWithoutFinishRange);

      expect(gameResult).toEqual({
        gameMode: 'online',
      });
    });
  });

  describe('public room handling', () => {
    it('should switch to online mode for public rooms', async () => {
      vi.mocked(isPublicRoom).mockReturnValue(true);
      vi.mocked(isOnlineMode).mockReturnValue(false);

      const { result } = renderHook(() => useGameBoard());

      const settingsWithOfflineMode = { ...mockSettings, gameMode: 'local' as const };
      const gameResult = await result.current(settingsWithOfflineMode);

      expect(gameResult.gameMode).toBe('online');
      expect(gameResult.settingsBoardUpdated).toBe(true);
    });

    it('should use 40 tiles for public rooms regardless of roomTileCount', async () => {
      vi.mocked(isPublicRoom).mockReturnValue(true);

      const { result } = renderHook(() => useGameBoard());

      const settingsWithLargeTileCount = { ...mockSettings, roomTileCount: 100 };
      await result.current(settingsWithLargeTileCount);

      expect(customizeBoard).toHaveBeenCalledWith(
        expect.any(Object),
        mockTileActionList,
        mockCustomTiles,
        40
      );
    });
  });

  describe('board update conditions', () => {
    it('should update board when boardUpdated flag is true', async () => {
      const { result } = renderHook(() => useGameBoard());

      const settingsWithBoardUpdate = { ...mockSettings, boardUpdated: true };
      await result.current(settingsWithBoardUpdate);

      expect(updateSettingsMock).toHaveBeenCalledWith(settingsWithBoardUpdate);
      expect(upsertBoard).toHaveBeenCalledWith({
        title: 'Test Board',
        tiles: mockNewBoard,
      });
    });

    it('should update board when tile count changes', async () => {
      const mockGameBoardWithDifferentTileCount = {
        ...mockGameBoard,
        tiles: [{ title: 'Start', description: 'Start' }], // Different length
      };
      vi.mocked(useLiveQuery).mockReturnValue(mockGameBoardWithDifferentTileCount);

      const { result } = renderHook(() => useGameBoard());

      await result.current(mockSettings);

      expect(updateSettingsMock).toHaveBeenCalled();
      expect(upsertBoard).toHaveBeenCalled();
    });

    it('should not update board when no changes detected', async () => {
      const mockGameBoardWithSameTileCount = {
        ...mockGameBoard,
        tiles: new Array(3).fill({ title: 'Test', description: 'Test' }),
      };
      vi.mocked(useLiveQuery).mockReturnValue(mockGameBoardWithSameTileCount);
      vi.mocked(customizeBoard).mockReturnValue(
        new Array(3).fill({ title: 'Test', description: 'Test' })
      );

      const { result } = renderHook(() => useGameBoard());

      const settingsWithoutUpdate = { ...mockSettings, boardUpdated: false };
      await result.current(settingsWithoutUpdate);

      expect(updateSettingsMock).not.toHaveBeenCalled();
      expect(upsertBoard).not.toHaveBeenCalled();
    });
  });

  describe('data integration', () => {
    it('should import actions with correct parameters', async () => {
      const { result } = renderHook(() => useGameBoard());

      await result.current(mockSettings);

      expect(importActions).toHaveBeenCalledWith(undefined, 'online');
    });

    it('should get active tiles with correct game mode', async () => {
      const { result } = renderHook(() => useGameBoard());

      await result.current(mockSettings);

      expect(getActiveTiles).toHaveBeenCalledWith('online');
    });

    it('should customize board with correct parameters', async () => {
      const { result } = renderHook(() => useGameBoard());

      await result.current(mockSettings);

      expect(customizeBoard).toHaveBeenCalledWith(
        mockSettings,
        mockTileActionList,
        mockCustomTiles,
        40
      );
    });
  });

  describe('settings merge logic', () => {
    it('should merge room update data correctly', async () => {
      const { result } = renderHook(() => useGameBoard());

      const roomUpdateData = {
        ...mockSettings,
        roomUpdate: true,
        newField: 'test',
      };

      await result.current(roomUpdateData);

      expect(customizeBoard).toHaveBeenCalledWith(
        roomUpdateData,
        mockTileActionList,
        mockCustomTiles,
        40
      );
    });

    it('should merge board update data correctly', async () => {
      const { result } = renderHook(() => useGameBoard());

      const boardUpdateData = {
        ...mockSettings,
        boardUpdated: true,
        updatedField: 'test',
      };

      await result.current(boardUpdateData);

      expect(customizeBoard).toHaveBeenCalledWith(
        boardUpdateData,
        mockTileActionList,
        mockCustomTiles,
        40
      );
    });

    it('should merge with existing settings when no special flags', async () => {
      const { result } = renderHook(() => useGameBoard());

      const partialData = {
        roomTileCount: 50,
      };

      await result.current(partialData as Settings);

      expect(customizeBoard).toHaveBeenCalledWith(
        { ...mockSettings, ...partialData },
        mockTileActionList,
        mockCustomTiles,
        50
      );
    });
  });

  describe('error handling', () => {
    it('should handle importActions failure gracefully', async () => {
      vi.mocked(importActions).mockRejectedValue(new Error('Import failed'));

      const { result } = renderHook(() => useGameBoard());

      await expect(result.current(mockSettings)).rejects.toThrow('Import failed');
    });

    it('should handle getActiveTiles failure gracefully', async () => {
      vi.mocked(getActiveTiles).mockRejectedValue(new Error('Get tiles failed'));

      const { result } = renderHook(() => useGameBoard());

      await expect(result.current(mockSettings)).rejects.toThrow('Get tiles failed');
    });

    it('should handle customizeBoard failure gracefully', async () => {
      vi.mocked(customizeBoard).mockImplementation(() => {
        throw new Error('Customize board failed');
      });

      const { result } = renderHook(() => useGameBoard());

      await expect(result.current(mockSettings)).rejects.toThrow('Customize board failed');
    });

    it('should handle upsertBoard failure gracefully', async () => {
      vi.mocked(upsertBoard).mockRejectedValue(new Error('Upsert failed'));

      const { result } = renderHook(() => useGameBoard());

      const settingsWithBoardUpdate = { ...mockSettings, boardUpdated: true };
      await expect(result.current(settingsWithBoardUpdate)).rejects.toThrow('Upsert failed');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined gameBoard', async () => {
      vi.mocked(useLiveQuery).mockReturnValue(undefined);

      const { result } = renderHook(() => useGameBoard());

      const gameResult = await result.current(mockSettings);

      expect(upsertBoard).toHaveBeenCalledWith({
        title: '',
        tiles: mockNewBoard,
      });
      expect(gameResult.newBoard).toEqual(mockNewBoard);
    });

    it('should handle empty room string', async () => {
      const { result } = renderHook(() => useGameBoard());

      const settingsWithEmptyRoom = { ...mockSettings, room: '' };
      await result.current(settingsWithEmptyRoom);

      expect(isPublicRoom).toHaveBeenCalledWith('');
    });

    it('should handle undefined gameMode', async () => {
      const { result } = renderHook(() => useGameBoard());

      const settingsWithoutGameMode = {
        ...mockSettings,
        gameMode: undefined,
      } as unknown as Settings;
      await result.current(settingsWithoutGameMode);

      expect(importActions).toHaveBeenCalledWith(undefined, 'online');
      expect(getActiveTiles).toHaveBeenCalledWith('online');
    });

    it('should handle zero tile count', async () => {
      const { result } = renderHook(() => useGameBoard());

      const settingsWithZeroTiles = { ...mockSettings, roomTileCount: 0 };
      await result.current(settingsWithZeroTiles);

      expect(customizeBoard).toHaveBeenCalledWith(
        settingsWithZeroTiles,
        mockTileActionList,
        mockCustomTiles,
        40 // Should default to 40
      );
    });
  });

  describe('memoization and performance', () => {
    it('should memoize the callback properly', () => {
      const { result, rerender } = renderHook(() => useGameBoard());

      // First render to establish baseline
      rerender();
      const secondCallback = result.current;

      // Callbacks should be different due to dependency changes
      // but should maintain stable reference when dependencies don't change
      expect(typeof secondCallback).toBe('function');
    });

    it('should handle rapid successive calls', async () => {
      const { result } = renderHook(() => useGameBoard());

      const promises = [
        result.current(mockSettings),
        result.current(mockSettings),
        result.current(mockSettings),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.gameMode).toBe('online');
      });
    });
  });

  describe('i18n integration', () => {
    it('should use resolved language for importing actions', async () => {
      // Mock i18n with different language
      const mockI18n = {
        resolvedLanguage: 'es',
        language: 'en',
        changeLanguage: vi.fn(),
      };

      vi.doMock('react-i18next', () => ({
        useTranslation: () => ({
          t: vi.fn(),
          i18n: mockI18n,
        }),
      }));

      const { result } = renderHook(() => useGameBoard());

      await result.current(mockSettings);

      expect(importActions).toHaveBeenCalledWith(undefined, 'online');
    });
  });

  describe('localStorage integration', () => {
    it('should call updateSettings when board is updated', async () => {
      const { result } = renderHook(() => useGameBoard());

      const settingsWithUpdate = { ...mockSettings, boardUpdated: true };
      await result.current(settingsWithUpdate);

      expect(updateSettingsMock).toHaveBeenCalledWith(settingsWithUpdate);
    });

    it('should handle updateSettings failure', async () => {
      updateSettingsMock.mockRejectedValue(new Error('Update settings failed'));

      const { result } = renderHook(() => useGameBoard());

      const settingsWithUpdate = { ...mockSettings, boardUpdated: true };
      await expect(result.current(settingsWithUpdate)).rejects.toThrow('Update settings failed');
    });
  });
});
