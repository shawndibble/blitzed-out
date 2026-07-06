import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ModeBar from '../ModeBar';
import type { Settings } from '@/types/Settings';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const baseFormData = {
  gameMode: 'solo',
  room: 'PUBLIC',
  boardUpdated: false,
  selectedActions: {},
} as unknown as Settings;

describe('ModeBar', () => {
  const setFormData = vi.fn();
  const getPrivateRoom = vi.fn(() => 'REST0');
  const user = userEvent.setup();

  beforeEach(() => {
    setFormData.mockClear();
    getPrivateRoom.mockClear();
  });

  it('renders the three play styles with the current mode selected', () => {
    render(
      <ModeBar formData={baseFormData} setFormData={setFormData} getPrivateRoom={getPrivateRoom} />
    );
    expect(screen.getByRole('button', { name: 'solo' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'playStyleWithOthers' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByRole('button', { name: 'playStyleSharedDevice' })).toBeInTheDocument();
  });

  it('switching to With Others from a public room generates a private room', async () => {
    render(
      <ModeBar formData={baseFormData} setFormData={setFormData} getPrivateRoom={getPrivateRoom} />
    );
    await user.click(screen.getByRole('button', { name: 'playStyleWithOthers' }));

    expect(setFormData).toHaveBeenCalledTimes(1);
    const next = setFormData.mock.calls[0][0];
    expect(next.gameMode).toBe('online');
    expect(next.room).toBe('REST0');
    expect(getPrivateRoom).toHaveBeenCalledTimes(1);
    expect(next.boardUpdated).toBe(true);
  });

  it('switching to Shared Device from a public room generates a private room', async () => {
    render(
      <ModeBar formData={baseFormData} setFormData={setFormData} getPrivateRoom={getPrivateRoom} />
    );
    await user.click(screen.getByRole('button', { name: 'playStyleSharedDevice' }));

    const next = setFormData.mock.calls[0][0];
    expect(next.gameMode).toBe('local');
    expect(next.room).toBe('REST0');
  });

  it('keeps the existing private room when switching modes', async () => {
    render(
      <ModeBar
        formData={{ ...baseFormData, room: 'KHLOE' }}
        setFormData={setFormData}
        getPrivateRoom={getPrivateRoom}
      />
    );
    await user.click(screen.getByRole('button', { name: 'playStyleWithOthers' }));

    const next = setFormData.mock.calls[0][0];
    expect(next.room).toBe('KHLOE');
    expect(next.gameMode).toBe('online');
    expect(getPrivateRoom).not.toHaveBeenCalled();
  });

  it('re-selecting the current mode does nothing', async () => {
    render(
      <ModeBar formData={baseFormData} setFormData={setFormData} getPrivateRoom={getPrivateRoom} />
    );
    await user.click(screen.getByRole('button', { name: 'solo' }));
    expect(setFormData).not.toHaveBeenCalled();
  });
});
