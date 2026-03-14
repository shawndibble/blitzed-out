import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ActionCard from './index';

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

vi.mock('@/components/GameOverDialog', () => ({
  default: () => null,
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
});
