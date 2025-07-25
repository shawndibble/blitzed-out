import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useUnifiedActionList from '../useUnifiedActionList';
import { CustomGroupPull } from '@/types/customGroups';

// Mock i18next
const mockI18n = {
  resolvedLanguage: 'en',
  on: vi.fn(),
  off: vi.fn(),
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: mockI18n,
  }),
}));

// Mock customGroups store
const mockGroups: CustomGroupPull[] = [
  {
    id: '1',
    name: 'bating',
    label: 'Bating',
    intensities: [
      { id: '1', label: 'Masturbation', value: 1, isDefault: true },
      { id: '2', label: 'Edging', value: 2, isDefault: true },
      { id: '3', label: 'Toys', value: 3, isDefault: true },
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
    name: 'pissPlay',
    label: 'Piss Play',
    intensities: [
      { id: '1', label: 'Light', value: 1, isDefault: true },
      { id: '2', label: 'Medium', value: 2, isDefault: true },
    ],
    type: 'solo',
    isDefault: true,
    locale: 'en',
    gameMode: 'online',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

vi.mock('@/stores/customGroups', () => ({
  getAllAvailableGroups: vi.fn(),
}));

import { getAllAvailableGroups } from '@/stores/customGroups';

describe('useUnifiedActionList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAllAvailableGroups).mockResolvedValue(mockGroups);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should load actions for online game mode', async () => {
    const { result } = renderHook(() => useUnifiedActionList('online'));

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.actionsList).toEqual({});

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have loaded actions
    expect(result.current.actionsList).toBeDefined();
    expect(Object.keys(result.current.actionsList)).toContain('bating');
    expect(Object.keys(result.current.actionsList)).toContain('pissPlay');

    // Check structure of bating group
    const batingGroup = result.current.actionsList.bating;
    expect(batingGroup.label).toBe('Bating');
    expect(batingGroup.type).toBe('solo');
    expect(batingGroup.actions).toHaveProperty('None');
    expect(batingGroup.actions).toHaveProperty('Masturbation');
    expect(batingGroup.actions).toHaveProperty('Edging');
    expect(batingGroup.actions).toHaveProperty('Toys');

    // Check that getAllAvailableGroups was called with correct parameters
    expect(getAllAvailableGroups).toHaveBeenCalledWith('en', 'online');
  });

  it('should handle fresh user scenario with no game mode', async () => {
    const { result } = renderHook(() => useUnifiedActionList());

    // Should remain loading since no game mode provided
    expect(result.current.isLoading).toBe(true);
    expect(result.current.actionsList).toEqual({});
    expect(getAllAvailableGroups).not.toHaveBeenCalled();
  });

  it('should handle empty groups gracefully', async () => {
    vi.mocked(getAllAvailableGroups).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useUnifiedActionList('online'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.actionsList).toEqual({});
  });

  it('should handle store errors gracefully', async () => {
    vi.mocked(getAllAvailableGroups).mockRejectedValueOnce(new Error('Database error'));

    const { result } = renderHook(() => useUnifiedActionList('online'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.actionsList).toEqual({});
  });

  it('should cache results for performance', async () => {
    const { result, rerender } = renderHook(() => useUnifiedActionList('online'));

    // Wait for first load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getAllAvailableGroups).toHaveBeenCalledTimes(1);

    // Re-render should use cache
    rerender();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should still only have been called once due to caching
    expect(getAllAvailableGroups).toHaveBeenCalledTimes(1);
  });

  it('should clear cache when language changes', async () => {
    const { result } = renderHook(() => useUnifiedActionList('online'));

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getAllAvailableGroups).toHaveBeenCalledTimes(1);

    // Simulate language change
    const languageChangeHandler = mockI18n.on.mock.calls.find(
      (call) => call[0] === 'languageChanged'
    )?.[1];

    expect(languageChangeHandler).toBeDefined();

    if (languageChangeHandler) {
      languageChangeHandler('es');
    }

    // Change the resolved language
    mockI18n.resolvedLanguage = 'es';

    // Trigger re-render
    const { rerender } = renderHook(() => useUnifiedActionList('online'));
    rerender();

    // Should call getAllAvailableGroups again with new language
    await waitFor(() => {
      expect(getAllAvailableGroups).toHaveBeenCalledWith('es', 'online');
    });
  });

  it('should handle migration scenario - fresh user gets default actions', async () => {
    // Simulate fresh user scenario where migration has just completed
    const freshUserGroups: CustomGroupPull[] = [
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

    vi.mocked(getAllAvailableGroups).mockResolvedValue(freshUserGroups);

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
});
