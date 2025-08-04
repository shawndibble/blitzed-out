import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isOnlineMode, isPublicRoom } from '@/helpers/strings';

import { DBGameBoard } from '@/types/gameBoard';
import { Settings } from '@/types/Settings';
import buildGameBoard from '@/services/buildGame';
import { renderHook } from '@testing-library/react';
import { upsertBoard } from '@/stores/gameBoard';
import useGameBoard from '../useGameBoard';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSettings } from '@/stores/settingsStore';

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

vi.mock('@/stores/gameBoard', () => ({
  getActiveBoard: vi.fn(),
  upsertBoard: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      resolvedLanguage: 'en',
    },
  }),
}));

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
    boardUpdated: false,
    selectedActions: {
      teasing: { levels: [1, 2], type: 'sex' },
    },
  };

  const mockBoardResult = {
    board: [
      { title: 'Start', description: 'Game start' },
      { title: 'Generated Action', description: 'Generated action description' },
      { title: 'Finish', description: 'Game finish' },
    ],
    metadata: {
      totalTiles: 3,
      tilesWithContent: 3,
      selectedGroups: ['teasing'],
      missingGroups: [],
      availableTileCount: 5,
    },
  };

  const updateSettingsMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(useLiveQuery).mockReturnValue(mockGameBoard);
    vi.mocked(useSettings).mockReturnValue([mockSettings, updateSettingsMock]);
    vi.mocked(isPublicRoom).mockReturnValue(false);
    vi.mocked(isOnlineMode).mockReturnValue(true);
    vi.mocked(buildGameBoard).mockResolvedValue(mockBoardResult);
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
        newBoard: mockBoardResult.board,
        metadata: mockBoardResult.metadata,
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

    it('should call buildGameBoard with correct parameters', async () => {
      const { result } = renderHook(() => useGameBoard());

      await result.current(mockSettings);

      expect(buildGameBoard).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedActions: expect.objectContaining({
            teasing: { levels: [1, 2], type: 'sex' },
          }),
        }),
        'en',
        'online',
        40
      );
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

      expect(buildGameBoard).toHaveBeenCalledWith(expect.any(Object), 'en', 'online', 40);
    });
  });

  describe('board update conditions', () => {
    it('should update board when boardUpdated flag is true', async () => {
      const { result } = renderHook(() => useGameBoard());

      const settingsWithBoardUpdate = { ...mockSettings, boardUpdated: true };
      await result.current(settingsWithBoardUpdate);

      expect(updateSettingsMock).toHaveBeenCalled();
      expect(upsertBoard).toHaveBeenCalledWith({
        title: 'Test Board',
        tiles: mockBoardResult.board,
      });
    });

    it('should update board when tile count changes', async () => {
      const gameboardWithDifferentTileCount = {
        ...mockGameBoard,
        tiles: [{ title: 'Start', description: 'Game start' }], // Different length
      };
      vi.mocked(useLiveQuery).mockReturnValue(gameboardWithDifferentTileCount);

      const { result } = renderHook(() => useGameBoard());

      await result.current(mockSettings);

      expect(updateSettingsMock).toHaveBeenCalled();
      expect(upsertBoard).toHaveBeenCalled();
    });
  });

  describe('metadata handling', () => {
    it('should log warnings for missing groups', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const resultWithMissingGroups = {
        ...mockBoardResult,
        metadata: {
          ...mockBoardResult.metadata,
          missingGroups: ['nonexistent'],
        },
      };
      vi.mocked(buildGameBoard).mockResolvedValue(resultWithMissingGroups);

      const { result } = renderHook(() => useGameBoard());

      await result.current(mockSettings);

      expect(consoleSpy).toHaveBeenCalledWith('Missing groups for board building:', [
        'nonexistent',
      ]);

      consoleSpy.mockRestore();
    });

    it('should log warnings for low tile content ratio', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const resultWithLowContent = {
        ...mockBoardResult,
        metadata: {
          ...mockBoardResult.metadata,
          tilesWithContent: 1, // Very low content
        },
      };
      vi.mocked(buildGameBoard).mockResolvedValue(resultWithLowContent);

      const { result } = renderHook(() => useGameBoard());

      await result.current(mockSettings);

      expect(consoleSpy).toHaveBeenCalledWith('Low tile content ratio:', expect.any(Object));

      consoleSpy.mockRestore();
    });
  });

  describe('selectedActions merging', () => {
    it('should merge selectedActions from settings and data', async () => {
      const { result } = renderHook(() => useGameBoard());

      const dataWithSelectedActions = {
        ...mockSettings,
        selectedActions: {
          edging: { levels: [1, 2, 3], type: 'sex' as const },
        },
      };

      await result.current(dataWithSelectedActions);

      expect(buildGameBoard).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedActions: expect.objectContaining({
            teasing: { levels: [1, 2], type: 'sex' }, // From settings
            edging: { levels: [1, 2, 3], type: 'sex' }, // From data
          }),
        }),
        'en',
        'online',
        40
      );
    });
  });
});
