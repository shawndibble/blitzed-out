import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CustomTilePull, SubmitMessage } from '@/types/customTiles';
import { useCustomTileLifecycle } from '../useCustomTileLifecycle';

const mockGroups = [
  {
    id: 'group-1',
    name: 'foreplay',
    label: 'Foreplay',
    intensities: [{ value: 1, label: 'Light' }],
    hasNoTiles: false,
    isAvailableForSetup: true,
  },
  {
    id: 'group-2',
    name: 'oral',
    label: 'Oral',
    intensities: [{ value: 2, label: 'Medium' }],
    hasNoTiles: false,
    isAvailableForSetup: true,
  },
];

const addCustomTile = vi.fn(async (..._args: unknown[]) => 1);
const updateCustomTile = vi.fn(async (..._args: unknown[]) => undefined);
const submitCustomAction = vi.fn((..._args: unknown[]) => undefined);
const validateCustomTileWithGroups = vi.fn(async (..._args: unknown[]) => ({
  isValid: true,
  errors: [] as string[],
}));

vi.mock('@/hooks/useGroupFiltering', () => ({
  useEditorGroupsReactive: () => ({
    groups: mockGroups,
    loading: false,
    error: null,
    isEmpty: false,
  }),
}));
vi.mock('@/stores/settingsStore', () => ({
  useGameSettings: () => ({ settings: { locale: 'en' } }),
}));
vi.mock('@/stores/customTiles', () => ({
  addCustomTile: (...args: unknown[]) => addCustomTile(args[0]),
  updateCustomTile: (...args: unknown[]) => updateCustomTile(args[0], args[1]),
}));
vi.mock('@/services/firebase', () => ({
  submitCustomAction: (...args: unknown[]) => submitCustomAction(args[0], args[1]),
}));
vi.mock('@/services/validationService', () => ({
  validateCustomTileWithGroups: (...args: unknown[]) => validateCustomTileWithGroups(...args),
}));
vi.mock('@/services/placeholderAliasService', () => ({
  normalizePlaceholders: (s: string) => s,
  localizePlaceholders: (s: string) => s,
}));
vi.mock('react-i18next', () => {
  // Stable `t` reference across renders — matches real react-i18next and keeps
  // effects with `t` in their deps from looping under the test renderer.
  const t = (key: string, fallback?: string) => fallback || key;
  return { useTranslation: () => ({ t }) };
});

function setup(customTiles: CustomTilePull[] = []) {
  const setSubmitMessage = vi.fn<(m: SubmitMessage) => void>();
  const boardUpdated = vi.fn();
  const view = renderHook(() =>
    useCustomTileLifecycle({ customTiles, setSubmitMessage, boardUpdated })
  );
  return { ...view, setSubmitMessage, boardUpdated };
}

beforeEach(() => {
  vi.clearAllMocks();
  validateCustomTileWithGroups.mockResolvedValue({ isValid: true, errors: [] });
});

describe('useCustomTileLifecycle', () => {
  it('auto-selects the first group for a new tile', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.sharedFilters.groupName).toBe('foreplay'));
  });

  it('owns the shared filters via setSharedFilters', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.sharedFilters.groupName).toBe('foreplay'));
    act(() => {
      result.current.setSharedFilters({ gameMode: 'local', groupName: 'oral', intensity: '2' });
    });
    expect(result.current.sharedFilters).toEqual({
      gameMode: 'local',
      groupName: 'oral',
      intensity: '2',
    });
  });

  it('beginEdit populates draft + filters from the edit target', async () => {
    const { result } = setup();
    act(() => {
      result.current.beginEdit(7, {
        id: 7,
        group_id: 'group-2',
        intensity: 2,
        action: 'Lick {sub}',
        tags: ['custom'],
        isCustom: 1,
      });
    });
    await waitFor(() => expect(result.current.draft.action).toBe('Lick {sub}'));
    expect(result.current.editTarget.tileId).toBe(7);
    expect(result.current.sharedFilters.groupName).toBe('oral');
    expect(result.current.sharedFilters.intensity).toBe('2');
  });

  it('clearEdit resets draft + edit target but preserves filters', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.sharedFilters.groupName).toBe('foreplay'));
    act(() => result.current.setDraftAction('something'));
    act(() => result.current.clearEdit());
    expect(result.current.draft.action).toBe('');
    expect(result.current.editTarget.tileId).toBeNull();
    expect(result.current.sharedFilters.groupName).toBe('foreplay');
  });

  it('submitTile adds a new tile and folds in the pending tag', async () => {
    const { result, boardUpdated, setSubmitMessage } = setup();
    await waitFor(() => expect(result.current.sharedFilters.groupName).toBe('foreplay'));
    act(() => {
      result.current.setSharedFilters({
        gameMode: 'online',
        groupName: 'foreplay',
        intensity: '1',
      });
    });
    act(() => result.current.setDraftAction('Touch {sub}'));
    act(() => result.current.setTagInputValue('spicy'));

    await act(async () => {
      await result.current.submitTile();
    });

    expect(addCustomTile).toHaveBeenCalledTimes(1);
    expect(addCustomTile.mock.calls[0][0]).toMatchObject({
      group_id: 'group-1',
      intensity: 1,
      action: 'Touch {sub}',
      tags: ['custom', 'spicy'],
      isCustom: 1,
    });
    expect(boardUpdated).toHaveBeenCalled();
    expect(setSubmitMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
    // Draft cleared + pending tag input emptied after success.
    expect(result.current.draft.action).toBe('');
    expect(result.current.tagInputValue).toBe('');
  });

  it('submitTile updates an existing tile in edit mode', async () => {
    const existing: CustomTilePull[] = [
      {
        id: 9,
        group_id: 'group-2',
        intensity: 2,
        action: 'old',
        tags: ['custom'],
        isCustom: 1,
      },
    ];
    const { result } = setup(existing);
    act(() => {
      result.current.beginEdit(9, existing[0]);
    });
    await waitFor(() => expect(result.current.sharedFilters.groupName).toBe('oral'));
    act(() => result.current.setDraftAction('new action'));

    await act(async () => {
      await result.current.submitTile();
    });

    expect(updateCustomTile).toHaveBeenCalledTimes(1);
    expect(updateCustomTile.mock.calls[0][0]).toBe(9);
    expect(addCustomTile).not.toHaveBeenCalled();
  });
});
