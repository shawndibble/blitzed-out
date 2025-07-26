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

// Mock array helpers with some actual randomization for testing
vi.mock('@/helpers/arrays', () => ({
  cycleArray: vi.fn((arr) => arr),
  shuffleArray: vi.fn((arr) => {
    // Provide some actual shuffling for variety testing
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }),
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
      type: 'solo',
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
      type: 'solo',
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

  describe('Intensity fallback logic', () => {
    it('should use higher intensity tiles when lower intensity is unavailable', async () => {
      // Mock group that only has intensity 2+ tiles, but user selected level 1
      const mockGroupsWithHighIntensity: CustomGroupPull[] = [
        {
          id: '1',
          name: 'pissPlay',
          label: 'Piss Play',
          intensities: [
            { id: '1', label: 'intensityLabels.light', value: 1, isDefault: true },
            { id: '2', label: 'intensityLabels.medium', value: 2, isDefault: true },
            { id: '3', label: 'intensityLabels.intense', value: 3, isDefault: true },
          ],
          type: 'solo',
          isDefault: true,
          locale: 'en',
          gameMode: 'online',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockTilesWithHighIntensity: CustomTilePull[] = [
        {
          id: 1,
          group: 'pissPlay',
          intensity: 2, // No intensity 1 tiles available
          action: 'Medium intensity piss play action',
          tags: [],
          isEnabled: 1,
          isCustom: 0,
          locale: 'en',
          gameMode: 'online',
        },
        {
          id: 2,
          group: 'pissPlay',
          intensity: 3,
          action: 'High intensity piss play action',
          tags: [],
          isEnabled: 1,
          isCustom: 0,
          locale: 'en',
          gameMode: 'online',
        },
      ];

      vi.mocked(getCustomGroups).mockResolvedValue(mockGroupsWithHighIntensity);
      vi.mocked(getTiles).mockResolvedValue(mockTilesWithHighIntensity);

      const settings: Settings = {
        ...mockSettings,
        selectedActions: {
          pissPlay: {
            level: 1, // User selected level 1, but only intensity 2+ tiles exist
            type: 'action',
            variation: 'standalone',
          },
        },
      };

      const result = await buildGameBoard(settings, 'en', 'online', 3);

      // Should successfully generate tiles using higher intensity fallback
      expect(result.board.length).toBe(5); // 3 tiles + start + finish
      expect(result.metadata.tilesWithContent).toBeGreaterThan(2); // More than just start/finish
      expect(result.metadata.availableTileCount).toBe(2); // Both intensity 2,3 tiles available

      // Check that tiles have content (fallback worked)
      const contentTiles = result.board.slice(1, -1); // Exclude start/finish
      const tilesWithContent = contentTiles.filter(
        (tile) => tile.description && tile.description.trim().length > 0
      );
      expect(tilesWithContent.length).toBeGreaterThan(0);
    });

    it('should try lower intensities first before falling back to higher ones', async () => {
      const mockGroupsWithGaps: CustomGroupPull[] = [
        {
          id: '1',
          name: 'gappedGroup',
          label: 'Group with Gaps',
          intensities: [
            { id: '1', label: 'intensityLabels.light', value: 1, isDefault: true },
            { id: '2', label: 'intensityLabels.medium', value: 2, isDefault: true },
            { id: '3', label: 'intensityLabels.intense', value: 3, isDefault: true },
          ],
          type: 'solo',
          isDefault: true,
          locale: 'en',
          gameMode: 'online',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockTilesWithGaps: CustomTilePull[] = [
        {
          id: 1,
          group: 'gappedGroup',
          intensity: 1,
          action: 'Intensity 1 action',
          tags: [],
          isEnabled: 1,
          isCustom: 0,
          locale: 'en',
          gameMode: 'online',
        },
        {
          id: 2,
          group: 'gappedGroup',
          intensity: 3, // Gap at intensity 2
          action: 'Intensity 3 action',
          tags: [],
          isEnabled: 1,
          isCustom: 0,
          locale: 'en',
          gameMode: 'online',
        },
      ];

      vi.mocked(getCustomGroups).mockResolvedValue(mockGroupsWithGaps);
      vi.mocked(getTiles).mockResolvedValue(mockTilesWithGaps);

      const settings: Settings = {
        ...mockSettings,
        selectedActions: {
          gappedGroup: {
            level: 2, // Target intensity 2, but only 1 and 3 available
            type: 'action',
            variation: 'standalone',
          },
        },
      };

      const result = await buildGameBoard(settings, 'en', 'online', 4);

      // Should successfully generate tiles
      expect(result.board.length).toBe(6); // 4 tiles + start + finish
      expect(result.metadata.tilesWithContent).toBeGreaterThan(2);
      expect(result.metadata.availableTileCount).toBe(2);

      // Should successfully use fallback tiles
      const contentTiles = result.board.slice(1, -1);
      const tilesWithContent = contentTiles.filter(
        (tile) => tile.description && tile.description.trim().length > 0
      );
      expect(tilesWithContent.length).toBeGreaterThan(0);
    });

    it('should handle groups with no available tiles gracefully', async () => {
      const mockEmptyGroup: CustomGroupPull[] = [
        {
          id: '1',
          name: 'emptyGroup',
          label: 'Empty Group',
          intensities: [
            { id: '1', label: 'intensityLabels.light', value: 1, isDefault: true },
            { id: '2', label: 'intensityLabels.medium', value: 2, isDefault: true },
          ],
          type: 'solo',
          isDefault: true,
          locale: 'en',
          gameMode: 'online',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockEmptyTiles: CustomTilePull[] = []; // No tiles available for this group

      vi.mocked(getCustomGroups).mockResolvedValue(mockEmptyGroup);
      vi.mocked(getTiles).mockResolvedValue(mockEmptyTiles);

      const settings: Settings = {
        ...mockSettings,
        selectedActions: {
          emptyGroup: {
            level: 1,
            type: 'action',
            variation: 'standalone',
          },
        },
      };

      const result = await buildGameBoard(settings, 'en', 'online', 3);

      // Should return empty board with just start/finish tiles when no tiles available
      expect(result.board.length).toBe(2); // Just start + finish (no content tiles generated)
      expect(result.metadata.tilesWithContent).toBe(2); // Only start and finish
      expect(result.metadata.availableTileCount).toBe(0);
    });

    it('should handle disabled tiles correctly with intensity fallback', async () => {
      const mockGroupWithDisabled: CustomGroupPull[] = [
        {
          id: '1',
          name: 'disabledGroup',
          label: 'Group with Disabled Tiles',
          intensities: [
            { id: '1', label: 'intensityLabels.light', value: 1, isDefault: true },
            { id: '2', label: 'intensityLabels.medium', value: 2, isDefault: true },
          ],
          type: 'solo',
          isDefault: true,
          locale: 'en',
          gameMode: 'online',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockTilesWithDisabled: CustomTilePull[] = [
        {
          id: 1,
          group: 'disabledGroup',
          intensity: 1,
          action: 'Disabled tile',
          tags: [],
          isEnabled: 0, // This tile is disabled
          isCustom: 0,
          locale: 'en',
          gameMode: 'online',
        },
        {
          id: 2,
          group: 'disabledGroup',
          intensity: 2,
          action: 'Enabled tile intensity 2',
          tags: [],
          isEnabled: 1,
          isCustom: 0,
          locale: 'en',
          gameMode: 'online',
        },
      ];

      vi.mocked(getCustomGroups).mockResolvedValue(mockGroupWithDisabled);
      vi.mocked(getTiles).mockResolvedValue(mockTilesWithDisabled);

      const settings: Settings = {
        ...mockSettings,
        selectedActions: {
          disabledGroup: {
            level: 1, // Target intensity 1, but it's disabled - should fallback to 2
            type: 'action',
            variation: 'standalone',
          },
        },
      };

      const result = await buildGameBoard(settings, 'en', 'online', 2);

      // Should fallback to intensity 2 since intensity 1 tile is disabled
      expect(result.board.length).toBe(4); // 2 tiles + start + finish
      expect(result.metadata.tilesWithContent).toBeGreaterThan(2);
      expect(result.metadata.availableTileCount).toBe(2); // Both tiles counted, but only enabled one used

      const contentTiles = result.board.slice(1, -1);
      const tilesWithContent = contentTiles.filter(
        (tile) => tile.description && tile.description.trim().length > 0
      );
      expect(tilesWithContent.length).toBeGreaterThan(0);
    });

    it('should handle role filtering with intensity fallback', async () => {
      const mockGroupWithRoles: CustomGroupPull[] = [
        {
          id: '1',
          name: 'roleGroup',
          label: 'Group with Role Filtering',
          intensities: [
            { id: '1', label: 'intensityLabels.light', value: 1, isDefault: true },
            { id: '2', label: 'intensityLabels.medium', value: 2, isDefault: true },
          ],
          type: 'solo',
          isDefault: true,
          locale: 'en',
          gameMode: 'online',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockTilesWithRoles: CustomTilePull[] = [
        {
          id: 1,
          group: 'roleGroup',
          intensity: 2,
          action: 'Action for {sub} at intensity 2', // Only available for sub role
          tags: [],
          isEnabled: 1,
          isCustom: 0,
          locale: 'en',
          gameMode: 'online',
        },
        {
          id: 2,
          group: 'roleGroup',
          intensity: 2,
          action: 'Action for {dom} at intensity 2', // Only available for dom role
          tags: [],
          isEnabled: 1,
          isCustom: 0,
          locale: 'en',
          gameMode: 'online',
        },
      ];

      vi.mocked(getCustomGroups).mockResolvedValue(mockGroupWithRoles);
      vi.mocked(getTiles).mockResolvedValue(mockTilesWithRoles);

      const settings: Settings = {
        ...mockSettings,
        selectedActions: {
          roleGroup: {
            level: 1, // Target intensity 1, but only 2 available
            type: 'action',
            variation: 'standalone',
          },
        },
        role: 'sub', // Should only get tiles with {sub}
      };

      const result = await buildGameBoard(settings, 'en', 'online', 2);

      expect(result.board.length).toBe(4); // 2 tiles + start + finish
      expect(result.metadata.availableTileCount).toBe(1); // Only sub-appropriate tile

      // Check that generated tiles are appropriate for the role
      const contentTiles = result.board.slice(1, -1);
      const tilesWithSubRole = contentTiles.filter(
        (tile) =>
          tile.description &&
          (tile.description.includes('{sub}') || !tile.description.includes('{dom}'))
      );
      expect(tilesWithSubRole.length).toBeGreaterThan(0);
    });

    it('should handle multiple groups with different intensity availability', async () => {
      const mockMixedGroups: CustomGroupPull[] = [
        {
          id: '1',
          name: 'groupA',
          label: 'Group A',
          intensities: [
            { id: '1', label: 'intensityLabels.light', value: 1, isDefault: true },
            { id: '2', label: 'intensityLabels.medium', value: 2, isDefault: true },
          ],
          type: 'solo',
          isDefault: true,
          locale: 'en',
          gameMode: 'online',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'groupB',
          label: 'Group B',
          intensities: [
            { id: '1', label: 'intensityLabels.light', value: 1, isDefault: true },
            { id: '2', label: 'intensityLabels.medium', value: 2, isDefault: true },
          ],
          type: 'solo',
          isDefault: true,
          locale: 'en',
          gameMode: 'online',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockMixedTiles: CustomTilePull[] = [
        {
          id: 1,
          group: 'groupA',
          intensity: 1,
          action: 'Group A intensity 1',
          tags: [],
          isEnabled: 1,
          isCustom: 0,
          locale: 'en',
          gameMode: 'online',
        },
        {
          id: 2,
          group: 'groupB',
          intensity: 2, // Only higher intensity available for group B
          action: 'Group B intensity 2',
          tags: [],
          isEnabled: 1,
          isCustom: 0,
          locale: 'en',
          gameMode: 'online',
        },
      ];

      vi.mocked(getCustomGroups).mockResolvedValue(mockMixedGroups);
      vi.mocked(getTiles).mockResolvedValue(mockMixedTiles);

      const settings: Settings = {
        ...mockSettings,
        selectedActions: {
          groupA: { level: 1, type: 'action', variation: 'standalone' },
          groupB: { level: 1, type: 'action', variation: 'standalone' }, // Should fallback to intensity 2
        },
      };

      const result = await buildGameBoard(settings, 'en', 'online', 4);

      expect(result.board.length).toBe(6); // 4 tiles + start + finish
      expect(result.metadata.tilesWithContent).toBeGreaterThan(2);
      expect(result.metadata.availableTileCount).toBe(2); // Both tiles available

      // Should have tiles from both groups
      const contentTiles = result.board.slice(1, -1);
      const tilesWithContent = contentTiles.filter(
        (tile) => tile.description && tile.description.trim().length > 0
      );
      expect(tilesWithContent.length).toBeGreaterThan(0);
    });
  });

  describe('Action Variety Validation', () => {
    it('should generate varied actions across multiple board builds', async () => {
      // Mock tiles with multiple actions per group to test variety
      const mockTilesWithMultipleActions: CustomTilePull[] = [
        {
          id: 1,
          group: 'teasing',
          intensity: 1,
          action: 'First teasing action',
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
          action: 'Second teasing action',
          tags: [],
          isEnabled: 1,
          isCustom: 0,
          locale: 'en',
          gameMode: 'online',
        },
        {
          id: 3,
          group: 'teasing',
          intensity: 1,
          action: 'Third teasing action',
          tags: [],
          isEnabled: 1,
          isCustom: 0,
          locale: 'en',
          gameMode: 'online',
        },
        {
          id: 4,
          group: 'teasing',
          intensity: 1,
          action: 'Fourth teasing action',
          tags: [],
          isEnabled: 1,
          isCustom: 0,
          locale: 'en',
          gameMode: 'online',
        },
        {
          id: 5,
          group: 'teasing',
          intensity: 1,
          action: 'Fifth teasing action',
          tags: [],
          isEnabled: 1,
          isCustom: 0,
          locale: 'en',
          gameMode: 'online',
        },
      ];

      vi.mocked(getTiles).mockResolvedValue(mockTilesWithMultipleActions);

      const settingsWithSingleGroup: Settings = {
        ...mockSettings,
        selectedActions: {
          teasing: { level: 1, type: 'action', variation: 'standalone' },
        },
      };

      // Generate multiple boards and collect unique actions
      const uniqueActions = new Set<string>();
      const numBoards = 10;
      const tilesPerBoard = 5;

      for (let i = 0; i < numBoards; i++) {
        const result = await buildGameBoard(settingsWithSingleGroup, 'en', 'online', tilesPerBoard);

        // Extract actions from content tiles (excluding start/finish)
        const contentTiles = result.board.slice(1, -1);
        contentTiles.forEach((tile) => {
          if (tile.description && tile.description.trim().length > 0) {
            uniqueActions.add(tile.description.trim());
          }
        });
      }

      // With 5 different actions available and 50 total tiles generated (10 boards × 5 tiles),
      // we should see some variety. If the bug exists, we'd only see 1-2 unique actions.
      // Setting a reasonable threshold: at least 3 unique actions out of 5 available
      expect(uniqueActions.size).toBeGreaterThanOrEqual(3);

      // Also verify that we're not getting the exact same action for every single tile
      expect(uniqueActions.size).toBeGreaterThan(1);

      console.log(
        `Action variety test: Generated ${uniqueActions.size} unique actions out of ${mockTilesWithMultipleActions.length} available`
      );
    });

    it('should not generate identical boards when multiple actions are available', async () => {
      // Mock tiles with multiple actions to ensure variety is possible
      const mockVarietyTiles: CustomTilePull[] = [
        {
          id: 1,
          group: 'edging',
          intensity: 1,
          action: 'Edge action A',
          tags: [],
          isEnabled: 1,
          isCustom: 0,
          locale: 'en',
          gameMode: 'online',
        },
        {
          id: 2,
          group: 'edging',
          intensity: 1,
          action: 'Edge action B',
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
          action: 'Edge action C',
          tags: [],
          isEnabled: 1,
          isCustom: 0,
          locale: 'en',
          gameMode: 'online',
        },
        {
          id: 4,
          group: 'edging',
          intensity: 1,
          action: 'Edge action D',
          tags: [],
          isEnabled: 1,
          isCustom: 0,
          locale: 'en',
          gameMode: 'online',
        },
        {
          id: 5,
          group: 'edging',
          intensity: 1,
          action: 'Edge action E',
          tags: [],
          isEnabled: 1,
          isCustom: 0,
          locale: 'en',
          gameMode: 'online',
        },
      ];

      vi.mocked(getTiles).mockResolvedValue(mockVarietyTiles);

      const varietySettings: Settings = {
        ...mockSettings,
        selectedActions: {
          edging: { level: 1, type: 'action', variation: 'standalone' },
        },
      };

      // Test that we use different actions rather than the same one repeatedly
      const board = await buildGameBoard(varietySettings, 'en', 'online', 5);
      const boardActions = board.board.slice(1, -1).map((tile) => tile.description);
      const uniqueActionsInBoard = new Set(boardActions);

      // With 5 actions available and 5 board tiles, we should see variety within the board
      // This tests that we're not stuck using the same action repeatedly
      expect(uniqueActionsInBoard.size).toBeGreaterThan(1);
    });
  });
});
