import { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@/test-utils';
import ActionCard from '../index';
import { makeTurnFields as makeTurn } from '@/__tests__/fixtures/turnFields.fixtures';

// i18n is not initialised under test, so the global <Trans> mock renders
// nothing for key-only usage. Echo the key instead.
vi.mock('react-i18next', () => ({
  Trans: ({ i18nKey, values }: { i18nKey: string; values?: Record<string, unknown> }) =>
    values?.player != null ? `${i18nKey}:${values.player}` : i18nKey,
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

const TIMED_TEXT = 'Roll: 2\n#7: Spanking\nAction: 30 seconds of swats then 10 seconds of rest';
const FINISH_TURN = makeTurn({
  location: 39,
  title: 'FINISH',
  description: 'cum',
  finished: true,
});

function cardProps(overrides: Partial<ComponentProps<typeof ActionCard>> = {}) {
  return {
    open: true,
    text: 'Roll: 2\n#7: Spanking\nAction: 10 swats',
    turn: makeTurn(),
    displayName: 'Alex',
    handleClose: vi.fn(),
    nextPlayer: null,
    ...overrides,
  };
}

function renderCard(overrides: Partial<ComponentProps<typeof ActionCard>> = {}) {
  return render(<ActionCard {...cardProps(overrides)} />);
}

describe('ActionCard', () => {
  it('reconstructs the #N: title header and shows the description from turn fields', () => {
    renderCard();

    expect(screen.getByText('#7: Spanking for Alex')).toBeInTheDocument();
    expect(screen.getByText('10 swats')).toBeInTheDocument();
  });

  it('renders nothing while closed', () => {
    renderCard({ open: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('names the next player', () => {
    renderCard({
      nextPlayer: { uid: '123', displayName: 'sarah', isSelf: false, isFinished: false },
    });

    expect(screen.getByText('nextPlayersTurn:sarah')).toBeInTheDocument();
  });

  it('names the next player rather than "your turn" on a shared device', () => {
    renderCard({
      nextPlayer: { uid: 'local-2', displayName: 'sarah', isSelf: true, isFinished: false },
      isLocalRoom: true,
    });

    expect(screen.getByText('nextPlayersTurn:sarah')).toBeInTheDocument();
    expect(screen.queryByText('yourTurn')).not.toBeInTheDocument();
  });

  it('says "your turn" when self is next and the device is not shared', () => {
    renderCard({
      nextPlayer: { uid: '123', displayName: 'Alex', isSelf: true, isFinished: false },
    });

    expect(screen.getByText('yourTurn')).toBeInTheDocument();
  });

  it('shows the game-over screen for my own finished turn', () => {
    renderCard({ text: 'Roll: 5\n#40: FINISH\nAction: cum', turn: FINISH_TURN, isMyMessage: true });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // GameOverScreen replaces the normal card entirely -- no auto-close progress bar.
    expect(screen.queryByLabelText('autoCloseProgress')).not.toBeInTheDocument();
  });

  it("does not show the game-over screen for another player's finished turn", () => {
    renderCard({ text: 'Roll: 5\n#40: FINISH\nAction: cum', turn: FINISH_TURN });

    expect(screen.getByLabelText('autoCloseProgress')).toBeInTheDocument();
    expect(screen.getByText('#40: FINISH for Alex')).toBeInTheDocument();
  });
});

describe('ActionCard auto-close', () => {
  const AUTO_CLOSE_MS = 20_000;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const runOutTheClock = (multiple = 1) =>
    act(() => {
      vi.advanceTimersByTime(AUTO_CLOSE_MS * multiple);
    });

  it('closes itself once when the countdown reaches zero', () => {
    const handleClose = vi.fn();
    renderCard({ text: TIMED_TEXT, handleClose });

    runOutTheClock();

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('stops auto-closing once a timer button takes over', () => {
    const handleClose = vi.fn();
    renderCard({ text: TIMED_TEXT, handleClose });

    fireEvent.click(screen.getByRole('button', { name: '30 seconds' }));
    runOutTheClock(2);

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('stays stopped when a second timer button is used', () => {
    const handleClose = vi.fn();
    renderCard({ text: TIMED_TEXT, handleClose });

    fireEvent.click(screen.getByRole('button', { name: '30 seconds' }));
    // The open timer dialog hides the card, so dismiss it before the next click.
    fireEvent.click(screen.getByRole('button', { name: 'close' }));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.click(screen.getByRole('button', { name: '10 seconds' }));
    runOutTheClock(2);

    expect(handleClose).not.toHaveBeenCalled();
    expect(screen.getByText('autoCloseStopped')).toBeInTheDocument();
  });

  it('never auto-closes the game-over screen', () => {
    const handleClose = vi.fn();
    renderCard({
      text: 'Roll: 5\n#40: FINISH\nAction: cum',
      turn: FINISH_TURN,
      isMyMessage: true,
      handleClose,
    });

    runOutTheClock(2);

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('restarts the clock when the same card is shown again', () => {
    const handleClose = vi.fn();
    const { rerender } = renderCard({ text: TIMED_TEXT, handleClose });

    runOutTheClock();
    expect(handleClose).toHaveBeenCalledTimes(1);

    // A repeat roll reads identically, so only `open` marks it as a new card.
    act(() => {
      rerender(<ActionCard {...cardProps({ text: TIMED_TEXT, handleClose, open: false })} />);
    });
    act(() => {
      rerender(<ActionCard {...cardProps({ text: TIMED_TEXT, handleClose })} />);
    });
    runOutTheClock();

    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('restarts the clock and the caption when a new roll replaces an open card', () => {
    const handleClose = vi.fn();
    const { rerender } = renderCard({ text: TIMED_TEXT, handleClose });

    fireEvent.click(screen.getByRole('button', { name: '30 seconds' }));
    act(() => {
      rerender(
        <ActionCard
          {...cardProps({ text: 'Roll: 3\n#8: Edging\nAction: 45 seconds of edging', handleClose })}
        />
      );
    });

    expect(screen.getByText('autoCloseModal')).toBeInTheDocument();

    runOutTheClock();

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
