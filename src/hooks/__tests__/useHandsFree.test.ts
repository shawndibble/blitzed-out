import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useHandsFree from '@/hooks/useHandsFree';
import type { Settings } from '@/types/Settings';

let mockSettings: Partial<Settings>;
const updateSettings = vi.fn((partial: Partial<Settings>) => {
  mockSettings = { ...mockSettings, ...partial };
});

vi.mock('@/stores/settingsStore', () => ({
  useSettings: () => [mockSettings, updateSettings],
}));

const trackFeatureUsage = vi.fn();
vi.mock('@/services/analytics', () => ({
  analytics: { trackFeatureUsage: (...args: unknown[]) => trackFeatureUsage(...args) },
}));

describe('useHandsFree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSettings = { gameMode: 'solo', room: 'PUBLIC', boardUpdated: false };
  });

  it('enable() writes handsFree, the resolved preset, forced readRoll, and the pre-enable memo', () => {
    mockSettings.readRoll = false;
    const { result } = renderHook(() => useHandsFree());

    act(() => result.current.toggle(true));

    expect(updateSettings).toHaveBeenCalledWith({
      handsFree: true,
      handsFreePreset: 'standard',
      readRoll: true,
      readRollBeforeHandsFree: false,
    });
  });

  it('disable() restores readRoll from the memo, defaulting to false when unset', () => {
    mockSettings.handsFree = true;
    const { result } = renderHook(() => useHandsFree());

    act(() => result.current.disable());

    expect(updateSettings).toHaveBeenCalledWith({ handsFree: false, readRoll: false });
  });

  it('disable() restores readRoll: true when the memo says TTS was on before Hands-Free', () => {
    mockSettings.handsFree = true;
    mockSettings.readRollBeforeHandsFree = true;
    const { result } = renderHook(() => useHandsFree());

    act(() => result.current.disable());

    expect(updateSettings).toHaveBeenCalledWith({ handsFree: false, readRoll: true });
  });

  it('enable() is a no-op while already enabled, so a repeat call cannot clobber the memo with the forced-true readRoll', () => {
    // Already on: readRoll is forced true and the memo already holds the
    // real pre-enable value. A caller invoking enable() again (e.g. a
    // second Switch onChange firing before state settles) must not
    // overwrite that memo with `true` just because readRoll now reads true.
    mockSettings.handsFree = true;
    mockSettings.readRoll = true;
    mockSettings.readRollBeforeHandsFree = false;
    const { result } = renderHook(() => useHandsFree());

    act(() => result.current.toggle(true));

    expect(updateSettings).not.toHaveBeenCalled();
  });

  it('disable() is a no-op while already disabled', () => {
    mockSettings.handsFree = false;
    const { result } = renderHook(() => useHandsFree());

    act(() => result.current.disable());

    expect(updateSettings).not.toHaveBeenCalled();
  });

  it('setPreset() writes only handsFreePreset', () => {
    const { result } = renderHook(() => useHandsFree());

    act(() => result.current.setPreset('quick'));

    expect(updateSettings).toHaveBeenCalledWith({ handsFreePreset: 'quick' });
  });
});
