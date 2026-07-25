import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PlayingCard from '../PlayingCard';
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

describe('PlayingCard', () => {
  const setFormData = vi.fn();
  const getPrivateRoom = vi.fn(() => 'REST0');
  const user = userEvent.setup();

  beforeEach(() => {
    setFormData.mockClear();
    getPrivateRoom.mockClear();
  });

  it('renders the title and the three play styles with the current mode selected', () => {
    render(
      <PlayingCard
        formData={baseFormData}
        setFormData={setFormData}
        getPrivateRoom={getPrivateRoom}
      />
    );
    expect(screen.getByText('playing')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'solo' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'playStyleWithOthers' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByRole('button', { name: 'playStyleSharedDevice' })).toBeInTheDocument();
  });

  it('is positioned sticky so it stays visible while scrolling past it', () => {
    const { container } = render(
      <PlayingCard
        formData={baseFormData}
        setFormData={setFormData}
        getPrivateRoom={getPrivateRoom}
      />
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveStyle({ position: 'sticky' });
  });

  it('switching to With Others from a public room generates a private room', async () => {
    render(
      <PlayingCard
        formData={baseFormData}
        setFormData={setFormData}
        getPrivateRoom={getPrivateRoom}
      />
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
      <PlayingCard
        formData={baseFormData}
        setFormData={setFormData}
        getPrivateRoom={getPrivateRoom}
      />
    );
    await user.click(screen.getByRole('button', { name: 'playStyleSharedDevice' }));

    const next = setFormData.mock.calls[0][0];
    expect(next.gameMode).toBe('local');
    expect(next.room).toBe('REST0');
  });

  it('keeps the existing private room when switching modes', async () => {
    render(
      <PlayingCard
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
      <PlayingCard
        formData={baseFormData}
        setFormData={setFormData}
        getPrivateRoom={getPrivateRoom}
      />
    );
    await user.click(screen.getByRole('button', { name: 'solo' }));
    expect(setFormData).not.toHaveBeenCalled();
  });

  describe('info popover', () => {
    it('does not show the explainer until the info button is opened', () => {
      render(
        <PlayingCard
          formData={baseFormData}
          setFormData={setFormData}
          getPrivateRoom={getPrivateRoom}
        />
      );
      expect(screen.queryByText('modeBarHint')).not.toBeInTheDocument();
      expect(screen.queryByText('playersDevicesSoloDesc')).not.toBeInTheDocument();
    });

    it('shows the hint and what each of the three options means when opened', async () => {
      render(
        <PlayingCard
          formData={baseFormData}
          setFormData={setFormData}
          getPrivateRoom={getPrivateRoom}
        />
      );
      await user.click(screen.getByRole('button', { name: 'playersDevicesInfoLabel' }));

      expect(screen.getByText('modeBarHint')).toBeInTheDocument();
      expect(screen.getByText('playersDevicesSoloDesc')).toBeInTheDocument();
      expect(screen.getByText('playersDevicesWithOthersDesc')).toBeInTheDocument();
      expect(screen.getByText('playersDevicesSharedDeviceDesc')).toBeInTheDocument();
    });
  });
});
