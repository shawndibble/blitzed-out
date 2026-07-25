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
      readRollBeforeHandsFree: false,
    });
    expect(trackFeatureUsage).toHaveBeenCalledWith(
      expect.objectContaining({ feature_name: 'hands_free', interaction_type: 'enable' })
    );
  });

  it('disabling restores the pre-enable readRoll value', () => {
    mockSettings.handsFree = true;
    mockSettings.handsFreePreset = 'quick';
    mockSettings.readRoll = false;
    mockSettings.readRollBeforeHandsFree = false;
    render(<HandsFreeDialog open onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('switch'));

    expect(updateSettings).toHaveBeenCalledWith({ handsFree: false, readRoll: false });
  });

  it('a fresh mount with Hands-Free already on does not treat the forced readRoll as the pre-enable value', () => {
    // Simulates a page reload while Hands-Free is on: readRoll is already
    // forced true and there is no in-memory memo of what it was before
    // (readRollBeforeHandsFree unset). A ref captured at mount would wrongly
    // read this forced-true value as "the user's original preference" and
    // "restore" it on disable, leaving TTS permanently stuck on. The durable
    // settings-field memo must fall back to false instead.
    mockSettings.handsFree = true;
    mockSettings.handsFreePreset = 'quick';
    mockSettings.readRoll = true;
    render(<HandsFreeDialog open onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('switch'));

    expect(updateSettings).toHaveBeenCalledWith({ handsFree: false, readRoll: false });
  });

  it('a fresh mount honors an explicit pre-enable memo even though readRoll is forced true', () => {
    mockSettings.handsFree = true;
    mockSettings.handsFreePreset = 'quick';
    mockSettings.readRoll = true;
    mockSettings.readRollBeforeHandsFree = true;
    render(<HandsFreeDialog open onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('switch'));

    expect(updateSettings).toHaveBeenCalledWith({ handsFree: false, readRoll: true });
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
