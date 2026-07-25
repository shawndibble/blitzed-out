import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import ActionCard from '../index';
import type { TurnFields } from '@/types/Message';

function makeTurn(overrides: Partial<TurnFields> = {}): TurnFields {
  return {
    kind: 'normal',
    roll: 2,
    location: 6,
    title: 'Spanking',
    description: '10 swats',
    finished: false,
    ...overrides,
  };
}

describe('ActionCard', () => {
  it('reconstructs the #N: title header and shows the description from turn fields', () => {
    render(
      <ActionCard
        open
        text="Roll: 2\n#7: Spanking\nAction: 10 swats"
        turn={makeTurn()}
        displayName="Alex"
        handleClose={vi.fn()}
        nextPlayer={null}
      />
    );

    expect(screen.getByText('#7: Spanking for Alex')).toBeInTheDocument();
    expect(screen.getByText('10 swats')).toBeInTheDocument();
  });

  it('shows the game-over screen for my own finished turn', () => {
    render(
      <ActionCard
        open
        text="Roll: 5\n#40: FINISH\nAction: cum"
        turn={makeTurn({ location: 39, title: 'FINISH', description: 'cum', finished: true })}
        displayName="Alex"
        handleClose={vi.fn()}
        nextPlayer={null}
        isMyMessage
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // GameOverScreen replaces the normal card entirely -- no auto-close progress bar.
    expect(screen.queryByLabelText('autoCloseProgress')).not.toBeInTheDocument();
  });

  it("does not show the game-over screen for another player's finished turn", () => {
    render(
      <ActionCard
        open
        text="Roll: 5\n#40: FINISH\nAction: cum"
        turn={makeTurn({ location: 39, title: 'FINISH', description: 'cum', finished: true })}
        displayName="Alex"
        handleClose={vi.fn()}
        nextPlayer={null}
        isMyMessage={false}
      />
    );

    // The normal (non-game-over) card renders an auto-close progress bar;
    // GameOverScreen does not.
    expect(screen.getByLabelText('autoCloseProgress')).toBeInTheDocument();
    expect(screen.getByText('#40: FINISH for Alex')).toBeInTheDocument();
  });
});
