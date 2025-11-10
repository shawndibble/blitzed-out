import { describe, expect, it, vi, beforeEach } from 'vitest';

import { CustomGroupPull } from '@/types/customGroups';
import { CustomTilePull } from '@/types/customTiles';
import { Settings } from '@/types/Settings';
import buildGameBoard from '../buildGame';
import { getCustomGroups } from '@/stores/customGroups';
import { getTiles } from '@/stores/customTiles';

vi.mock('i18next', () => ({
  default: {
    t: vi.fn((key: string) => key),
  },
}));

vi.mock('@/helpers/arrays', () => ({
  cycleArray: vi.fn((arr) => arr),
  shuffleArray: vi.fn((arr) => [...arr]),
}));

vi.mock('@/stores/customGroups', () => ({
  getCustomGroups: vi.fn(),
}));

vi.mock('@/stores/customTiles', () => ({
  getTiles: vi.fn(),
}));

describe('buildGameBoard service', () => {
  const createGroup = (
    id: string,
    name: string,
    type: 'solo' | 'foreplay' | 'sex' | 'consumption' = 'solo'
  ): CustomGroupPull => ({
    id,
    name,
    label: name,
    intensities: [
      { id: '1', label: 'intensityLabels.light', value: 1, isDefault: true },
      { id: '2', label: 'intensityLabels.medium', value: 2, isDefault: true },
      { id: '3', label: 'intensityLabels.intense', value: 3, isDefault: true },
    ],
    type,
    isDefault: true,
    locale: 'en',
    gameMode: 'online',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const createTile = (
    id: number,
    groupId: string,
    intensity: number,
    action: string,
    isEnabled = 1
  ): CustomTilePull => ({
    id,
    group_id: groupId,
    intensity,
    action,
    tags: [],
    isEnabled,
    isCustom: 0,
  });

  const baseSettings: Settings = {
    boardUpdated: false,
    room: 'TEST',
    role: 'sub',
    gameMode: 'online',
    finishRange: [33, 66],
    selectedActions: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Board structure', () => {
    it('should create board with start and finish tiles', async () => {
      const groups = [createGroup('g1', 'test')];
      const tiles = [createTile(1, 'g1', 1, 'Action 1')];

      vi.mocked(getCustomGroups).mockResolvedValue(groups);
      vi.mocked(getTiles).mockResolvedValue(tiles);

      const settings = {
        ...baseSettings,
        selectedActions: { test: { levels: [1], type: 'sex' } },
      };

      const result = await buildGameBoard(settings, 'en', 'online', 3);

      expect(result.board).toHaveLength(5);
      expect(result.board[0].title).toBe('start');
      expect(result.board[result.board.length - 1].title).toBe('finish');
    });

    it('should return only start and finish when no actions selected', async () => {
      vi.mocked(getCustomGroups).mockResolvedValue([]);
      vi.mocked(getTiles).mockResolvedValue([]);

      const result = await buildGameBoard(baseSettings, 'en', 'online', 3);

      expect(result.board).toHaveLength(2);
      expect(result.metadata.tilesWithContent).toBe(2);
    });
  });

  describe('Metadata', () => {
    it('should include correct metadata', async () => {
      const groups = [createGroup('g1', 'group1'), createGroup('g2', 'group2')];
      const tiles = [createTile(1, 'g1', 1, 'Action 1'), createTile(2, 'g2', 1, 'Action 2')];

      vi.mocked(getCustomGroups).mockResolvedValue(groups);
      vi.mocked(getTiles).mockResolvedValue(tiles);

      const settings = {
        ...baseSettings,
        selectedActions: {
          group1: { levels: [1], type: 'sex' },
          group2: { levels: [1], type: 'sex' },
        },
      };

      const result = await buildGameBoard(settings, 'en', 'online', 3);

      expect(result.metadata.totalTiles).toBe(5);
      expect(result.metadata.selectedGroups).toEqual(['group1', 'group2']);
      expect(result.metadata.availableTileCount).toBe(2);
    });
  });

  describe('Role filtering', () => {
    it.each([
      ['sub', '{sub}', 1],
      ['dom', '{dom}', 1],
      ['sub', '{dom}', 0],
      ['dom', '{sub}', 0],
    ])(
      'should filter %s role tiles with %s placeholder correctly',
      async (role, placeholder, expectedCount) => {
        const groups = [createGroup('g1', 'roleGroup', 'foreplay')];
        const tiles = [createTile(1, 'g1', 1, `Action for ${placeholder}`)];

        vi.mocked(getCustomGroups).mockResolvedValue(groups);
        vi.mocked(getTiles).mockResolvedValue(tiles);

        const settings = {
          ...baseSettings,
          role,
          selectedActions: { roleGroup: { levels: [1], type: 'sex' } },
        };

        const result = await buildGameBoard(settings, 'en', 'online', 2);

        expect(result.metadata.availableTileCount).toBe(expectedCount);
      }
    );

    it('should include solo and consumption types for all roles', async () => {
      const groups = [
        createGroup('g1', 'solo', 'solo'),
        createGroup('g2', 'consume', 'consumption'),
      ];
      const tiles = [
        createTile(1, 'g1', 1, 'Solo action'),
        createTile(2, 'g2', 1, 'Consume action'),
      ];

      vi.mocked(getCustomGroups).mockResolvedValue(groups);
      vi.mocked(getTiles).mockResolvedValue(tiles);

      const settings = {
        ...baseSettings,
        role: 'vers',
        selectedActions: {
          solo: { levels: [1], type: 'sex' },
          consume: { levels: [1], type: 'consumption' },
        },
      };

      const result = await buildGameBoard(settings, 'en', 'online', 2);

      expect(result.metadata.availableTileCount).toBe(2);
    });

    it('should filter vers role tiles requiring both placeholders', async () => {
      const groups = [createGroup('g1', 'mix', 'sex')];
      const tiles = [
        createTile(1, 'g1', 1, 'Action for {sub} and {dom}'),
        createTile(2, 'g1', 1, 'Action for {sub} only'),
      ];

      vi.mocked(getCustomGroups).mockResolvedValue(groups);
      vi.mocked(getTiles).mockResolvedValue(tiles);

      const settings = {
        ...baseSettings,
        role: 'vers',
        selectedActions: { mix: { levels: [1], type: 'sex' } },
      };

      const result = await buildGameBoard(settings, 'en', 'online', 2);

      expect(result.metadata.availableTileCount).toBe(1);
    });
  });

  describe('Intensity handling', () => {
    it('should use tiles matching selected intensity levels', async () => {
      const groups = [createGroup('g1', 'test')];
      const tiles = [
        createTile(1, 'g1', 1, 'Light'),
        createTile(2, 'g1', 2, 'Medium'),
        createTile(3, 'g1', 3, 'Intense'),
      ];

      vi.mocked(getCustomGroups).mockResolvedValue(groups);
      vi.mocked(getTiles).mockResolvedValue(tiles);

      const settings = {
        ...baseSettings,
        selectedActions: { test: { levels: [1, 3], type: 'sex' } },
      };

      const result = await buildGameBoard(settings, 'en', 'online', 2);

      expect(result.board).toHaveLength(4);
    });

    it('should fallback to higher intensity when target unavailable', async () => {
      const groups = [createGroup('g1', 'test')];
      const tiles = [createTile(1, 'g1', 2, 'Medium only')];

      vi.mocked(getCustomGroups).mockResolvedValue(groups);
      vi.mocked(getTiles).mockResolvedValue(tiles);

      const settings = {
        ...baseSettings,
        selectedActions: { test: { levels: [1], type: 'sex' } },
      };

      const result = await buildGameBoard(settings, 'en', 'online', 2);

      expect(result.metadata.availableTileCount).toBe(1);
      expect(result.board.length).toBeGreaterThanOrEqual(2);
    });

    it('should fallback to lower intensity when target unavailable', async () => {
      const groups = [createGroup('g1', 'test')];
      const tiles = [createTile(1, 'g1', 1, 'Light'), createTile(2, 'g1', 3, 'Intense')];

      vi.mocked(getCustomGroups).mockResolvedValue(groups);
      vi.mocked(getTiles).mockResolvedValue(tiles);

      const settings = {
        ...baseSettings,
        selectedActions: { test: { levels: [2], type: 'sex' } },
      };

      const result = await buildGameBoard(settings, 'en', 'online', 2);

      expect(result.metadata.availableTileCount).toBe(2);
    });

    it('should handle empty group gracefully', async () => {
      const groups = [createGroup('g1', 'empty')];
      const tiles: CustomTilePull[] = [];

      vi.mocked(getCustomGroups).mockResolvedValue(groups);
      vi.mocked(getTiles).mockResolvedValue(tiles);

      const settings = {
        ...baseSettings,
        selectedActions: { empty: { levels: [1], type: 'sex' } },
      };

      const result = await buildGameBoard(settings, 'en', 'online', 2);

      expect(result.board).toHaveLength(2);
      expect(result.metadata.tilesWithContent).toBe(2);
    });

    it('should filter out disabled tiles', async () => {
      const groups = [createGroup('g1', 'test')];
      const tiles = [createTile(1, 'g1', 1, 'Disabled', 0), createTile(2, 'g1', 1, 'Enabled', 1)];

      vi.mocked(getCustomGroups).mockResolvedValue(groups);
      vi.mocked(getTiles).mockResolvedValue(tiles);

      const settings = {
        ...baseSettings,
        selectedActions: { test: { levels: [1], type: 'sex' } },
      };

      const result = await buildGameBoard(settings, 'en', 'online', 2);

      expect(result.metadata.availableTileCount).toBe(2);
    });
  });

  describe('Error handling', () => {
    it('should return empty board on error', async () => {
      vi.mocked(getCustomGroups).mockRejectedValue(new Error('DB error'));

      const result = await buildGameBoard(baseSettings, 'en', 'online', 3);

      expect(result.board).toHaveLength(2);
      expect(result.metadata.availableTileCount).toBe(0);
    });
  });
});
