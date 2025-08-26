import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

import { CustomGroupPull } from '@/types/customGroups';
import { getAllAvailableGroups, getCustomGroupsWithTiles } from '@/stores/customGroups';
import { getTileCountsByGroup } from '@/stores/customTiles';
import useUnifiedActionList from '../useUnifiedActionList';

// Mock i18next
const mockI18n = {
  resolvedLanguage: 'en',
  on: vi.fn(),
  off: vi.fn(),
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: mockI18n,
    t: (key: string) => (key === 'none' ? 'None' : key), // Mock that handles specific translations
  }),
}));

// Mock customGroups store
vi.mock('@/stores/customGroups', () => ({
  getAllAvailableGroups: vi.fn(),
  getCustomGroupsWithTiles: vi.fn(),
}));

// Mock customTiles store
vi.mock('@/stores/customTiles', () => ({
  getTileCountsByGroup: vi.fn(),
}));

// Mock migration context
vi.mock('@/context/migration', () => ({
  useMigration: () => ({
    currentLanguageMigrated: true,
    isMigrationInProgress: false,
    isMigrationCompleted: true,
    error: null,
    isHealthy: true,
    recoveryAttempted: false,
    triggerMigration: vi.fn(),
    ensureLanguageMigrated: vi.fn(),
    forceRecovery: vi.fn(),
  }),
}));

describe('useUnifiedActionList - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the internal cache
    const clearCache = (window as any).clearActionsCache;
    if (clearCache) clearCache();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should successfully load and format action groups', async () => {
    const mockGroups: CustomGroupPull[] = [
      {
        id: '1',
        name: 'bating',
        label: 'Bating',
        intensities: [
          { id: '1', label: 'Masturbation', value: 1, isDefault: true },
          { id: '2', label: 'Edging', value: 2, isDefault: true },
        ],
        type: 'solo',
        isDefault: true,
        locale: 'en',
        gameMode: 'online',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(getAllAvailableGroups).mockResolvedValue(mockGroups);

    const { result } = renderHook(() => useUnifiedActionList('online'));

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check that actions were loaded and formatted correctly
    expect(result.current.actionsList).toBeDefined();
    expect(Object.keys(result.current.actionsList)).toContain('bating');

    const batingGroup = result.current.actionsList.bating;
    expect(batingGroup.label).toBe('Bating');
    expect(batingGroup.type).toBe('solo');
    expect(batingGroup.actions).toHaveProperty('None');
    expect(batingGroup.actions).toHaveProperty('Masturbation');
    expect(batingGroup.actions).toHaveProperty('Edging');
  });

  it('should handle migration scenario correctly', async () => {
    // Simulate post-migration scenario where default groups are available
    const defaultGroups: CustomGroupPull[] = [
      {
        id: '1',
        name: 'bating',
        label: 'Bating',
        intensities: [{ id: '1', label: 'Masturbation', value: 1, isDefault: true }],
        type: 'solo',
        isDefault: true, // This indicates it came from migration
        locale: 'en',
        gameMode: 'online',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(getAllAvailableGroups).mockResolvedValue(defaultGroups);

    const { result } = renderHook(() => useUnifiedActionList('online'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have loaded default actions from migration
    expect(result.current.actionsList).toBeDefined();
    expect(Object.keys(result.current.actionsList)).toContain('bating');

    const batingGroup = result.current.actionsList.bating;
    expect(batingGroup.label).toBe('Bating');
    expect(batingGroup.actions).toHaveProperty('None');
    expect(batingGroup.actions).toHaveProperty('Masturbation');
  });

  it('should handle fresh user with no game mode', () => {
    const { result } = renderHook(() => useUnifiedActionList());

    // Should remain in loading state since no game mode provided
    expect(result.current.isLoading).toBe(true);
    expect(result.current.actionsList).toEqual({});
  });

  it('should handle empty groups array', async () => {
    vi.mocked(getAllAvailableGroups).mockResolvedValue([]);

    const { result } = renderHook(() => useUnifiedActionList('online'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should handle empty groups gracefully
    expect(result.current.actionsList).toEqual({});
  });
});

describe('useUnifiedActionList - Filtering Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the internal cache
    const clearCache = (window as any).clearActionsCache;
    if (clearCache) clearCache();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should show all groups and intensities when showOnlyGroupsWithTiles is false', async () => {
    const mockGroups: CustomGroupPull[] = [
      {
        id: '1',
        name: 'group-with-tiles',
        label: 'Group With Tiles',
        intensities: [
          { id: '1', label: 'Easy', value: 1, isDefault: true },
          { id: '2', label: 'Medium', value: 2, isDefault: true },
          { id: '3', label: 'Hard', value: 3, isDefault: true },
        ],
        type: 'solo',
        isDefault: false,
        locale: 'en',
        gameMode: 'online',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'group-no-tiles',
        label: 'Group No Tiles',
        intensities: [
          { id: '4', label: 'Level 1', value: 1, isDefault: true },
          { id: '5', label: 'Level 2', value: 2, isDefault: true },
        ],
        type: 'solo',
        isDefault: false,
        locale: 'en',
        gameMode: 'online',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(getAllAvailableGroups).mockResolvedValue(mockGroups);

    const { result } = renderHook(() => useUnifiedActionList('online', false));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should show all groups regardless of tile count
    expect(Object.keys(result.current.actionsList)).toHaveLength(2);
    expect(result.current.actionsList).toHaveProperty('group-with-tiles');
    expect(result.current.actionsList).toHaveProperty('group-no-tiles');

    // Should show all intensities for each group
    const groupWithTiles = result.current.actionsList['group-with-tiles'];
    expect(Object.keys(groupWithTiles.actions || {})).toEqual(['None', 'Easy', 'Medium', 'Hard']);
    expect(groupWithTiles.intensities).toEqual({ 1: 'Easy', 2: 'Medium', 3: 'Hard' });

    const groupNoTiles = result.current.actionsList['group-no-tiles'];
    expect(Object.keys(groupNoTiles.actions || {})).toEqual(['None', 'Level 1', 'Level 2']);
    expect(groupNoTiles.intensities).toEqual({ 1: 'Level 1', 2: 'Level 2' });
  });

  it('should filter groups with no tiles when showOnlyGroupsWithTiles is true', async () => {
    const mockAllGroups: CustomGroupPull[] = [
      {
        id: '1',
        name: 'group-with-tiles',
        label: 'Group With Tiles',
        intensities: [
          { id: '1', label: 'Easy', value: 1, isDefault: true },
          { id: '2', label: 'Medium', value: 2, isDefault: true },
        ],
        type: 'solo',
        isDefault: false,
        locale: 'en',
        gameMode: 'online',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'default-group-with-tiles',
        label: 'Default Group With Tiles',
        intensities: [{ id: '3', label: 'Level 1', value: 1, isDefault: true }],
        type: 'solo',
        isDefault: true,
        locale: 'en',
        gameMode: 'online',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockCustomGroupsWithTiles: CustomGroupPull[] = [mockAllGroups[0]]; // Only custom group with tiles

    const mockTileCounts = {
      'group-with-tiles': {
        count: 5,
        intensities: { 1: 3, 2: 2 }, // Both intensities have tiles
      },
      'default-group-with-tiles': {
        count: 2,
        intensities: { 1: 2 }, // Only intensity level 1 has tiles
      },
    };

    vi.mocked(getCustomGroupsWithTiles).mockResolvedValue(mockCustomGroupsWithTiles);
    vi.mocked(getTileCountsByGroup).mockResolvedValue(mockTileCounts);
    vi.mocked(getAllAvailableGroups).mockResolvedValue(mockAllGroups);

    const { result } = renderHook(() => useUnifiedActionList('online', true));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should only show groups that have tiles
    expect(Object.keys(result.current.actionsList)).toHaveLength(2);
    expect(result.current.actionsList).toHaveProperty('group-with-tiles');
    expect(result.current.actionsList).toHaveProperty('default-group-with-tiles');

    // Custom group should show all intensities that have tiles
    const customGroup = result.current.actionsList['group-with-tiles'];
    expect(Object.keys(customGroup.actions || {})).toEqual(['None', 'Easy', 'Medium']);
    expect(customGroup.intensities).toEqual({ 1: 'Easy', 2: 'Medium' });

    // Default group should only show intensities that have tiles
    const defaultGroup = result.current.actionsList['default-group-with-tiles'];
    expect(Object.keys(defaultGroup.actions || {})).toEqual(['None', 'Level 1']);
    expect(defaultGroup.intensities).toEqual({ 1: 'Level 1' });
  });

  it('should filter intensities with no tiles within groups when showOnlyGroupsWithTiles is true', async () => {
    const mockAllGroups: CustomGroupPull[] = [
      {
        id: '1',
        name: 'partial-tiles-group',
        label: 'Partial Tiles Group',
        intensities: [
          { id: '1', label: 'Easy', value: 1, isDefault: true },
          { id: '2', label: 'Medium', value: 2, isDefault: true },
          { id: '3', label: 'Hard', value: 3, isDefault: true },
          { id: '4', label: 'Expert', value: 4, isDefault: true },
        ],
        type: 'solo',
        isDefault: false,
        locale: 'en',
        gameMode: 'online',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockCustomGroupsWithTiles: CustomGroupPull[] = [mockAllGroups[0]];

    const mockTileCounts = {
      'partial-tiles-group': {
        count: 8,
        intensities: { 1: 3, 3: 5 }, // Only intensities 1 and 3 have tiles (2 and 4 are missing)
      },
    };

    vi.mocked(getCustomGroupsWithTiles).mockResolvedValue(mockCustomGroupsWithTiles);
    vi.mocked(getTileCountsByGroup).mockResolvedValue(mockTileCounts);
    vi.mocked(getAllAvailableGroups).mockResolvedValue(mockAllGroups);

    const { result } = renderHook(() => useUnifiedActionList('online', true));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should show the group
    expect(Object.keys(result.current.actionsList)).toHaveLength(1);
    expect(result.current.actionsList).toHaveProperty('partial-tiles-group');

    // Should only show intensities that have tiles (1 and 3, not 2 and 4)
    const group = result.current.actionsList['partial-tiles-group'];
    expect(Object.keys(group.actions || {})).toEqual(['None', 'Easy', 'Hard']); // Only Easy (1) and Hard (3)
    expect(group.intensities).toEqual({ 1: 'Easy', 3: 'Hard' });

    // Should not include Medium (2) or Expert (4) since they have no tiles
    expect(group.actions).not.toHaveProperty('Medium');
    expect(group.actions).not.toHaveProperty('Expert');
    expect(group.intensities?.[2]).toBeUndefined();
    expect(group.intensities?.[4]).toBeUndefined();
  });

  it('should hide groups completely when they have no tiles at all', async () => {
    const mockAllGroups: CustomGroupPull[] = [
      {
        id: '1',
        name: 'group-with-tiles',
        label: 'Group With Tiles',
        intensities: [{ id: '1', label: 'Easy', value: 1, isDefault: true }],
        type: 'solo',
        isDefault: false,
        locale: 'en',
        gameMode: 'online',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockCustomGroupsWithTiles: CustomGroupPull[] = [mockAllGroups[0]];

    const mockTileCounts = {
      'group-with-tiles': {
        count: 3,
        intensities: { 1: 3 },
      },
      // Note: group-no-tiles is not in tileCounts, so it won't be returned by getCustomGroupsWithTiles
    };

    vi.mocked(getCustomGroupsWithTiles).mockResolvedValue(mockCustomGroupsWithTiles);
    vi.mocked(getTileCountsByGroup).mockResolvedValue(mockTileCounts);
    vi.mocked(getAllAvailableGroups).mockResolvedValue(mockAllGroups);

    const { result } = renderHook(() => useUnifiedActionList('online', true));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should only show the group that has tiles
    expect(Object.keys(result.current.actionsList)).toHaveLength(1);
    expect(result.current.actionsList).toHaveProperty('group-with-tiles');
    expect(result.current.actionsList).not.toHaveProperty('group-no-tiles');
  });

  it('should use different cache keys for filtered vs unfiltered requests', async () => {
    const mockGroups: CustomGroupPull[] = [
      {
        id: '1',
        name: 'test-group',
        label: 'Test Group',
        intensities: [{ id: '1', label: 'Easy', value: 1, isDefault: true }],
        type: 'solo',
        isDefault: false,
        locale: 'en',
        gameMode: 'online',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(getAllAvailableGroups).mockResolvedValue(mockGroups);
    vi.mocked(getCustomGroupsWithTiles).mockResolvedValue(mockGroups);
    vi.mocked(getTileCountsByGroup).mockResolvedValue({
      'test-group': { count: 1, intensities: { 1: 1 } },
    });

    // First call without filtering
    const { result: unfilteredResult } = renderHook(() => useUnifiedActionList('online', false));
    await waitFor(() => expect(unfilteredResult.current.isLoading).toBe(false));

    // Second call with filtering
    const { result: filteredResult } = renderHook(() => useUnifiedActionList('online', true));
    await waitFor(() => expect(filteredResult.current.isLoading).toBe(false));

    // Both should have results (this tests that they don't interfere with each other's cache)
    expect(unfilteredResult.current.actionsList).toHaveProperty('test-group');
    expect(filteredResult.current.actionsList).toHaveProperty('test-group');

    // Verify the functions were called appropriately
    expect(vi.mocked(getAllAvailableGroups)).toHaveBeenCalledTimes(2); // Once for each mode
    expect(vi.mocked(getCustomGroupsWithTiles)).toHaveBeenCalledTimes(1); // Only for filtered mode
    expect(vi.mocked(getTileCountsByGroup)).toHaveBeenCalledTimes(1); // Only for filtered mode
  });
});
