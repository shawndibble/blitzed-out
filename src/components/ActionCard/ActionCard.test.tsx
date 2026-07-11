import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ActionCard from './index';

vi.mock('react-i18next', () => ({
  Trans: ({ i18nKey, values }: { i18nKey: string; values?: Record<string, unknown> }) =>
    values?.player != null ? `${i18nKey}:${values.player}` : i18nKey,
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

vi.mock('@/hooks/useBreakpoint', () => ({
  default: vi.fn(() => false),
}));

vi.mock('@/hooks/useCardSound', () => ({
  useCardSound: () => vi.fn(),
}));

vi.mock('@/hooks/useCountdown', () => ({
  default: () => ({
    timeLeft: 20,
    setTimeLeft: vi.fn(),
    togglePause: vi.fn(),
    isPaused: false,
  }),
}));

vi.mock('@/components/GameOverScreen', () => ({
  default: ({ open }: { open: boolean }) => (open ? <div data-testid="game-over-screen" /> : null),
}));

vi.mock('@/components/CountDownButtonModal', () => ({
  default: ({ textString }: { textString: string }) => <button>{textString}</button>,
}));

describe('ActionCard', () => {
  const defaultProps = {
    open: true,
    text: '#1: Test Tile\nAction: Take a drink',
    displayName: 'TestPlayer',
    handleClose: vi.fn(),
    stopAutoClose: vi.fn(),
    nextPlayer: null,
    isMyMessage: false,
  };

  it('renders when open is true', () => {
    render(<ActionCard {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render card content when open is false', () => {
    render(<ActionCard {...defaultProps} open={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('displays the action text', () => {
    render(<ActionCard {...defaultProps} />);
    expect(screen.getByText('Take a drink')).toBeInTheDocument();
  });

  it('displays the player name', () => {
    render(<ActionCard {...defaultProps} />);
    expect(screen.getByText(/TestPlayer/)).toBeInTheDocument();
  });

  it('shows progress bar', () => {
    render(<ActionCard {...defaultProps} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows next player section when provided', () => {
    const nextPlayer = {
      uid: '123',
      displayName: 'NextPerson',
      isSelf: false,
      isFinished: false,
    };
    render(<ActionCard {...defaultProps} nextPlayer={nextPlayer} />);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('names the next player (not "your turn") in shared-device mode', () => {
    const nextPlayer = {
      uid: 'local-2',
      displayName: 'sarah',
      isSelf: true,
      isFinished: false,
    };
    render(<ActionCard {...defaultProps} nextPlayer={nextPlayer} isLocalRoom />);
    expect(screen.getByText('nextPlayersTurn:sarah')).toBeInTheDocument();
    expect(screen.queryByText('yourTurn')).not.toBeInTheDocument();
  });

  it('shows "your turn" when self is next and not a shared device', () => {
    const nextPlayer = {
      uid: '123',
      displayName: 'NextPerson',
      isSelf: true,
      isFinished: false,
    };
    render(<ActionCard {...defaultProps} nextPlayer={nextPlayer} />);
    expect(screen.getByText('yourTurn')).toBeInTheDocument();
  });

  describe('finish tile (game over)', () => {
    const finishProps = {
      ...defaultProps,
      text: '#40: finish\naction: ruined',
      isMyMessage: true,
    };

    it('renders the game-over screen instead of the action card', () => {
      render(<ActionCard {...finishProps} />);
      expect(screen.getByTestId('game-over-screen')).toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('stops the auto-close timer', () => {
      const stopAutoClose = vi.fn();
      render(<ActionCard {...finishProps} stopAutoClose={stopAutoClose} />);
      expect(stopAutoClose).toHaveBeenCalled();
    });

    it("shows the normal card for another player's finish", () => {
      render(<ActionCard {...finishProps} isMyMessage={false} />);
      expect(screen.queryByTestId('game-over-screen')).not.toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });
});
