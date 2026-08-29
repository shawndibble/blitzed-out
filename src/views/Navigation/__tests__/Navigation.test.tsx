import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dayjs from 'dayjs';

import Navigation from '../index';
import type { ScheduleItem } from '@/context/schedule';

let schedule: ScheduleItem[] = [];

vi.mock('@/context/hooks/useSchedule', () => ({
  default: () => ({
    schedule,
    addToSchedule: vi.fn(),
    updateScheduledGame: vi.fn(),
    deleteScheduledGame: vi.fn(),
  }),
}));

vi.mock('@/views/Navigation/MenuDrawer', () => ({
  default: () => <div data-testid="menu-drawer" />,
}));

vi.mock('@/components/CastButton', () => ({
  default: () => null,
}));

vi.mock('@/views/Schedule', () => ({
  default: () => <div data-testid="schedule-dialog" />,
}));

function scheduledGame(): ScheduleItem {
  return { id: '1', dateTime: dayjs().add(1, 'hour'), url: '/PUBLIC', room: 'PUBLIC' };
}

describe('Navigation', () => {
  beforeEach(() => {
    schedule = [];
  });

  it('hides the schedule button when no games are upcoming', () => {
    render(<Navigation room="PUBLIC" />);

    expect(screen.queryByRole('button', { name: /schedule game/i })).not.toBeInTheDocument();
  });

  it('shows the schedule button when a game is upcoming', () => {
    schedule = [scheduledGame()];

    render(<Navigation room="PUBLIC" />);

    expect(screen.getByRole('button', { name: /schedule game/i })).toBeInTheDocument();
  });

  it('shows the upcoming count on the schedule button until it is opened', async () => {
    schedule = [scheduledGame()];

    render(<Navigation room="PUBLIC" />);

    expect(screen.getByText('1')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /schedule game/i }));

    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /schedule game/i })).toBeInTheDocument();
  });

  it('keeps the schedule button mounted while the dialog is open and the list empties', async () => {
    schedule = [scheduledGame()];

    const { rerender } = render(<Navigation room="PUBLIC" />);
    await userEvent.click(screen.getByRole('button', { name: /schedule game/i }));
    expect(await screen.findByTestId('schedule-dialog')).toBeInTheDocument();

    schedule = [];
    rerender(<Navigation room="PUBLIC" />);

    expect(screen.getByRole('button', { name: /schedule game/i })).toBeInTheDocument();
  });
});
