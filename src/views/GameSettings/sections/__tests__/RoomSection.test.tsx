import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RoomSection from '../RoomSection';
import type { Settings } from '@/types/Settings';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ i18nKey }: any) => <span>{i18nKey}</span>,
}));

vi.mock('../LocalPlayersRows', () => ({
  default: () => <div data-testid="local-players-rows" />,
}));

const makeFormData = (overrides: Partial<Settings>): Settings =>
  ({
    gameMode: 'solo',
    room: 'PUBLIC',
    boardUpdated: false,
    selectedActions: {},
    ...overrides,
  }) as unknown as Settings;

describe('RoomSection', () => {
  const setFormData = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    setFormData.mockClear();
  });

  describe('solo mode', () => {
    it('shows the public/private toggle — the only mode where the choice exists', () => {
      render(<RoomSection formData={makeFormData({})} setFormData={setFormData} />);
      expect(screen.getByRole('switch', { name: 'roomType' })).toBeInTheDocument();
      expect(screen.queryByTestId('local-players-rows')).not.toBeInTheDocument();
      expect(screen.queryByRole('group', { name: 'playerListUpdates' })).not.toBeInTheDocument();
    });

    it('flipping to private generates a room code', async () => {
      render(<RoomSection formData={makeFormData({})} setFormData={setFormData} />);
      await user.click(screen.getByRole('switch', { name: 'roomType' }));

      const next = setFormData.mock.calls[0][0];
      expect(next.room).toMatch(/^[1-9A-HJ-NP-Z]{5}$/);
    });

    it('flipping a private room to public sets PUBLIC', async () => {
      render(<RoomSection formData={makeFormData({ room: 'KHLOE' })} setFormData={setFormData} />);
      await user.click(screen.getByRole('switch', { name: 'roomType' }));
      expect(setFormData.mock.calls[0][0].room).toBe('PUBLIC');
    });

    it('locks room background behind a private room in a public room', () => {
      render(<RoomSection formData={makeFormData({})} setFormData={setFormData} />);
      expect(screen.getByText('roomBackgroundLocked')).toBeInTheDocument();
      expect(screen.queryByRole('textbox', { name: 'roomBackground' })).not.toBeInTheDocument();
    });
  });

  describe('with others (online)', () => {
    it('shows the room code card instead of a public/private toggle', () => {
      render(
        <RoomSection
          formData={makeFormData({ gameMode: 'online', room: 'KHLOE' })}
          setFormData={setFormData}
        />
      );
      expect(screen.queryByRole('switch', { name: 'roomType' })).not.toBeInTheDocument();
      expect(screen.getByText('alwaysPrivateRoomHint')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'copy' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /newRoomCode/ })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'playerListUpdates' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'roomBackground' })).toBeInTheDocument();
    });

    it('New code generates a fresh private room', async () => {
      render(
        <RoomSection
          formData={makeFormData({ gameMode: 'online', room: 'KHLOE' })}
          setFormData={setFormData}
        />
      );
      await user.click(screen.getByRole('button', { name: /newRoomCode/ }));

      const next = setFormData.mock.calls[0][0];
      expect(next.room).toMatch(/^[1-9A-HJ-NP-Z]{5}$/);
      expect(next.room).not.toBe('KHLOE');
    });
  });

  describe('shared device (local)', () => {
    it('hides all room plumbing and shows player setup instead', () => {
      render(
        <RoomSection
          formData={makeFormData({ gameMode: 'local', room: 'KHLOE' })}
          setFormData={setFormData}
        />
      );
      expect(screen.queryByRole('switch', { name: 'roomType' })).not.toBeInTheDocument();
      expect(screen.queryByText('alwaysPrivateRoomHint')).not.toBeInTheDocument();
      expect(screen.getByText('sharedDeviceRoomHint')).toBeInTheDocument();
      expect(screen.getByTestId('local-players-rows')).toBeInTheDocument();
      expect(screen.queryByRole('group', { name: 'playerListUpdates' })).not.toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'roomBackground' })).toBeInTheDocument();
    });
  });
});
