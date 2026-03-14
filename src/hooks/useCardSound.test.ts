import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock the settings store before importing the hook
const mockSettings = {
  mySound: true,
};

vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: vi.fn((selector) => selector({ settings: mockSettings })),
}));

// Track the play function
const mockPlay = vi.fn();
vi.mock('use-sound', () => ({
  default: () => [mockPlay, { stop: vi.fn() }],
}));

import { useCardSound } from './useCardSound';
import { useSettingsStore } from '@/stores/settingsStore';

describe('useCardSound', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSettings.mySound = true;
  });

  it('returns a play function', () => {
    const { result } = renderHook(() => useCardSound());
    expect(typeof result.current).toBe('function');
  });

  it('calls the sound play function when mySound is enabled', () => {
    const { result } = renderHook(() => useCardSound());
    result.current();
    expect(mockPlay).toHaveBeenCalled();
  });

  it('does not play sound when mySound is disabled', () => {
    mockSettings.mySound = false;
    vi.mocked(useSettingsStore).mockImplementation((selector: any) =>
      selector({ settings: mockSettings })
    );

    const { result } = renderHook(() => useCardSound());
    result.current();
    expect(mockPlay).not.toHaveBeenCalled();
  });

  it('returns a no-op function when mySound is disabled', () => {
    mockSettings.mySound = false;
    vi.mocked(useSettingsStore).mockImplementation((selector: any) =>
      selector({ settings: mockSettings })
    );

    const { result } = renderHook(() => useCardSound());
    // The function should exist and be callable without error
    expect(() => result.current()).not.toThrow();
  });
});
