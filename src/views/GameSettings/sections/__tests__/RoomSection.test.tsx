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

  // Room type is decided by "Who else is playing?" in the setup section. A
  // second control for the same decision is what made the page feel like it
  // asked the same thing twice.
  it.each([
    ['solo in public', { gameMode: 'solo', room: 'PUBLIC' }],
    ['solo in private', { gameMode: 'solo', room: 'KHLOE' }],
    ['online', { gameMode: 'online', room: 'KHLOE' }],
    ['shared device', { gameMode: 'local', room: 'KHLOE' }],
  ])('never offers a public/private toggle — %s', (_label, overrides) => {
    render(
      <RoomSection
        formData={makeFormData(overrides as Partial<Settings>)}
        setFormData={setFormData}
      />
    );
    expect(screen.queryByRole('switch', { name: 'roomType' })).not.toBeInTheDocument();
  });

  describe('solo in the public room', () => {
    it('states the consequence and offers no room plumbing', () => {
      render(<RoomSection formData={makeFormData({})} setFormData={setFormData} />);
      expect(screen.getByText('publicRoomHint')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'copy' })).not.toBeInTheDocument();
      expect(screen.queryByTestId('local-players-rows')).not.toBeInTheDocument();
      expect(screen.queryByRole('group', { name: 'playerListUpdates' })).not.toBeInTheDocument();
    });
  });

  describe('solo in a private room', () => {
    it('shows the shareable code with a solo-specific reason', () => {
      render(<RoomSection formData={makeFormData({ room: 'KHLOE' })} setFormData={setFormData} />);
      expect(screen.getByText('privateRoomSoloHint')).toBeInTheDocument();
      expect(screen.queryByText('alwaysPrivateRoomHint')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'copy' })).toBeInTheDocument();
    });

    it('has no player-list-updates row — nobody else is expected', () => {
      render(<RoomSection formData={makeFormData({ room: 'KHLOE' })} setFormData={setFormData} />);
      expect(screen.queryByRole('group', { name: 'playerListUpdates' })).not.toBeInTheDocument();
    });
  });

  describe('friends on their own devices (online)', () => {
    it('shows the room code card with the share-it reason', () => {
      render(
        <RoomSection
          formData={makeFormData({ gameMode: 'online', room: 'KHLOE' })}
          setFormData={setFormData}
        />
      );
      expect(screen.getByText('alwaysPrivateRoomHint')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'copy' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /newRoomCode/ })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'playerListUpdates' })).toBeInTheDocument();
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
      expect(screen.queryByText('alwaysPrivateRoomHint')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'copy' })).not.toBeInTheDocument();
      expect(screen.getByText('sharedDeviceRoomHint')).toBeInTheDocument();
      expect(screen.getByTestId('local-players-rows')).toBeInTheDocument();
      expect(screen.queryByRole('group', { name: 'playerListUpdates' })).not.toBeInTheDocument();
    });
  });
});
