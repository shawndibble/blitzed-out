import { describe, expect, it } from 'vitest';

import { CustomGroupPull } from '@/types/customGroups';
import { CustomTilePull } from '@/types/customTiles';
import { PlayerRole, Settings } from '@/types/Settings';
import { ActionEntry } from '@/types';
import buildGameBoard, { BoardDataSource, buildBoardFromData } from '../buildGame';

const createActionEntry = (
  levels: number[],
  type: 'solo' | 'foreplay' | 'sex' | 'consumption'
): ActionEntry => ({ levels, type });

/** Deterministic linear congruential generator for reproducible shuffles. */
const lcg = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

const identity = (key: string): string => key;

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

// Build the pure core with deterministic randomness and a pass-through translator.
const build = (
  groups: CustomGroupPull[],
  tiles: CustomTilePull[],
  settings: Settings,
  tileCount: number,
  seed = 42
) =>
  buildBoardFromData(groups, tiles, settings, tileCount, {
    translate: identity,
    random: lcg(seed),
  });

describe('buildBoardFromData', () => {
  describe('Board structure', () => {
    it('should create board with start and finish tiles', async () => {
      const groups = [createGroup('g1', 'test')];
      const tiles = [createTile(1, 'g1', 1, 'Action 1')];

      const settings = {
        ...baseSettings,
        selectedActions: { test: createActionEntry([1], 'sex') },
      };

      const result = await build(groups, tiles, settings, 3);

      expect(result.board).toHaveLength(5);
      expect(result.board[0].title).toBe('start');
      expect(result.board[result.board.length - 1].title).toBe('finish');
    });

    it('should return only start and finish when no actions selected', async () => {
      const result = await build([], [], baseSettings, 3);

      expect(result.board).toHaveLength(2);
      expect(result.metadata.tilesWithContent).toBe(2);
    });

    it('should emit the finish-range probability string', async () => {
      const groups = [createGroup('g1', 'test')];
      const tiles = [createTile(1, 'g1', 1, 'Action 1')];
      const settings = {
        ...baseSettings,
        finishRange: [33, 66] as [number, number],
        selectedActions: { test: createActionEntry([1], 'sex') },
      };

      const result = await build(groups, tiles, settings, 3);
      const finishTile = result.board[result.board.length - 1];

      expect(finishTile.title).toBe('finish');
      expect(finishTile.description).toBe('noCum 33%\r\nruined 33%\r\ncum 34%');
    });
  });

  describe('Configurable board size', () => {
    // Board size is user-configurable via roomTileCount (UI offers 20–70); the
    // built board must always be tileCount + 2 (start + finish) regardless of size.
    it.each([20, 30, 40, 50, 60, 70])(
      'builds a board of %i playable tiles plus start/finish',
      async (size) => {
        const groups = [createGroup('g1', 'sized')];
        // A single role-compatible tile suffices — the shuffle bag repeats to fill.
        const tiles = [createTile(1, 'g1', 1, 'Action for {sub}')];
        const settings = {
          ...baseSettings,
          role: 'sub' as PlayerRole,
          selectedActions: { sized: createActionEntry([1], 'sex') },
        };

        const result = await build(groups, tiles, settings, size);

        expect(result.board).toHaveLength(size + 2);
        expect(result.board[0].title).toBe('start');
        expect(result.board[result.board.length - 1].title).toBe('finish');
        expect(result.metadata.totalTiles).toBe(size + 2);
      }
    );
  });

  describe('Metadata', () => {
    it('should include correct metadata', async () => {
      const groups = [createGroup('g1', 'group1'), createGroup('g2', 'group2')];
      const tiles = [createTile(1, 'g1', 1, 'Action 1'), createTile(2, 'g2', 1, 'Action 2')];

      const settings = {
        ...baseSettings,
        selectedActions: {
          group1: createActionEntry([1], 'sex'),
          group2: createActionEntry([1], 'sex'),
        },
      };

      const result = await build(groups, tiles, settings, 3);

      expect(result.metadata.totalTiles).toBe(5);
      expect(result.metadata.selectedGroups).toEqual(['group1', 'group2']);
      expect(result.metadata.availableTileCount).toBe(2);
    });

    it('should populate missingGroups when a selected group is absent', async () => {
      const groups = [createGroup('g1', 'present')];
      const tiles = [createTile(1, 'g1', 1, 'Action 1')];

      const settings = {
        ...baseSettings,
        selectedActions: {
          present: createActionEntry([1], 'sex'),
          absent: createActionEntry([1], 'sex'),
        },
      };

      const result = await build(groups, tiles, settings, 3);

      expect(result.metadata.selectedGroups).toEqual(['present', 'absent']);
      expect(result.metadata.missingGroups).toEqual(['absent']);
    });
  });

  describe('Role filtering', () => {
    it.each<[PlayerRole, string, number]>([
      ['sub', '{sub}', 1],
      ['dom', '{dom}', 1],
      ['sub', '{dom}', 0],
      ['dom', '{sub}', 0],
    ])(
      'should filter %s role tiles with %s placeholder correctly',
      async (role, placeholder, expectedCount) => {
        const groups = [createGroup('g1', 'roleGroup', 'foreplay')];
        const tiles = [createTile(1, 'g1', 1, `Action for ${placeholder}`)];

        const settings: Settings = {
          ...baseSettings,
          role,
          selectedActions: { roleGroup: createActionEntry([1], 'sex') },
        };

        const result = await build(groups, tiles, settings, 2);

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

      const settings: Settings = {
        ...baseSettings,
        role: 'vers',
        selectedActions: {
          solo: createActionEntry([1], 'sex'),
          consume: createActionEntry([1], 'consumption'),
        },
      };

      const result = await build(groups, tiles, settings, 2);

      expect(result.metadata.availableTileCount).toBe(2);
    });

    it('should filter vers role tiles requiring both placeholders', async () => {
      const groups = [createGroup('g1', 'mix', 'sex')];
      const tiles = [
        createTile(1, 'g1', 1, 'Action for {sub} and {dom}'),
        createTile(2, 'g1', 1, 'Action for {sub} only'),
      ];

      const settings: Settings = {
        ...baseSettings,
        role: 'vers',
        selectedActions: { mix: createActionEntry([1], 'sex') },
      };

      const result = await build(groups, tiles, settings, 2);

      expect(result.metadata.availableTileCount).toBe(1);
    });

    it('should include neutral foreplay tiles for vers role', async () => {
      const groups = [createGroup('g1', 'confessions', 'foreplay')];
      const tiles = [createTile(1, 'g1', 1, 'Answer a confession prompt')];

      const settings: Settings = {
        ...baseSettings,
        role: 'vers',
        selectedActions: { confessions: createActionEntry([1], 'foreplay') },
      };

      const result = await build(groups, tiles, settings, 2);

      expect(result.metadata.availableTileCount).toBe(1);
      expect(result.board[1].title).toBe('confessions');
      expect(result.board[1].description).toBe('Answer a confession prompt');
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

      const settings = {
        ...baseSettings,
        selectedActions: { test: createActionEntry([1, 3], 'sex') },
      };

      const result = await build(groups, tiles, settings, 2);

      expect(result.board).toHaveLength(4);
    });

    it('should progress intensity from low (first tile) to high (last tile)', async () => {
      const groups = [createGroup('g1', 'test')];
      const tiles = [
        createTile(1, 'g1', 1, 'I1'),
        createTile(2, 'g1', 2, 'I2'),
        createTile(3, 'g1', 3, 'I3'),
      ];

      const settings = {
        ...baseSettings,
        selectedActions: { test: createActionEntry([1, 2, 3], 'sex') },
      };

      const result = await build(groups, tiles, settings, 12);
      const content = result.board.slice(1, -1);

      expect(content[0].description).toBe('I1');
      expect(content[content.length - 1].description).toBe('I3');
    });

    it('should fallback to higher intensity when target unavailable', async () => {
      const groups = [createGroup('g1', 'test')];
      const tiles = [createTile(1, 'g1', 2, 'Medium only')];

      const settings = {
        ...baseSettings,
        selectedActions: { test: createActionEntry([1], 'sex') },
      };

      const result = await build(groups, tiles, settings, 2);

      expect(result.metadata.availableTileCount).toBe(1);
      expect(result.board.length).toBeGreaterThanOrEqual(2);
    });

    it('should fallback to lower intensity when target unavailable', async () => {
      const groups = [createGroup('g1', 'test')];
      const tiles = [createTile(1, 'g1', 1, 'Light'), createTile(2, 'g1', 3, 'Intense')];

      const settings = {
        ...baseSettings,
        selectedActions: { test: createActionEntry([2], 'sex') },
      };

      const result = await build(groups, tiles, settings, 2);

      expect(result.metadata.availableTileCount).toBe(2);
    });

    it('should handle empty group gracefully', async () => {
      const groups = [createGroup('g1', 'empty')];
      const tiles: CustomTilePull[] = [];

      const settings = {
        ...baseSettings,
        selectedActions: { empty: createActionEntry([1], 'sex') },
      };

      const result = await build(groups, tiles, settings, 2);

      expect(result.board).toHaveLength(2);
      expect(result.metadata.tilesWithContent).toBe(2);
    });

    it('should pass through tiles regardless of isEnabled (filtering happens upstream)', async () => {
      const groups = [createGroup('g1', 'test')];
      const tiles = [createTile(1, 'g1', 1, 'Disabled', 0), createTile(2, 'g1', 1, 'Enabled', 1)];

      const settings = {
        ...baseSettings,
        selectedActions: { test: createActionEntry([1], 'sex') },
      };

      const result = await build(groups, tiles, settings, 2);

      expect(result.metadata.availableTileCount).toBe(2);
    });
  });

  describe('Shuffle bag distribution', () => {
    it('should use every tile in a bag before repeating any', async () => {
      const groups = [createGroup('g1', 'test')];
      const tiles = [
        createTile(1, 'g1', 1, 'A'),
        createTile(2, 'g1', 1, 'B'),
        createTile(3, 'g1', 1, 'C'),
      ];

      const settings = {
        ...baseSettings,
        selectedActions: { test: createActionEntry([1], 'sex') },
      };

      const result = await build(groups, tiles, settings, 3);
      const descriptions = result.board.slice(1, -1).map((tile) => tile.description);

      expect([...descriptions].sort()).toEqual(['A', 'B', 'C']);
    });

    it('should be reproducible for a fixed seed', async () => {
      const groups = [createGroup('g1', 'test')];
      const tiles = [
        createTile(1, 'g1', 1, 'A'),
        createTile(2, 'g1', 1, 'B'),
        createTile(3, 'g1', 1, 'C'),
      ];
      const settings = {
        ...baseSettings,
        selectedActions: { test: createActionEntry([1], 'sex') },
      };

      const first = await build(groups, tiles, settings, 3, 7);
      const second = await build(groups, tiles, settings, 3, 7);

      expect(first.board.map((t) => t.description)).toEqual(second.board.map((t) => t.description));
    });
  });
});

describe('buildGameBoard facade', () => {
  const dataSourceOf = (groups: CustomGroupPull[], tiles: CustomTilePull[]): BoardDataSource => ({
    getGroups: async () => groups,
    fetchTiles: async () => tiles,
  });

  it('should fetch via the data source and delegate to the core', async () => {
    const groups = [createGroup('g1', 'test')];
    const tiles = [createTile(1, 'g1', 1, 'Action 1')];
    const settings = {
      ...baseSettings,
      selectedActions: { test: createActionEntry([1], 'sex') },
    };

    const result = await buildGameBoard(settings, 'en', 'online', 3, {
      dataSource: dataSourceOf(groups, tiles),
      translate: identity,
    });

    expect(result.board).toHaveLength(5);
    expect(result.board[0].title).toBe('start');
    expect(result.metadata.selectedGroups).toEqual(['test']);
  });

  it('should return an empty board when the data source throws', async () => {
    const failingSource: BoardDataSource = {
      getGroups: async () => {
        throw new Error('DB error');
      },
      fetchTiles: async () => [],
    };

    const result = await buildGameBoard(baseSettings, 'en', 'online', 3, {
      dataSource: failingSource,
      translate: identity,
    });

    expect(result.board).toHaveLength(2);
    expect(result.metadata.availableTileCount).toBe(0);
  });
});
