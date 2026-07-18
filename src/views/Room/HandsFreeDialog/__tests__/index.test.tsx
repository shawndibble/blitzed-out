import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import HandsFreeDialog from '@/views/Room/HandsFreeDialog';
import type { Settings } from '@/types/Settings';

const updateSettings = vi.fn();
let mockSettings: Partial<Settings>;

vi.mock('@/stores/settingsStore', () => ({
  useSettings: () => [mockSettings, updateSettings],
}));

vi.mock('@/views/GameSettings/sections/VoiceRows', () => ({
  default: () => <div data-testid="voice-rows" />,
}));

const trackFeatureUsage = vi.fn();
vi.mock('@/services/analytics', () => ({
  analytics: { trackFeatureUsage: (...args: unknown[]) => trackFeatureUsage(...args) },
}));

describe('HandsFreeDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSettings = { gameMode: 'solo', room: 'PUBLIC', boardUpdated: false };
  });

  it('enabling writes handsFree, default preset, and readRoll', () => {
    render(<HandsFreeDialog open onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('switch'));

    expect(updateSettings).toHaveBeenCalledWith({
      handsFree: true,
      handsFreePreset: 'standard',
      readRoll: true,
    });
    expect(trackFeatureUsage).toHaveBeenCalledWith(
      expect.objectContaining({ feature_name: 'hands_free', interaction_type: 'enable' })
    );
  });

  it('disabling only clears handsFree', () => {
    mockSettings.handsFree = true;
    mockSettings.handsFreePreset = 'quick';
    render(<HandsFreeDialog open onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('switch'));

    expect(updateSettings).toHaveBeenCalledWith({ handsFree: false });
  });

  it('keeps an existing preset when re-enabling', () => {
    mockSettings.handsFreePreset = 'extended';
    render(<HandsFreeDialog open onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('switch'));

    expect(updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ handsFree: true, handsFreePreset: 'extended' })
    );
  });

  it('selecting a preset writes handsFreePreset', () => {
    mockSettings.handsFree = true;
    render(<HandsFreeDialog open onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /quick/i }));

    expect(updateSettings).toHaveBeenCalledWith({ handsFreePreset: 'quick' });
  });

  it('renders voice configuration', () => {
    render(<HandsFreeDialog open onClose={vi.fn()} />);
    expect(screen.getByTestId('voice-rows')).toBeInTheDocument();
  });
});
