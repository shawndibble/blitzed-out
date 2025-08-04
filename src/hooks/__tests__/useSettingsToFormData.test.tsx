import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import useSettingsToFormData from '../useSettingsToFormData';
import { Settings } from '@/types/Settings';

// Mock the stores and context
vi.mock('@/stores/settingsStore', () => ({
  useSettings: () => [
    {
      gameMode: 'online',
      selectedActions: { testAction: { levels: [1] } },
      // Note: finishRange is intentionally missing to test the default
    },
    vi.fn(),
  ],
}));

vi.mock('@/context/hooks/useMessages', () => ({
  default: () => ({
    messages: [],
  }),
}));

describe('useSettingsToFormData', () => {
  it('should provide default finishRange when not present in settings', () => {
    const defaultSettings: Partial<Settings> = {
      gameMode: 'local',
      room: 'TEST',
    };

    const { result } = renderHook(() => useSettingsToFormData(defaultSettings as Settings, {}));

    const [formData] = result.current;

    // Should have default finishRange
    expect(formData.finishRange).toEqual([30, 70]);
    // Should preserve other settings
    expect(formData.gameMode).toBe('online'); // from mocked settings
    expect(formData.selectedActions).toEqual({ testAction: { levels: [1] } });
  });

  it('should override finishRange with overrideSettings', () => {
    const overrideSettings = {
      finishRange: [20, 80] as [number, number],
    };

    const { result } = renderHook(() => useSettingsToFormData({} as Settings, overrideSettings));

    const [formData] = result.current;

    // Should use override finishRange
    expect(formData.finishRange).toEqual([20, 80]);
  });
});
