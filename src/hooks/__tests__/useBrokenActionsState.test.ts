import { renderHook } from '@testing-library/react';
import useBrokenActionsState from '../useBrokenActionsState';
import { GroupedActions } from '@/types/customTiles';
import { describe, it, expect, vi } from 'vitest';

// Mock the migration context
vi.mock('@/context/migration', () => ({
  useMigration: vi.fn(() => ({
    isMigrationInProgress: false,
    currentLanguageMigrated: true,
    isMigrationCompleted: true,
    error: null,
    isHealthy: true,
    recoveryAttempted: false,
    triggerMigration: vi.fn(),
    ensureLanguageMigrated: vi.fn(),
    forceRecovery: vi.fn(),
  })),
}));

describe('useBrokenActionsState', () => {
  it('should return not broken when loading', () => {
    const actionsList: GroupedActions = {};
    const isLoading = true;

    const { result } = renderHook(() => useBrokenActionsState(actionsList, isLoading));

    expect(result.current.isBroken).toBe(false);
    expect(result.current.hasNoActions).toBe(false);
  });

  it('should return broken when not loading and actionsList is empty', () => {
    const actionsList: GroupedActions = {};
    const isLoading = false;

    const { result } = renderHook(() => useBrokenActionsState(actionsList, isLoading));

    expect(result.current.isBroken).toBe(true);
    expect(result.current.hasNoActions).toBe(true);
  });

  it('should return broken when not loading and actionsList is null/undefined', () => {
    const actionsList = null as any;
    const isLoading = false;

    const { result } = renderHook(() => useBrokenActionsState(actionsList, isLoading));

    expect(result.current.isBroken).toBe(true);
    expect(result.current.hasNoActions).toBe(true);
  });

  it('should return not broken when not loading and actionsList has actions', () => {
    const actionsList: GroupedActions = {
      testAction: {
        label: 'Test Action',
        type: 'action',
        actions: { None: [] },
        intensities: {},
      },
    };
    const isLoading = false;

    const { result } = renderHook(() => useBrokenActionsState(actionsList, isLoading));

    expect(result.current.isBroken).toBe(false);
    expect(result.current.hasNoActions).toBe(false);
  });

  it('should update when actionsList changes', () => {
    const { result, rerender } = renderHook(
      ({ actionsList, isLoading }) => useBrokenActionsState(actionsList, isLoading),
      {
        initialProps: {
          actionsList: {} as GroupedActions,
          isLoading: false,
        },
      }
    );

    // Initially broken
    expect(result.current.isBroken).toBe(true);

    // Add actions and rerender
    rerender({
      actionsList: {
        testAction: {
          label: 'Test Action',
          type: 'action',
          actions: { None: [] },
          intensities: {},
        },
      },
      isLoading: false,
    });

    // Should no longer be broken
    expect(result.current.isBroken).toBe(false);
  });

  it('should return not broken when migration is in progress', async () => {
    const { useMigration } = vi.mocked(await import('@/context/migration'));
    useMigration.mockReturnValue({
      isMigrationInProgress: true, // Migration in progress
      currentLanguageMigrated: false,
      isMigrationCompleted: false,
      error: null,
      isHealthy: true,
      recoveryAttempted: false,
      triggerMigration: vi.fn(),
      ensureLanguageMigrated: vi.fn(),
      forceRecovery: vi.fn(),
    });

    const actionsList: GroupedActions = {};
    const isLoading = false;

    const { result } = renderHook(() => useBrokenActionsState(actionsList, isLoading));

    expect(result.current.isBroken).toBe(false);
    expect(result.current.hasNoActions).toBe(false);
  });

  it('should return not broken when current language migration is incomplete', async () => {
    const { useMigration } = vi.mocked(await import('@/context/migration'));
    useMigration.mockReturnValue({
      isMigrationInProgress: false,
      currentLanguageMigrated: false, // Current language not migrated yet
      isMigrationCompleted: false,
      error: null,
      isHealthy: true,
      recoveryAttempted: false,
      triggerMigration: vi.fn(),
      ensureLanguageMigrated: vi.fn(),
      forceRecovery: vi.fn(),
    });

    const actionsList: GroupedActions = {};
    const isLoading = false;

    const { result } = renderHook(() => useBrokenActionsState(actionsList, isLoading));

    expect(result.current.isBroken).toBe(false);
    expect(result.current.hasNoActions).toBe(false);
  });

  it('should return broken only when migration is complete and no actions available', async () => {
    const { useMigration } = vi.mocked(await import('@/context/migration'));
    useMigration.mockReturnValue({
      isMigrationInProgress: false,
      currentLanguageMigrated: true, // Migration complete
      isMigrationCompleted: true,
      error: null,
      isHealthy: true,
      recoveryAttempted: false,
      triggerMigration: vi.fn(),
      ensureLanguageMigrated: vi.fn(),
      forceRecovery: vi.fn(),
    });

    const actionsList: GroupedActions = {};
    const isLoading = false;

    const { result } = renderHook(() => useBrokenActionsState(actionsList, isLoading));

    expect(result.current.isBroken).toBe(true);
    expect(result.current.hasNoActions).toBe(true);
  });
});
