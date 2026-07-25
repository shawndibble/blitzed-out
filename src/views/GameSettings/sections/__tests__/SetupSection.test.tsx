import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SetupSection from '../SetupSection';
import type { Settings } from '@/types/Settings';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ i18nKey }: any) => <span>{i18nKey}</span>,
}));

const makeFormData = (overrides: Partial<Settings>): Settings =>
  ({
    gameMode: 'solo',
    room: 'PUBLIC',
    boardUpdated: false,
    selectedActions: {},
    ...overrides,
  }) as unknown as Settings;

describe('SetupSection', () => {
  const setFormData = vi.fn();
  const onParticipationChange = vi.fn();
  const getPrivateRoom = vi.fn(() => 'REST0');
  const user = userEvent.setup();

  const setup = (overrides: Partial<Settings> = {}) =>
    render(
      <SetupSection
        formData={makeFormData(overrides)}
        setFormData={setFormData}
        getPrivateRoom={getPrivateRoom}
        onParticipationChange={onParticipationChange}
      />
    );

  beforeEach(() => {
    setFormData.mockClear();
    onParticipationChange.mockClear();
    getPrivateRoom.mockClear();
  });

  describe('reading the stored state back', () => {
    it('shows solo in PUBLIC as just-me alongside strangers', () => {
      setup();
      expect(screen.getByRole('button', { name: 'setupDeviceJustMe' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      expect(screen.getByRole('button', { name: 'setupCompanyStrangers' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });

    it('shows online as just-me with friends', () => {
      setup({ gameMode: 'online', room: 'KHLOE' });
      expect(screen.getByRole('button', { name: 'setupCompanyFriends' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });
  });

  describe('the company question', () => {
    it('is hidden for several-of-us, which forces its own private room', () => {
      setup({ gameMode: 'local', room: 'KHLOE' });
      expect(screen.queryByRole('group', { name: 'setupCompanyQuestion' })).not.toBeInTheDocument();
    });

    it('is shown for just-me', () => {
      setup();
      expect(screen.getByRole('group', { name: 'setupCompanyQuestion' })).toBeInTheDocument();
    });
  });

  describe('the participation sub-question', () => {
    it('appears only under friends-by-code, the one answer where it is a choice', () => {
      setup({ gameMode: 'online', room: 'KHLOE' });
      expect(screen.getByRole('group', { name: 'setupParticipationQuestion' })).toBeInTheDocument();
    });

    it.each([
      ['solo in public', { gameMode: 'solo', room: 'PUBLIC' }],
      ['solo in private', { gameMode: 'solo', room: 'KHLOE' }],
      ['shared device', { gameMode: 'local', room: 'KHLOE' }],
    ])('is hidden where content is forced — %s', (_label, overrides) => {
      setup(overrides as Partial<Settings>);
      expect(
        screen.queryByRole('group', { name: 'setupParticipationQuestion' })
      ).not.toBeInTheDocument();
    });

    it('defaults to just-me when nothing is stored', () => {
      setup({ gameMode: 'online', room: 'KHLOE' });
      expect(screen.getByRole('button', { name: 'setupParticipationJustMe' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });

    it('reports the change instead of writing soloPlay itself', async () => {
      setup({ gameMode: 'online', room: 'KHLOE' });
      await user.click(screen.getByRole('button', { name: 'setupParticipationPartner' }));

      // The page owns the write, because the action catalog has to reload
      // before the existing selection can be re-pointed at it.
      expect(onParticipationChange).toHaveBeenCalledWith(false);
      expect(setFormData).not.toHaveBeenCalled();
    });
  });

  describe('deriving topology from the two answers', () => {
    it('several-of-us derives local and leaves PUBLIC behind', async () => {
      setup();
      await user.click(screen.getByRole('button', { name: 'setupDeviceSeveral' }));

      const next = setFormData.mock.calls[0][0];
      expect(next.gameMode).toBe('local');
      expect(next.room).toBe('REST0');
    });

    it('friends-by-code derives online and never stays in PUBLIC', async () => {
      setup();
      await user.click(screen.getByRole('button', { name: 'setupCompanyFriends' }));

      const next = setFormData.mock.calls[0][0];
      expect(next.gameMode).toBe('online');
      expect(next.room).toBe('REST0');
    });

    it('strangers derives solo in PUBLIC', async () => {
      setup({ gameMode: 'online', room: 'KHLOE' });
      await user.click(screen.getByRole('button', { name: 'setupCompanyStrangers' }));

      const next = setFormData.mock.calls[0][0];
      expect(next.gameMode).toBe('solo');
      expect(next.room).toBe('PUBLIC');
    });

    it('no-one derives solo and keeps the private room it is already in', async () => {
      setup({ gameMode: 'online', room: 'KHLOE' });
      await user.click(screen.getByRole('button', { name: 'setupCompanyNoOne' }));

      const next = setFormData.mock.calls[0][0];
      expect(next.gameMode).toBe('solo');
      expect(next.room).toBe('KHLOE');
      expect(getPrivateRoom).not.toHaveBeenCalled();
    });

    it('marks the board stale so Update rebuilds it', async () => {
      setup();
      await user.click(screen.getByRole('button', { name: 'setupCompanyFriends' }));
      expect(setFormData.mock.calls[0][0].boardUpdated).toBe(true);
    });

    it('ignores re-tapping the answer already selected', async () => {
      setup();
      await user.click(screen.getByRole('button', { name: 'setupCompanyStrangers' }));
      expect(setFormData).not.toHaveBeenCalled();
    });
  });
});
