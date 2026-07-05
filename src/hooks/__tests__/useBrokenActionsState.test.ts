import { renderHook } from '@testing-library/react';
import useBrokenActionsState from '../useBrokenActionsState';
import { GroupedActions } from '@/types/customTiles';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ContentReadinessPhase } from '@/services/migration/contentReadiness';

const mockStatus = vi.hoisted(() => ({
  phase: 'ready' as ContentReadinessPhase,
  error: null as string | null,
}));

vi.mock('@/services/migration/contentReadiness', () => ({
  useMigrationStatus: () => ({ ...mockStatus, retry: () => Promise.resolve() }),
  waitForContentReady: () => Promise.resolve(),
  initContentReadiness: () => () => {},
}));

const someActions: GroupedActions = {
  testAction: {
    label: 'Test Action',
    type: 'action',
    actions: { None: [] },
    intensities: {},
  },
};

describe('useBrokenActionsState', () => {
  beforeEach(() => {
    mockStatus.phase = 'ready';
    mockStatus.error = null;
  });

  it('returns not broken while loading', () => {
    const { result } = renderHook(() => useBrokenActionsState({}, true));

    expect(result.current.isBroken).toBe(false);
    expect(result.current.hasNoActions).toBe(false);
  });

  it('returns broken when ready, not loading, and actionsList is empty', () => {
    const { result } = renderHook(() => useBrokenActionsState({}, false));

    expect(result.current.isBroken).toBe(true);
    expect(result.current.hasNoActions).toBe(true);
  });

  it('returns broken when ready, not loading, and actionsList is null/undefined', () => {
    const { result } = renderHook(() => useBrokenActionsState(null as any, false));

    expect(result.current.isBroken).toBe(true);
    expect(result.current.hasNoActions).toBe(true);
  });

  it('returns not broken when ready and actions exist', () => {
    const { result } = renderHook(() => useBrokenActionsState(someActions, false));

    expect(result.current.isBroken).toBe(false);
    expect(result.current.hasNoActions).toBe(false);
  });

  it('updates when actionsList changes', () => {
    const { result, rerender } = renderHook(
      ({ actionsList, isLoading }) => useBrokenActionsState(actionsList, isLoading),
      { initialProps: { actionsList: {} as GroupedActions, isLoading: false } }
    );

    expect(result.current.isBroken).toBe(true);

    rerender({ actionsList: someActions, isLoading: false });

    expect(result.current.isBroken).toBe(false);
  });

  it('suppresses broken while seeding', () => {
    mockStatus.phase = 'seeding';

    const { result } = renderHook(() => useBrokenActionsState({}, false));

    expect(result.current.isBroken).toBe(false);
    expect(result.current.hasNoActions).toBe(false);
  });

  it('suppresses broken when degraded — transient seeding failure must not route to the wipe-data screen', () => {
    mockStatus.phase = 'degraded';
    mockStatus.error = 'Content seeding failed for "en"';

    const { result } = renderHook(() => useBrokenActionsState({}, false));

    expect(result.current.isBroken).toBe(false);
    expect(result.current.hasNoActions).toBe(false);
  });

  it('reports broken only when phase is ready and no actions are available', () => {
    mockStatus.phase = 'ready';

    const { result } = renderHook(() => useBrokenActionsState({}, false));

    expect(result.current.isBroken).toBe(true);
    expect(result.current.hasNoActions).toBe(true);
  });
});
