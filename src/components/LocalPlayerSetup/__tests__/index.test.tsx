import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { describe, it, expect, vi } from 'vitest';
import LocalPlayerSetup from '../index';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      if (key === 'localPlayers.defaultPlayerName') {
        return `Player ${params?.number || 1}`;
      }
      if (key === 'localPlayers.playersCount') {
        return `${params?.count || 0} players`;
      }
      return key;
    },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));

// Mock migration context
vi.mock('@/context/migration', () => ({
  useMigration: () => ({
    currentLanguageMigrated: true,
    isMigrationInProgress: false,
    isMigrationCompleted: true,
    error: null,
    triggerMigration: vi.fn(),
    ensureLanguageMigrated: vi.fn(),
  }),
}));

describe('LocalPlayerSetup', () => {
  const defaultProps = {
    roomId: 'TEST_ROOM',
    isPrivateRoom: true,
    onComplete: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders without crashing in private room', () => {
    render(<LocalPlayerSetup {...defaultProps} />);
    expect(screen.getByText('localPlayers.setupTitle')).toBeInTheDocument();
  });

  it('shows private room required message in public room', () => {
    render(<LocalPlayerSetup {...defaultProps} isPrivateRoom={false} />);
    expect(screen.getByText('localPlayers.privateRoomRequired')).toBeInTheDocument();
  });

  it('displays add first player message when no players', () => {
    render(<LocalPlayerSetup {...defaultProps} />);
    expect(screen.getByText('localPlayers.noPlayersYet')).toBeInTheDocument();
    expect(screen.getByText('localPlayers.addFirstPlayer')).toBeInTheDocument();
  });

  it('adds a player when add button is clicked', async () => {
    render(<LocalPlayerSetup {...defaultProps} />);

    const addButton = screen.getByText('localPlayers.addFirstPlayer');
    fireEvent.click(addButton);

    // Player form should open
    await waitFor(() => {
      expect(screen.getByText('localPlayers.form.addPlayerTitle')).toBeInTheDocument();
    });

    // Fill in player name and submit
    const nameInput = screen.getByLabelText('localPlayers.form.nameLabel');
    fireEvent.change(nameInput, { target: { value: 'Player 1' } });

    const submitButton = screen.getByText('localPlayers.form.addPlayer');
    fireEvent.click(submitButton);

    // Player should be added to the list
    await waitFor(() => {
      expect(screen.getByText('Player 1')).toBeInTheDocument();
    });
  });

  it('removes a player when delete button is clicked', async () => {
    render(<LocalPlayerSetup {...defaultProps} />);

    // Add first player
    const addButton = screen.getByText('localPlayers.addFirstPlayer');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('localPlayers.form.addPlayerTitle')).toBeInTheDocument();
    });

    const nameInput1 = screen.getByLabelText('localPlayers.form.nameLabel');
    fireEvent.change(nameInput1, { target: { value: 'Player 1' } });

    const submitButton1 = screen.getByText('localPlayers.form.addPlayer');
    fireEvent.click(submitButton1);

    await waitFor(() => {
      expect(screen.getByText('Player 1')).toBeInTheDocument();
    });

    // Add second player - wait for FAB button to appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add player' })).toBeInTheDocument();
    });
    const fabButton = screen.getByRole('button', { name: 'Add player' });
    fireEvent.click(fabButton);

    await waitFor(() => {
      expect(screen.getByText('localPlayers.form.addPlayerTitle')).toBeInTheDocument();
    });

    const nameInput2 = screen.getByLabelText('localPlayers.form.nameLabel');
    fireEvent.change(nameInput2, { target: { value: 'Player 2' } });

    const submitButton2 = screen.getByText('localPlayers.form.addPlayer');
    fireEvent.click(submitButton2);

    await waitFor(() => {
      expect(screen.getByText('Player 2')).toBeInTheDocument();
    });

    // Find and click menu button for Player 1
    const menuButtons = screen.getAllByLabelText(/Player.*actions/);
    fireEvent.click(menuButtons[0]);

    await waitFor(() => {
      const deleteButton = screen.getByText('localPlayers.deletePlayer');
      fireEvent.click(deleteButton);
    });

    // Player 1 should be removed, Player 2 should remain
    await waitFor(() => {
      expect(screen.queryByText('Player 1')).not.toBeInTheDocument();
      expect(screen.getByText('Player 2')).toBeInTheDocument();
    });
  });

  it('validates minimum player count', async () => {
    render(<LocalPlayerSetup {...defaultProps} />);

    // Start session button should be disabled with no players
    let startButton = screen.getByRole('button', { name: /localPlayers.startSession/i });
    expect(startButton).toBeDisabled();

    // Add one player
    const addButton = screen.getByText('localPlayers.addFirstPlayer');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('localPlayers.form.addPlayerTitle')).toBeInTheDocument();
    });

    const nameInput1 = screen.getByLabelText('localPlayers.form.nameLabel');
    fireEvent.change(nameInput1, { target: { value: 'Player 1' } });

    const submitButton1 = screen.getByText('localPlayers.form.addPlayer');
    fireEvent.click(submitButton1);

    // Should still be disabled with only 1 player
    await waitFor(() => {
      startButton = screen.getByRole('button', { name: /localPlayers.startSession/i });
      expect(startButton).toBeDisabled();
    });

    // Add second player
    const fabButton = screen.getByRole('button', { name: 'Add player' });
    fireEvent.click(fabButton);

    await waitFor(() => {
      expect(screen.getByText('localPlayers.form.addPlayerTitle')).toBeInTheDocument();
    });

    const nameInput2 = screen.getByLabelText('localPlayers.form.nameLabel');
    fireEvent.change(nameInput2, { target: { value: 'Player 2' } });

    const submitButton2 = screen.getByText('localPlayers.form.addPlayer');
    fireEvent.click(submitButton2);

    // Should be enabled with 2 players
    await waitFor(() => {
      startButton = screen.getByRole('button', { name: /localPlayers.startSession/i });
      expect(startButton).not.toBeDisabled();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<LocalPlayerSetup {...defaultProps} onCancel={onCancel} />);

    const cancelButton = screen.getByText('cancel');
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete with players and settings when valid session is started', async () => {
    const onComplete = vi.fn();
    render(<LocalPlayerSetup {...defaultProps} onComplete={onComplete} />);

    // Add first player
    const addButton = screen.getByText('localPlayers.addFirstPlayer');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('localPlayers.form.addPlayerTitle')).toBeInTheDocument();
    });

    const nameInput1 = screen.getByLabelText('localPlayers.form.nameLabel');
    fireEvent.change(nameInput1, { target: { value: 'Player 1' } });

    const submitButton1 = screen.getByText('localPlayers.form.addPlayer');
    fireEvent.click(submitButton1);

    await waitFor(() => {
      expect(screen.getByText('Player 1')).toBeInTheDocument();
    });

    // Add second player
    const fabButton = screen.getByRole('button', { name: 'Add player' });
    fireEvent.click(fabButton);

    await waitFor(() => {
      expect(screen.getByText('localPlayers.form.addPlayerTitle')).toBeInTheDocument();
    });

    const nameInput2 = screen.getByLabelText('localPlayers.form.nameLabel');
    fireEvent.change(nameInput2, { target: { value: 'Player 2' } });

    const submitButton2 = screen.getByText('localPlayers.form.addPlayer');
    fireEvent.click(submitButton2);

    await waitFor(() => {
      expect(screen.getByText('Player 2')).toBeInTheDocument();
    });

    // Start session
    await waitFor(() => {
      const startButton = screen.getByText('localPlayers.startSession');
      expect(startButton).not.toBeDisabled();
      fireEvent.click(startButton);
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Player 1',
            role: 'vers',
            order: 0,
            isActive: true,
          }),
          expect.objectContaining({
            name: 'Player 2',
            role: 'vers',
            order: 1,
            isActive: false,
          }),
        ]),
        expect.objectContaining({
          showTurnTransitions: true,
          enableTurnSounds: true,
          showPlayerAvatars: true,
        })
      );
    });
  });
});
