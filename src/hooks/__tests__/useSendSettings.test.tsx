import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

import useSendSettings from '../useSendSettings';
import sendGameSettingsMessage from '@/services/gameSettingsMessage';
import { useContentMode, useSettings } from '@/stores/settingsStore';
import { getActiveBoard } from '@/stores/gameBoard';
import type { User } from '@/types';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'PUBLIC' }),
}));

vi.mock('@/services/gameSettingsMessage', () => ({ default: vi.fn(async () => undefined) }));
vi.mock('@/services/roomSettingsService', () => ({
  sendRoomSettingsMessage: vi.fn(async () => undefined),
}));
vi.mock('@/services/dexieActionImport', () => ({ importActions: vi.fn(async () => ({})) }));

vi.mock('@/stores/settingsStore', () => ({
  useSettings: vi.fn(),
  useContentMode: vi.fn(),
}));
vi.mock('@/stores/gameBoard', () => ({ getActiveBoard: vi.fn() }));
vi.mock('@/stores/contentLibrary', () => ({ getActiveTiles: vi.fn(async () => []) }));

// The hook resolves both live queries through useLiveQuery; feed it the board
// for the getActiveBoard querier and mode-fresh tile arrays otherwise, so a
// contentMode switch produces a new customTiles reference (as it would live).
// Known limitation: this mock ignores the deps array, so it pins the
// settingsSent guard but NOT the [contentMode] resubscription itself — that
// stale-querier behavior lives in dexie-react-hooks, not code we own.
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn((querier: () => unknown) =>
    querier === getActiveBoard ? mockBoard : [{ id: 1, action: 'tile' }]
  ),
}));

const mockBoard = {
  id: 1,
  title: 'Board',
  tiles: [{ title: 'Start' }, { title: 'Finish' }],
  isActive: 1,
  tags: [],
  gameMode: 'online',
};

const user = { uid: 'user-1', displayName: 'Tester' } as User;

describe('useSendSettings', () => {
  beforeEach(() => {
    vi.mocked(sendGameSettingsMessage).mockClear();
    vi.mocked(useSettings).mockReturnValue([
      { gameMode: 'online', roomTileCount: 40 },
      vi.fn(),
    ] as any);
    vi.mocked(useContentMode).mockReturnValue('online');
  });

  it('sends game settings once when the board is compatible', async () => {
    renderHook(() => useSendSettings(user, [], false));

    await waitFor(() => expect(sendGameSettingsMessage).toHaveBeenCalledTimes(1));
  });

  it('does not re-send settings on a topology switch when the board is compatible', async () => {
    const { rerender } = renderHook(() => useSendSettings(user, [], false));
    await waitFor(() => expect(sendGameSettingsMessage).toHaveBeenCalledTimes(1));

    // Topology switch: contentMode flips, the getActiveTiles live query re-runs
    // and hands back a fresh customTiles reference, re-running the send effect.
    vi.mocked(useContentMode).mockReturnValue('local');
    rerender();

    // Flush the queued microtask so a would-be duplicate send could land.
    await act(async () => {
      await Promise.resolve();
    });

    // The settingsSent guard swallows the re-run — settings go out once.
    expect(sendGameSettingsMessage).toHaveBeenCalledTimes(1);
  });
});
