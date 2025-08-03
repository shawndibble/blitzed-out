import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

import { CustomGroupPull } from '@/types/customGroups';
import { getAllAvailableGroups } from '@/stores/customGroups';
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
