import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Settings } from '@/types/Settings';
import type { SubmitContext } from '@/services/gameSettingsOrchestrator';
import type { FirebaseGatewayPort } from '@/services/ports/FirebaseGatewayPort';
import type { GamePersistencePort } from '@/services/ports/GamePersistencePort';
import type { LocalEffects } from '@/services/gameSettingsOrchestrator';
import type { User } from '@/types';
import { submitGameSettings } from '@/services/gameSettingsOrchestrator';
import { useGameSettingsWiring } from '../useGameSettingsWiring';
import useSubmitGameSettings from '../useSubmitGameSettings';

vi.mock('@/hooks/useGameSettingsWiring');
vi.mock('@/services/gameSettingsOrchestrator');

const mockUser: User = { uid: 'u1', displayName: 'Alice', isAnonymous: false } as User;

const mockCtx: SubmitContext = {
  user: mockUser,
  currentRoom: 'PUBLIC',
  currentRoomTileCount: 40,
  messages: [],
  gameBoard: undefined,
  customTiles: [],
  hasLocalPlayers: false,
  settingsSnapshot: {} as Settings,
};

const mockFirebase: FirebaseGatewayPort = {
  updateUser: vi.fn().mockResolvedValue(mockUser),
  sendRoomSettings: vi.fn().mockResolvedValue(undefined),
  sendGameSettings: vi.fn().mockResolvedValue(undefined),
};

const mockPersistence: GamePersistencePort = {
  updateGameBoardTiles: vi
    .fn()
    .mockResolvedValue({ settingsBoardUpdated: true, gameMode: 'online', newBoard: [] }),
  upsertBoard: vi.fn().mockResolvedValue(1),
  createLocalSession: vi.fn().mockResolvedValue(undefined),
  recordGameStart: vi.fn().mockResolvedValue(undefined),
};

const mockEffects: LocalEffects = {
  updateSettings: vi.fn(),
  navigate: vi.fn(),
  translate: vi.fn((k) => k),
};

const mockFormData: Settings = {
  displayName: 'Alice',
  room: 'PUBLIC',
  gameMode: 'online',
} as Settings;

describe('useSubmitGameSettings', () => {
  beforeEach(() => {
    vi.mocked(useGameSettingsWiring).mockReturnValue({
      ctx: mockCtx,
      firebase: mockFirebase,
      persistence: mockPersistence,
      effects: mockEffects,
    });
    vi.mocked(submitGameSettings).mockResolvedValue(undefined);
  });

  it('isSubmitting starts false', () => {
    const { result } = renderHook(() => useSubmitGameSettings());
    expect(result.current.isSubmitting).toBe(false);
  });

  it('error starts null', () => {
    const { result } = renderHook(() => useSubmitGameSettings());
    expect(result.current.error).toBeNull();
  });

  it('isSubmitting is true during submit then false after success', async () => {
    let resolveSubmit!: () => void;
    vi.mocked(submitGameSettings).mockImplementation(
      () =>
        new Promise((r) => {
          resolveSubmit = r;
        })
    );

    const { result } = renderHook(() => useSubmitGameSettings());

    let submitPromise!: Promise<void>;
    act(() => {
      submitPromise = result.current.submit(mockFormData, {});
    });

    expect(result.current.isSubmitting).toBe(true);

    await act(async () => {
      resolveSubmit();
      await submitPromise;
    });
    expect(result.current.isSubmitting).toBe(false);
  });

  it('isSubmitting goes back to false when orchestrator throws', async () => {
    vi.mocked(submitGameSettings).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useSubmitGameSettings());

    await act(async () => {
      await result.current.submit(mockFormData, {}).catch(() => {});
    });

    expect(result.current.isSubmitting).toBe(false);
  });

  it('sets error when orchestrator throws an Error', async () => {
    vi.mocked(submitGameSettings).mockRejectedValue(new Error('oops'));
    const { result } = renderHook(() => useSubmitGameSettings());

    await act(async () => {
      await result.current.submit(mockFormData, {}).catch(() => {});
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('oops');
  });

  it('wraps non-Error throws as Error("Submission failed")', async () => {
    vi.mocked(submitGameSettings).mockRejectedValue('raw string');
    const { result } = renderHook(() => useSubmitGameSettings());

    await act(async () => {
      await result.current.submit(mockFormData, {}).catch(() => {});
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Submission failed');
  });

  it('re-throws the error so callers can react', async () => {
    vi.mocked(submitGameSettings).mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useSubmitGameSettings());

    let caught: Error | undefined;
    await act(async () => {
      await result.current.submit(mockFormData, {}).catch((e) => {
        caught = e;
      });
    });

    expect(caught?.message).toBe('boom');
  });

  it('resets error to null on the next submit', async () => {
    vi.mocked(submitGameSettings)
      .mockRejectedValueOnce(new Error('first'))
      .mockResolvedValue(undefined);

    const { result } = renderHook(() => useSubmitGameSettings());

    await act(async () => {
      await result.current.submit(mockFormData, {}).catch(() => {});
    });
    expect(result.current.error).not.toBeNull();

    await act(async () => {
      await result.current.submit(mockFormData, {});
    });
    expect(result.current.error).toBeNull();
  });

  it('calls submitGameSettings with ctx and port objects from wiring', async () => {
    const actionsList = { someAction: true };
    const { result } = renderHook(() => useSubmitGameSettings());

    await act(async () => {
      await result.current.submit(mockFormData, actionsList);
    });

    expect(submitGameSettings).toHaveBeenCalledWith(
      mockFormData,
      actionsList,
      mockCtx,
      mockFirebase,
      mockPersistence,
      mockEffects
    );
  });
});
