import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PlayerCard from '../index';
import type { LocalPlayer } from '@/types';

// Mock Material-UI icons to prevent file handle overflow
vi.mock('@mui/icons-material', () => ({
  Edit: () => <div data-testid="EditIcon">EditIcon</div>,
  Delete: () => <div data-testid="DeleteIcon">DeleteIcon</div>,
  MoreVert: () => <div data-testid="MoreVertIcon">MoreVertIcon</div>,
  Person: () => <div data-testid="PersonIcon">PersonIcon</div>,
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      if (key === 'localPlayers.playerActions') {
        return `${params?.name} actions`;
      }
      if (key === 'localPlayers.turnOrder') {
        return `Turn ${params?.order}`;
      }
      if (key.startsWith('roles.')) {
        return key.split('.')[1];
      }
      return key;
    },
  }),
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

describe('PlayerCard', () => {
  const mockPlayer: LocalPlayer = {
    id: 'player-1',
    name: 'Test Player',
    role: 'vers',
    order: 0,
    isActive: false,
    deviceId: 'current_device',
    location: 0,
    isFinished: false,
  };

  const defaultProps = {
    player: mockPlayer,
    index: 0,
    isActive: false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onRoleChange: vi.fn(),
  };

  it('renders player information correctly', () => {
    render(<PlayerCard {...defaultProps} />);

    expect(screen.getByText('Test Player')).toBeInTheDocument();
    expect(screen.getByText('vers')).toBeInTheDocument();
  });

  it('shows current player badge when active', () => {
    render(<PlayerCard {...defaultProps} isActive={true} />);

    expect(screen.getByText('localPlayers.currentPlayer')).toBeInTheDocument();
  });

  it('calls onEdit when edit is clicked', async () => {
    const onEdit = vi.fn();
    render(<PlayerCard {...defaultProps} onEdit={onEdit} />);

    // Open menu
    const menuButton = screen.getByRole('button', { name: 'Test Player actions' });
    fireEvent.click(menuButton);

    // Click edit
    const editButton = screen.getByText('localPlayers.editPlayer');
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(mockPlayer);
  });

  it('calls onDelete when delete is clicked', async () => {
    const onDelete = vi.fn();
    render(<PlayerCard {...defaultProps} onDelete={onDelete} />);

    // Open menu
    const menuButton = screen.getByRole('button', { name: 'Test Player actions' });
    fireEvent.click(menuButton);

    // Click delete
    const deleteButton = screen.getByText('localPlayers.deletePlayer');
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith('player-1');
  });

  it('disables delete when canDelete is false', () => {
    render(<PlayerCard {...defaultProps} canDelete={false} />);

    // Open menu
    const menuButton = screen.getByRole('button', { name: 'Test Player actions' });
    fireEvent.click(menuButton);

    // Delete option should not be present
    expect(screen.queryByText('localPlayers.deletePlayer')).not.toBeInTheDocument();
  });

  it('calls onRoleChange when role chip is clicked', async () => {
    const onRoleChange = vi.fn();
    render(<PlayerCard {...defaultProps} onRoleChange={onRoleChange} />);

    // Click role chip
    const roleChip = screen.getByText('vers');
    fireEvent.click(roleChip);

    // Click a different role
    const domRole = screen.getByText('dom');
    fireEvent.click(domRole);

    expect(onRoleChange).toHaveBeenCalledWith('player-1', 'dom');
  });
});
