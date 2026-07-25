import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LocalPlayerSetup from './index';
import type { LocalPlayer } from '@/types';

vi.mock('@mui/icons-material', () => ({
  Add: () => <span data-testid="add-icon" />,
  Edit: () => <span data-testid="edit-icon" />,
  Delete: () => <span data-testid="delete-icon" />,
  MoreVert: () => <span data-testid="more-vert-icon" />,
  Person: () => <span data-testid="person-icon" />,
  Male: () => <span data-testid="male-icon" />,
  Female: () => <span data-testid="female-icon" />,
  Transgender: () => <span data-testid="transgender-icon" />,
}));

vi.mock('react-i18next', () => ({
  Trans: ({ i18nKey }: any) => <span>{i18nKey}</span>,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

function player(overrides: Partial<LocalPlayer> = {}): LocalPlayer {
  return {
    id: `p-${Math.random()}`,
    name: 'Player',
    role: 'vers',
    gender: 'non-binary',
    sound: 'chime',
    ...overrides,
  } as LocalPlayer;
}

describe('LocalPlayerSetup validation', () => {
  it('disables submit and shows the minimum-players error with fewer than 2 players', () => {
    render(
      <LocalPlayerSetup
        roomId="ABCDE"
        isPrivateRoom
        onComplete={vi.fn()}
        onCancel={vi.fn()}
        initialPlayers={[player({ name: 'Solo' })]}
      />
    );

    expect(screen.getByText('localPlayers.errors.minimumPlayers')).toBeInTheDocument();
    expect(screen.getByText('localPlayers.startSession').closest('button')).toBeDisabled();
  });

  it('shows the duplicate-names error for two players with the same name', () => {
    render(
      <LocalPlayerSetup
        roomId="ABCDE"
        isPrivateRoom
        onComplete={vi.fn()}
        onCancel={vi.fn()}
        initialPlayers={[player({ name: 'Alex' }), player({ name: 'alex' })]}
      />
    );

    expect(screen.getByText('localPlayers.errors.duplicateNames')).toBeInTheDocument();
  });

  it('enables submit with no error for a valid 2-player setup, and calls onComplete', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    render(
      <LocalPlayerSetup
        roomId="ABCDE"
        isPrivateRoom
        onComplete={onComplete}
        onCancel={vi.fn()}
        initialPlayers={[player({ name: 'Alex' }), player({ name: 'Sam' })]}
      />
    );

    expect(screen.queryByText(/localPlayers\.errors\./)).not.toBeInTheDocument();
    const submit = screen.getByText('localPlayers.startSession').closest('button')!;
    expect(submit).not.toBeDisabled();

    fireEvent.click(submit);
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalled());
  });

  it('shows a submission error message when onComplete rejects, without clobbering validation state', async () => {
    const onComplete = vi.fn().mockRejectedValue(new Error('boom'));
    render(
      <LocalPlayerSetup
        roomId="ABCDE"
        isPrivateRoom
        onComplete={onComplete}
        onCancel={vi.fn()}
        initialPlayers={[player({ name: 'Alex' }), player({ name: 'Sam' })]}
      />
    );

    const submit = screen.getByText('localPlayers.startSession').closest('button')!;
    fireEvent.click(submit);

    await screen.findByText('boom');
  });
});
