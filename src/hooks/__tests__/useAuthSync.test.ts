import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@/types';
import {
  intelligentSync as intelligentSyncService,
  startPeriodicSync,
  stopPeriodicSync,
  syncAllDataToFirebase,
  syncDataFromFirebase,
} from '@/services/syncService';
import { useAuthSync } from '../useAuthSync';

// Auto-mock — implementations set per-test in beforeEach (resetMocks: true in vitest config)
vi.mock('@/services/syncService');

const makeUser = (isAnonymous = false): User => ({ uid: 'u1', isAnonymous }) as User;

describe('useAuthSync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'requestIdleCallback', { value: undefined, writable: true });
    vi.mocked(syncDataFromFirebase).mockResolvedValue(true);
    vi.mocked(syncAllDataToFirebase).mockResolvedValue(true);
    vi.mocked(startPeriodicSync).mockReturnValue(true);
    vi.mocked(stopPeriodicSync).mockReturnValue(true);
    vi.mocked(intelligentSyncService).mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with syncing=false and lastSync=null', () => {
    const { result } = renderHook(() => useAuthSync(null));
    expect(result.current.syncStatus).toEqual({ syncing: false, lastSync: null });
  });

  it('does not trigger sync for null user', async () => {
    renderHook(() => useAuthSync(null));
    await act(() => vi.advanceTimersByTimeAsync(10_000));
    expect(syncDataFromFirebase).not.toHaveBeenCalled();
  });

  it('does not trigger sync for anonymous user', async () => {
    renderHook(() => useAuthSync(makeUser(true)));
    await act(() => vi.advanceTimersByTimeAsync(10_000));
    expect(syncDataFromFirebase).not.toHaveBeenCalled();
  });

  it('stops periodic sync when user is null', async () => {
    renderHook(() => useAuthSync(null));
    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(stopPeriodicSync).toHaveBeenCalled();
  });

  it('stops periodic sync when user is anonymous', async () => {
    renderHook(() => useAuthSync(makeUser(true)));
    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(stopPeriodicSync).toHaveBeenCalled();
  });

  it('triggers syncDataFromFirebase after 5s+3s fallback delay for real user', async () => {
    renderHook(() => useAuthSync(makeUser()));

    // Before fallback fires
    await act(() => vi.advanceTimersByTimeAsync(7_999));
    expect(syncDataFromFirebase).not.toHaveBeenCalled();

    // After 5s fallback + 3s debounce = 8s
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(syncDataFromFirebase).toHaveBeenCalledTimes(1);
    expect(startPeriodicSync).toHaveBeenCalledTimes(1);
  });

  it('sets syncing=false with lastSync after auto-sync completes', async () => {
    const { result } = renderHook(() => useAuthSync(makeUser()));

    await act(() => vi.advanceTimersByTimeAsync(8_000));

    expect(result.current.syncStatus.syncing).toBe(false);
    expect(result.current.syncStatus.lastSync).toBeInstanceOf(Date);
  });

  it('uses requestIdleCallback when available', async () => {
    const idleCb = vi.fn((cb: () => void) => cb());
    Object.defineProperty(window, 'requestIdleCallback', { value: idleCb, writable: true });

    renderHook(() => useAuthSync(makeUser()));

    await act(() => vi.advanceTimersByTimeAsync(3_000));
    expect(idleCb).toHaveBeenCalled();
    expect(syncDataFromFirebase).toHaveBeenCalledTimes(1);

    Object.defineProperty(window, 'requestIdleCallback', { value: undefined, writable: true });
  });

  it('syncData calls syncAllDataToFirebase and updates status', async () => {
    const { result } = renderHook(() => useAuthSync(makeUser()));

    await act(async () => {
      await result.current.syncData();
    });

    expect(syncAllDataToFirebase).toHaveBeenCalledTimes(1);
    expect(result.current.syncStatus.lastSync).toBeInstanceOf(Date);
  });

  it('syncData returns false for null user without calling service', async () => {
    const { result } = renderHook(() => useAuthSync(null));

    let returned: boolean;
    await act(async () => {
      returned = await result.current.syncData();
    });

    expect(returned!).toBe(false);
    expect(syncAllDataToFirebase).not.toHaveBeenCalled();
  });

  it('syncData returns false for anonymous user', async () => {
    const { result } = renderHook(() => useAuthSync(makeUser(true)));

    let returned: boolean;
    await act(async () => {
      returned = await result.current.syncData();
    });

    expect(returned!).toBe(false);
    expect(syncAllDataToFirebase).not.toHaveBeenCalled();
  });

  it('intelligentSync delegates to syncService and returns result', async () => {
    const { result } = renderHook(() => useAuthSync(makeUser()));

    let syncResult: { success: boolean; conflicts?: string[] };
    await act(async () => {
      syncResult = await result.current.intelligentSync();
    });

    expect(intelligentSyncService).toHaveBeenCalledTimes(1);
    expect(syncResult!).toEqual({ success: true });
  });

  it('intelligentSync returns failure without calling service for null user', async () => {
    const { result } = renderHook(() => useAuthSync(null));

    let syncResult: { success: boolean; conflicts?: string[] };
    await act(async () => {
      syncResult = await result.current.intelligentSync();
    });

    expect(intelligentSyncService).not.toHaveBeenCalled();
    expect(syncResult!.success).toBe(false);
  });

  it('stops sync and clears timers on unmount', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const { unmount } = renderHook(() => useAuthSync(makeUser()));
    await act(() => vi.advanceTimersByTimeAsync(1_000));

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('user switching from real to null stops periodic sync', async () => {
    let user: User | null = makeUser();
    const { rerender } = renderHook(() => useAuthSync(user));

    await act(() => vi.advanceTimersByTimeAsync(8_000));

    vi.clearAllMocks();
    // Re-set implementations after clearAllMocks
    vi.mocked(stopPeriodicSync).mockReturnValue(true);

    user = null;
    rerender();

    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(stopPeriodicSync).toHaveBeenCalled();
  });
});
