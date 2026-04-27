import { renderWithoutProviders } from '@/test-utils';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dayjs from 'dayjs';
import { describe, expect, it, vi } from 'vitest';
import ScheduleItem from './index';

const makeGame = (overrides = {}) => ({
  id: 'schedule-1',
  dateTime: {
    toDate: () => new Date('2030-01-02T20:30:00'),
  },
  url: 'https://example.com/original',
  room: 'PUBLIC',
  createdBy: 'owner-user',
  ...overrides,
});

describe('ScheduleItem', () => {
  it('shows edit and delete controls only for the user who created the schedule item', () => {
    const { rerender } = renderWithoutProviders(
      <ScheduleItem
        game={makeGame()}
        currentUserId="owner-user"
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /edit scheduled game/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete scheduled game/i })).toBeInTheDocument();

    rerender(
      <ScheduleItem
        game={makeGame()}
        currentUserId="other-user"
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /edit scheduled game/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /delete scheduled game/i })
    ).not.toBeInTheDocument();
  });

  it('lets the owner update the scheduled date and URL', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn().mockResolvedValue(undefined);

    renderWithoutProviders(
      <ScheduleItem
        game={makeGame()}
        currentUserId="owner-user"
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /edit scheduled game/i }));

    const dateInput = screen.getByLabelText(/date/i);
    const urlInput = screen.getByLabelText(/camUrl/i);

    fireEvent.change(dateInput, { target: { value: '2030-01-03T21:45' } });
    await user.clear(urlInput);
    await user.type(urlInput, 'https://example.com/updated');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onUpdate).toHaveBeenCalledWith('schedule-1', {
      dateTime: dayjs('2030-01-03T21:45').toDate(),
      url: 'https://example.com/updated',
    });
  });

  it('requires owner confirmation before deleting a scheduled game', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);

    renderWithoutProviders(
      <ScheduleItem
        game={makeGame()}
        currentUserId="owner-user"
        onUpdate={vi.fn()}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByRole('button', { name: /delete scheduled game/i }));

    expect(onDelete).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(onDelete).toHaveBeenCalledWith('schedule-1');
  });
});
