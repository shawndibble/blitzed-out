import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

import { Settings } from '@/types/Settings';
import buildGameBoard from '@/services/buildGame';
import useBoardContentWarnings from '../useBoardContentWarnings';

vi.mock('@/helpers/strings', () => ({
  isPublicRoom: vi.fn(() => false),
  getContentGameMode: vi.fn((gameMode) => (gameMode === 'local' ? 'local' : 'online')),
}));

vi.mock('@/services/buildGame', () => ({
  default: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { resolvedLanguage: 'en' } }),
}));

const mockedBuild = vi.mocked(buildGameBoard);

const baseSettings: Settings = {
  roomTileCount: 40,
  finishRange: [33, 66],
  room: 'testroom',
  gameMode: 'online',
  role: 'sub',
  boardUpdated: false,
  selectedActions: { teasing: { levels: [1, 2], type: 'sex' } },
};

const buildResult = (overrides: Partial<Record<string, unknown>> = {}) => ({
  board: [],
  metadata: {
    totalTiles: 42,
    tilesWithContent: 42,
    selectedGroups: ['teasing'],
    missingGroups: [],
    availableTileCount: 10,
    ...overrides,
  },
});

describe('useBoardContentWarnings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports missing groups from board metadata', async () => {
    mockedBuild.mockResolvedValue(buildResult({ missingGroups: ['absent'] }) as never);

    const { result } = renderHook(() => useBoardContentWarnings(baseSettings));

    await waitFor(() => expect(result.current.missingGroups).toEqual(['absent']));
    expect(result.current.lowContent).toBe(false);
  });

  it('flags low content when fewer than half the slots have content', async () => {
    // tileCount 40 → threshold 20; 10 < 20 → lowContent
    mockedBuild.mockResolvedValue(buildResult({ tilesWithContent: 10 }) as never);

    const { result } = renderHook(() => useBoardContentWarnings(baseSettings));

    await waitFor(() => expect(result.current.lowContent).toBe(true));
  });

  it('reports no warnings when the board is well populated', async () => {
    mockedBuild.mockResolvedValue(buildResult() as never);

    const { result } = renderHook(() => useBoardContentWarnings(baseSettings));

    await waitFor(() => expect(mockedBuild).toHaveBeenCalled());
    expect(result.current.missingGroups).toEqual([]);
    expect(result.current.lowContent).toBe(false);
  });

  it('does not build while settings are still loading (no finishRange)', async () => {
    const loading = { ...baseSettings, finishRange: undefined } as unknown as Settings;

    const { result } = renderHook(() => useBoardContentWarnings(loading));

    // Give the debounce a chance to fire; it should not.
    await new Promise((r) => setTimeout(r, 400));
    expect(mockedBuild).not.toHaveBeenCalled();
    expect(result.current.missingGroups).toEqual([]);
    expect(result.current.lowContent).toBe(false);
  });
});
