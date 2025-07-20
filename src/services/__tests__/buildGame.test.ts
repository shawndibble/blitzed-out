import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import buildGameBoard from '../buildGame';
import { CustomTilePull } from '@/types/customTiles';
import { CustomGroupPull } from '@/types/customGroups';
import { Settings } from '@/types/Settings';

// Mock i18next
vi.mock('i18next', () => ({
  default: {
    t: vi.fn((key: string) => key),
  },
}));

// Mock array helpers
vi.mock('@/helpers/arrays', () => ({
  cycleArray: vi.fn((arr) => arr),
}));

// Mock store functions
vi.mock('@/stores/customGroups', () => ({
  getCustomGroups: vi.fn(),
}));

vi.mock('@/stores/customTiles', () => ({
  getTiles: vi.fn(),
}));

import { getCustomGroups } from '@/stores/customGroups';
import { getTiles } from '@/stores/customTiles';

describe('buildGameBoard service', () => {
  const mockGroups: CustomGroupPull[] = [
    {
      id: '1',
      name: 'teasing',
      label: 'Teasing',
      intensities: [
        { id: '1', label: 'intensityLabels.light', value: 1, isDefault: true },
        { id: '2', label: 'intensityLabels.medium', value: 2, isDefault: true },
        { id: '3', label: 'intensityLabels.intense', value: 3, isDefault: true },
      ],
      type: 'action',
      isDefault: true,
      locale: 'en',
      gameMode: 'online',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'edging',
      label: 'Edging',
      intensities: [
        { id: '1', label: 'intensityLabels.light', value: 1, isDefault: true },
        { id: '2', label: 'intensityLabels.medium', value: 2, isDefault: true },
        { id: '3', label: 'intensityLabels.intense', value: 3, isDefault: true },
      ],
      type: 'action',
      isDefault: true,
      locale: 'en',
      gameMode: 'online',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockTiles: CustomTilePull[] = [
    {
      id: 1,
      group: 'teasing',
      intensity: 1,
      action: 'Light teasing action 1',
      tags: [],
      isEnabled: 1,
      isCustom: 0,
      locale: 'en',
      gameMode: 'online',
    },
    {
      id: 2,
      group: 'teasing',
      intensity: 2,
      action: 'Medium teasing action 1',
      tags: [],
      isEnabled: 1,
      isCustom: 0,
      locale: 'en',
      gameMode: 'online',
    },
    {
      id: 3,
      group: 'edging',
      intensity: 1,
      action: 'Light edging action 1',
      tags: [],
      isEnabled: 1,
      isCustom: 0,
      locale: 'en',
      gameMode: 'online',
    },
  ];

  const mockSettings: Settings = {
    gameMode: 'online',
    boardUpdated: false,
    room: 'TEST',
    role: 'sub',
    difficulty: 'normal',
    finishRange: [33, 66],
    selectedActions: {
      teasing: { level: 2, type: 'action' },
      edging: { level: 1, type: 'action' },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(getCustomGroups).mockResolvedValue(mockGroups);
    vi.mocked(getTiles).mockResolvedValue(mockTiles);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Basic board building', () => {
    it('should build a board with start and finish tiles', async () => {
      const result = await buildGameBoard(mockSettings, 'en', 'online', 5);

      expect(result.board).toBeDefined();
      expect(result.board.length).toBe(7); // 5 + start + finish
      expect(result.board[0].title).toBe('start');
      expect(result.board[result.board.length - 1].title).toBe('finish');
    });

    it('should include metadata about the board build', async () => {
      const result = await buildGameBoard(mockSettings, 'en', 'online', 5);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.totalTiles).toBe(7);
      expect(result.metadata.selectedGroups).toEqual(['teasing', 'edging']);
      expect(result.metadata.missingGroups).toEqual([]);
      expect(result.metadata.availableTileCount).toBe(3);
    });

    it('should handle empty selected actions', async () => {
      const emptySettings: Settings = {
        ...mockSettings,
        selectedActions: {},
      };

      const result = await buildGameBoard(emptySettings, 'en', 'online', 5);

      expect(result.board.length).toBe(2); // Just start and finish
      expect(result.metadata.selectedGroups).toEqual([]);
      expect(result.metadata.tilesWithContent).toBe(2); // Start and finish tiles
    });
  });

  describe('Error handling', () => {
    it('should handle store errors gracefully', async () => {
      vi.mocked(getCustomGroups).mockRejectedValue(new Error('Database error'));

      const result = await buildGameBoard(mockSettings, 'en', 'online', 5);

      expect(result.board.length).toBe(2); // Empty board with start/finish
      expect(result.metadata.totalTiles).toBe(2);
      expect(result.metadata.selectedGroups).toEqual([]);
    });

    it('should handle missing groups', async () => {
      const settingsWithMissingGroup: Settings = {
        ...mockSettings,
        selectedActions: {
          teasing: { level: 2, type: 'action' },
          nonexistent: { level: 1, type: 'action' },
        },
      };

      const result = await buildGameBoard(settingsWithMissingGroup, 'en', 'online', 5);

      expect(result.metadata.missingGroups).toContain('nonexistent');
      expect(result.metadata.selectedGroups).toEqual(['teasing', 'nonexistent']);
    });
  });

  describe('Role filtering', () => {
    it('should filter tiles by role', async () => {
      const tilesWithRoles: CustomTilePull[] = [
        {
          id: 1,
          group: 'teasing',
          intensity: 1,
          action: 'Action for {sub} only',
          tags: [],
          isEnabled: 1,
          isCustom: 0,
          locale: 'en',
          gameMode: 'online',
        },
        {
          id: 2,
          group: 'teasing',
          intensity: 1,
          action: 'Action for {dom} only',
          tags: [],
          isEnabled: 1,
          isCustom: 0,
          locale: 'en',
          gameMode: 'online',
        },
      ];

      vi.mocked(getTiles).mockResolvedValue(tilesWithRoles);

      const subSettings: Settings = {
        ...mockSettings,
        role: 'sub',
      };

      const result = await buildGameBoard(subSettings, 'en', 'online', 5);

      // Should only use tiles appropriate for sub role
      expect(result.metadata.availableTileCount).toBe(1);
    });
  });

  describe('Intensity calculation', () => {
    it('should respect user-selected intensity levels', async () => {
      const settingsWithHighIntensity: Settings = {
        ...mockSettings,
        selectedActions: {
          teasing: { level: 3, type: 'action' }, // High intensity
        },
      };

      const result = await buildGameBoard(settingsWithHighIntensity, 'en', 'online', 5);

      expect(result.board.length).toBe(7);
      expect(result.metadata.selectedGroups).toEqual(['teasing']);
    });

    it('should handle difficulty settings', async () => {
      const acceleratedSettings: Settings = {
        ...mockSettings,
        difficulty: 'accelerated',
      };

      const result = await buildGameBoard(acceleratedSettings, 'en', 'online', 5);

      expect(result.board.length).toBe(7);
      expect(result.metadata.totalTiles).toBe(7);
    });
  });
});
