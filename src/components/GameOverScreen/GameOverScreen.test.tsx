import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GameOverScreen from './index';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'testroom' }),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

const mockSendUserToStart = vi.fn().mockResolvedValue(undefined);
vi.mock('@/hooks/useReturnToStart', () => ({
  default: () => mockSendUserToStart,
}));

const mockUpdateGameBoard = vi.fn().mockResolvedValue({});
vi.mock('@/hooks/useGameBoard', () => ({
  default: () => mockUpdateGameBoard,
}));

const settingsState = { hapticFeedback: false };
vi.mock('@/stores/settingsStore', () => ({
  useSettings: () => [settingsState, vi.fn()],
}));

const mockVibrate = vi.fn();
vi.mock('@/utils/haptics', () => ({
  vibrate: (pattern: string) => mockVibrate(pattern),
}));

function renderScreen(props: Partial<Parameters<typeof GameOverScreen>[0]> = {}) {
  return render(
    <MemoryRouter>
      <GameOverScreen open outcome="cum" close={vi.fn()} {...props} />
    </MemoryRouter>
  );
}

describe('GameOverScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settingsState.hapticFeedback = false;
  });

  it('shows the outcome as hero text with its subline', () => {
    renderScreen({ outcome: 'ruined' });
    expect(screen.getByText('ruined')).toBeInTheDocument();
    expect(screen.getByText('finishSublineRuined')).toBeInTheDocument();
  });

  it('falls back to the finish label without a subline for unknown outcomes', () => {
    renderScreen({ outcome: null });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText(/finishSubline/)).not.toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    renderScreen({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('rebuild board (primary) rebuilds the board and returns to start', async () => {
    const close = vi.fn();
    renderScreen({ close });
    fireEvent.click(screen.getByRole('button', { name: 'rebuildBoard' }));
    await waitFor(() => expect(close).toHaveBeenCalled());
    expect(mockUpdateGameBoard).toHaveBeenCalledWith(
      expect.objectContaining({ boardUpdated: true })
    );
    expect(mockSendUserToStart).toHaveBeenCalled();
  });

  it('same board (via dropdown) returns to start without rebuilding', async () => {
    const close = vi.fn();
    renderScreen({ close });
    fireEvent.click(screen.getByRole('button', { name: 'moreOptions' }));
    fireEvent.click(screen.getByText('sameBoard'));
    await waitFor(() => expect(close).toHaveBeenCalled());
    expect(mockSendUserToStart).toHaveBeenCalled();
    expect(mockUpdateGameBoard).not.toHaveBeenCalled();
  });

  it('change settings (via dropdown) navigates to the room settings page', () => {
    const close = vi.fn();
    renderScreen({ close });
    fireEvent.click(screen.getByRole('button', { name: 'moreOptions' }));
    fireEvent.click(screen.getByText('changeSettings'));
    expect(close).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/TESTROOM/settings');
  });

  it('close button dismisses without triggering any action', () => {
    const close = vi.fn();
    renderScreen({ close });
    fireEvent.click(screen.getByRole('button', { name: 'close' }));
    expect(close).toHaveBeenCalled();
    expect(mockSendUserToStart).not.toHaveBeenCalled();
    expect(mockUpdateGameBoard).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('fires a haptic pulse on reveal when haptics are enabled', () => {
    settingsState.hapticFeedback = true;
    renderScreen();
    expect(mockVibrate).toHaveBeenCalledWith('medium');
  });

  it('stays silent on reveal when haptics are disabled', () => {
    renderScreen();
    expect(mockVibrate).not.toHaveBeenCalled();
  });

  it('dropdown exposes all three choices with descriptions', () => {
    renderScreen();
    fireEvent.click(screen.getByRole('button', { name: 'moreOptions' }));
    for (const key of [
      'rebuildBoardDescription',
      'sameBoard',
      'sameBoardDescription',
      'changeSettings',
      'changeSettingsDescription',
    ]) {
      expect(screen.getByText(key)).toBeInTheDocument();
    }
  });
});
