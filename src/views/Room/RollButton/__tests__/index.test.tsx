import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import RollButton from '@/views/Room/RollButton';
import type { Settings } from '@/types/Settings';

let mockSettings: Partial<Settings>;
// Writes through to mockSettings so re-renders observe the settings changes a
// click just made — real behaviour, not a call-history-only stub.
const updateSettings = vi.fn((partial: Partial<Settings>) => {
  mockSettings = { ...mockSettings, ...partial };
});

vi.mock('@/stores/settingsStore', () => {
  const state = () => ({ settings: mockSettings, updateSettings });
  return {
    useSettings: () => [mockSettings, updateSettings],
    useSettingsStore: (selector?: (s: unknown) => unknown) =>
      selector ? selector(state()) : state(),
  };
});

// setupTests' icon proxy lacks a `has` trap, so vitest rejects these named
// imports; mock the icons this component tree actually uses.
vi.mock('@mui/icons-material', () => ({
  ArrowDropUp: () => null,
  Casino: () => null,
  ChangeCircle: () => null,
  Pause: () => null,
  PlayArrow: () => null,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'test-user' } }),
}));

vi.mock('@/services/playerStatsService', () => ({
  recordDiceRoll: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/components/DiceRoller', () => ({
  default: () => null,
}));

vi.mock('@/views/Room/HandsFreeDialog', () => ({
  default: ({ open }: { open: boolean }) => (open ? <div data-testid="hands-free-dialog" /> : null),
}));

vi.mock('@/services/analytics', () => ({
  analytics: { trackEngagement: vi.fn(), trackFeatureUsage: vi.fn() },
}));

const renderRollButton = () =>
  render(<RollButton setRollValue={vi.fn()} dice="1d6" isEndOfBoard={false} />);

const openOptionsMenu = () => {
  fireEvent.click(screen.getByRole('button', { name: 'select roll options' }));
};

describe('RollButton hands-free integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSettings = {
      gameMode: 'solo',
      room: 'PUBLIC',
      boardUpdated: false,
      hasSeenRollButton: true,
    };
  });

  it('shows the play/pause transport when hands-free is on in solo', async () => {
    mockSettings.handsFree = true;
    mockSettings.handsFreePreset = 'quick';
    renderRollButton();

    expect(await screen.findByText(/play \(\d+\)/)).toBeInTheDocument();
  });

  it('keeps the manual roll button when hands-free is off', async () => {
    renderRollButton();

    expect(await screen.findByText('roll')).toBeInTheDocument();
  });

  it('ignores hands-free in online mode', async () => {
    mockSettings.gameMode = 'online';
    mockSettings.handsFree = true;
    renderRollButton();

    expect(await screen.findByText('roll')).toBeInTheDocument();
  });

  it('offers Hands-Free in the roll menu for solo and opens the dialog', () => {
    renderRollButton();
    openOptionsMenu();

    fireEvent.click(screen.getByText('handsFree'));

    expect(screen.getByTestId('hands-free-dialog')).toBeInTheDocument();
  });

  it('hides the Hands-Free menu entry in online mode', () => {
    mockSettings.gameMode = 'online';
    renderRollButton();
    openOptionsMenu();

    expect(screen.queryByText('handsFree')).not.toBeInTheDocument();
  });

  it('switching to manual rolling turns hands-free off and restores readRoll to false when no memo exists', () => {
    mockSettings.handsFree = true;
    mockSettings.readRoll = true;
    renderRollButton();
    openOptionsMenu();

    fireEvent.click(screen.getByText('manual'));

    // Single combined write: no leaked intermediate `{ handsFree: false }` state
    // with `readRoll` still forced on.
    expect(updateSettings).toHaveBeenCalledWith({ handsFree: false, readRoll: false });
    expect(updateSettings).toHaveBeenCalledTimes(1);
  });

  it('switching to manual rolling restores readRoll: true when the memo says TTS was on before Hands-Free', () => {
    mockSettings.handsFree = true;
    mockSettings.readRoll = true;
    mockSettings.readRollBeforeHandsFree = true;
    renderRollButton();
    openOptionsMenu();

    fireEvent.click(screen.getByText('manual'));

    expect(updateSettings).toHaveBeenCalledWith({ handsFree: false, readRoll: true });
  });

  it('exits hands-free via a fixed cadence (Auto-Roll dialog) with exactly one pause transition', async () => {
    mockSettings.handsFree = true;
    mockSettings.handsFreePreset = 'quick';
    mockSettings.readRollBeforeHandsFree = true;
    renderRollButton();

    // Start the hands-free transport running (paused -> playing).
    fireEvent.click(screen.getByRole('button', { name: 'play' }));
    expect(await screen.findByText(/pause \(\d+\)/)).toBeInTheDocument();

    openOptionsMenu();
    fireEvent.click(screen.getByText('autoRoll'));
    fireEvent.click(screen.getByText('shortAuto30'));

    expect(updateSettings).toHaveBeenCalledWith({ handsFree: false, readRoll: true });
    // Exactly one net pause transition (running -> paused at 30s): if the
    // ref-sync effect ordering in RollButton regresses, this fires a second
    // togglePause and the transport is wrongly left running instead.
    expect(await screen.findByText('play (30)')).toBeInTheDocument();
  });

  it('exits hands-free via the custom timer route with exactly one pause transition', async () => {
    mockSettings.handsFree = true;
    mockSettings.handsFreePreset = 'quick';
    mockSettings.readRollBeforeHandsFree = true;
    renderRollButton();

    fireEvent.click(screen.getByRole('button', { name: 'play' }));
    expect(await screen.findByText(/pause \(\d+\)/)).toBeInTheDocument();

    openOptionsMenu();
    fireEvent.click(screen.getByText('autoRoll'));
    fireEvent.click(screen.getByText('customOption'));
    fireEvent.click(screen.getByText('set'));

    expect(updateSettings).toHaveBeenCalledWith({ handsFree: false, readRoll: true });
    expect(await screen.findByText('play (30)')).toBeInTheDocument();
  });
});
