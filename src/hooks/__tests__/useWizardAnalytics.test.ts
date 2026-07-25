import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWizardAnalytics } from '../useWizardAnalytics';

const trackWizardScreenView = vi.fn();
const trackWizardCompleted = vi.fn();
const trackWizardAbandoned = vi.fn();

vi.mock('@/services/analytics', () => ({
  analytics: {
    trackWizardScreenView: (...args: unknown[]) => trackWizardScreenView(...args),
    trackWizardCompleted: (...args: unknown[]) => trackWizardCompleted(...args),
    trackWizardAbandoned: (...args: unknown[]) => trackWizardAbandoned(...args),
  },
}));

describe('useWizardAnalytics — screen name resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Pins the step-number -> analytics screen-name table. This is the safety
  // net for absorbing stepConfig.ts's getWizardStepName into the flow module:
  // these assertions must still hold, unchanged, after that move.
  it.each([
    [0, 'advanced_settings'],
    [1, 'player_topology'],
    [2, 'player_details'],
    [3, 'game_mode'],
    [4, 'actions'],
    [5, 'finish'],
    [6, 'step_6'], // unmapped step falls back to step_${n}
  ])('step %i maps to screen name %s', (step, expectedName) => {
    const { result } = renderHook(() =>
      useWizardAnalytics({ gameMode: 'online', isPublicRoom: true })
    );

    result.current.trackScreenView(step);

    expect(trackWizardScreenView).toHaveBeenCalledWith(expectedName, 'online', 'public');
  });

  it('step 2 carries the same screen name for both room and local-players screens', () => {
    // wizardStep 2 is one analytics screen shared by two different step
    // components (RoomStep for online, LocalPlayersStep for local) — the
    // flow module must not split this into per-component ids.
    const { result: onlineResult } = renderHook(() =>
      useWizardAnalytics({ gameMode: 'online', isPublicRoom: false })
    );
    const { result: localResult } = renderHook(() =>
      useWizardAnalytics({ gameMode: 'local', isPublicRoom: false })
    );

    onlineResult.current.trackScreenView(2);
    localResult.current.trackScreenView(2);

    expect(trackWizardScreenView).toHaveBeenNthCalledWith(1, 'player_details', 'online', 'private');
    expect(trackWizardScreenView).toHaveBeenNthCalledWith(2, 'player_details', 'local', 'private');
  });

  it('does not re-emit a screen view for the same step in a row', () => {
    const { result } = renderHook(() =>
      useWizardAnalytics({ gameMode: 'solo', isPublicRoom: true })
    );

    result.current.trackScreenView(1);
    result.current.trackScreenView(1);

    expect(trackWizardScreenView).toHaveBeenCalledTimes(1);
  });
});
