import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PlayerForm from '../index';
import type { LocalPlayer } from '@/types';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      // Form validation errors
      if (key === 'localPlayers.form.errors.nameRequired') return 'Name is required';
      if (key === 'localPlayers.form.errors.nameTooShort') return 'Name too short';
      if (key === 'localPlayers.form.errors.nameTooLong') return 'Name too long';
      if (key === 'localPlayers.form.errors.nameDuplicate') return 'Name already exists';
      if (key === 'localPlayers.form.errors.roleRequired') return 'Role is required';

      // Form labels and text
      if (key === 'localPlayers.form.editPlayerTitle') return 'Edit Player';
      if (key === 'localPlayers.form.addPlayerTitle') return 'Add Player';
      if (key === 'localPlayers.form.nameLabel') return 'Player Name';
      if (key === 'localPlayers.form.roleLabel') return 'Role';
      if (key === 'localPlayers.form.nameHelper') return 'Enter a unique name';
      if (key === 'localPlayers.form.namePlaceholder') return 'Enter player name';
      if (key === 'localPlayers.form.previewName') return 'Preview Name';
      if (key === 'localPlayers.form.helpText') return 'Choose player role';
      if (key === 'localPlayers.form.saving') return 'Saving...';
      if (key === 'localPlayers.form.saveChanges') return 'Save Changes';
      if (key === 'localPlayers.form.addPlayer') return 'Add Player';

      // Role descriptions
      if (key === 'localPlayers.form.roleDescriptions.dom') return 'Takes charge';
      if (key === 'localPlayers.form.roleDescriptions.sub') return 'Follows lead';
      if (key === 'localPlayers.form.roleDescriptions.vers') return 'Flexible role';

      // Roles
      if (key === 'roles.dom') return 'Dom';
      if (key === 'roles.sub') return 'Sub';
      if (key === 'roles.vers') return 'Vers';

      // Common
      if (key === 'cancel') return 'Cancel';

      return key.split('.').pop() || key;
    },
  }),
}));

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

const theme = createTheme();

const TestProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('PlayerForm', () => {
  const existingPlayers: LocalPlayer[] = [
    {
      id: 'player1',
      name: 'Existing Player',
      role: 'dom',
      order: 0,
      isActive: false,
      deviceId: 'device1',
      location: 0,
      isFinished: false,
    },
  ];

  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Add Player Mode', () => {
    it('should render add player dialog with correct title', () => {
      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getAllByText('Add Player')).toHaveLength(2); // Title and button
      expect(screen.getByLabelText('Player Name')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should have default values for new player', () => {
      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      const nameInput = screen.getByLabelText('Player Name') as HTMLInputElement;

      expect(nameInput.value).toBe('');
      // Check that the default role 'vers' is displayed in preview
      expect(screen.getByDisplayValue('vers')).toBeInTheDocument();
    });

    it('should show preview with default values', () => {
      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      expect(screen.getByText('Preview Name')).toBeInTheDocument();
      expect(screen.getAllByText('Vers').length).toBeGreaterThanOrEqual(1); // At least one in preview section
      expect(screen.getByText('P')).toBeInTheDocument(); // Default avatar
    });

    it('should focus name input on open', () => {
      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      const nameInput = screen.getByLabelText('Player Name');
      expect(nameInput).toHaveFocus();
    });
  });

  describe('Edit Player Mode', () => {
    const playerToEdit: LocalPlayer = {
      id: 'player2',
      name: 'Edit Player',
      role: 'sub',
      order: 1,
      isActive: false,
      deviceId: 'device2',
      location: 0,
      isFinished: false,
    };

    it('should render edit player dialog with correct title', () => {
      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={playerToEdit}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      expect(screen.getByRole('heading', { level: 2, name: 'Edit Player' })).toBeInTheDocument();
    });

    it('should populate form with existing player data', () => {
      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={playerToEdit}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      const nameInput = screen.getByLabelText('Player Name') as HTMLInputElement;
      expect(nameInput.value).toBe('Edit Player');
      // Check that the select shows 'sub' value
      expect(screen.getByDisplayValue('sub')).toBeInTheDocument();
    });

    it('should show preview with existing player data', () => {
      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={playerToEdit}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      expect(screen.getAllByText('Edit Player')).toHaveLength(2); // Title and preview
      expect(screen.getByText('EP')).toBeInTheDocument(); // Initials
    });
  });

  describe('Form Validation', () => {
    it('should disable submit button when name is empty', async () => {
      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      const submitButton = screen.getByRole('button', { name: 'Add Player' });
      expect(submitButton).toBeDisabled();

      // Should not call onSubmit when disabled
      fireEvent.click(submitButton);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate minimum name length on submit', async () => {
      const user = userEvent.setup();

      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      const nameInput = screen.getByLabelText('Player Name');
      await user.type(nameInput, 'A');

      const submitButton = screen.getByRole('button', { name: 'Add Player' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Name too short')).toBeInTheDocument();
      });
    });

    it('should prevent typing beyond maximum name length', async () => {
      const user = userEvent.setup();

      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      const nameInput = screen.getByLabelText('Player Name') as HTMLInputElement;
      await user.type(nameInput, 'This name is way too long for a player');

      // Input should be truncated to 20 characters
      expect(nameInput.value).toBe('This name is way too');
      expect(nameInput.value.length).toBe(20);
    });

    it('should validate duplicate names', async () => {
      const user = userEvent.setup();

      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      const nameInput = screen.getByLabelText('Player Name');
      await user.type(nameInput, 'Existing Player');

      const submitButton = screen.getByRole('button', { name: 'Add Player' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Name already exists')).toBeInTheDocument();
      });
    });

    it('should allow duplicate name when editing same player', async () => {
      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={existingPlayers[0]}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      // Keep the same name
      const submitButton = screen.getByRole('button', { name: 'Save Changes' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Existing Player',
          role: 'dom',
        });
      });
    });

    it('should validate case-insensitive duplicate names', async () => {
      const user = userEvent.setup();

      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      const nameInput = screen.getByLabelText('Player Name');
      await user.type(nameInput, 'EXISTING PLAYER');

      const submitButton = screen.getByRole('button', { name: 'Add Player' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Name already exists')).toBeInTheDocument();
      });
    });
  });

  describe('Form Interactions', () => {
    it('should update preview when name changes', async () => {
      const user = userEvent.setup();

      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      const nameInput = screen.getByLabelText('Player Name');
      await user.type(nameInput, 'John Doe');

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('JD')).toBeInTheDocument(); // Updated initials
    });

    it('should update preview when role changes', async () => {
      const user = userEvent.setup();

      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      const roleSelect = screen.getByRole('combobox');
      await user.click(roleSelect);

      const domOption = screen.getByText('Takes charge');
      await user.click(domOption);

      expect(screen.getByDisplayValue('dom')).toBeInTheDocument();
    });

    it('should enable submit button when valid name is entered', async () => {
      const user = userEvent.setup();

      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      const submitButton = screen.getByRole('button', { name: 'Add Player' });
      expect(submitButton).toBeDisabled();

      // Type a valid name
      const nameInput = screen.getByLabelText('Player Name');
      await user.type(nameInput, 'John');

      expect(submitButton).not.toBeDisabled();
    });

    it('should disable submit button when name is empty', () => {
      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      const submitButton = screen.getByRole('button', { name: 'Add Player' });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when name is provided', async () => {
      const user = userEvent.setup();

      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      const nameInput = screen.getByLabelText('Player Name');
      await user.type(nameInput, 'John');

      const submitButton = screen.getByRole('button', { name: 'Add Player' });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('should submit valid form data', async () => {
      const user = userEvent.setup();

      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      const nameInput = screen.getByLabelText('Player Name');
      await user.type(nameInput, 'John Doe');

      const roleSelect = screen.getByRole('combobox');
      await user.click(roleSelect);

      const domOption = screen.getByText('Takes charge');
      await user.click(domOption);

      const submitButton = screen.getByRole('button', { name: 'Add Player' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'John Doe',
          role: 'dom',
        });
      });
    });

    it('should trim whitespace from name', async () => {
      const user = userEvent.setup();

      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      const nameInput = screen.getByLabelText('Player Name');
      await user.type(nameInput, '  John Doe  ');

      const submitButton = screen.getByRole('button', { name: 'Add Player' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'John Doe',
          role: 'vers',
        });
      });
    });

    it('should show loading state during submission', async () => {
      mockOnSubmit.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      const user = userEvent.setup();

      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      const nameInput = screen.getByLabelText('Player Name');
      await user.type(nameInput, 'John Doe');

      const submitButton = screen.getByRole('button', { name: 'Add Player' });
      fireEvent.click(submitButton);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should handle submission errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockOnSubmit.mockRejectedValue(new Error('Submission failed'));

      const user = userEvent.setup();

      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      const nameInput = screen.getByLabelText('Player Name');
      await user.type(nameInput, 'John Doe');

      const submitButton = screen.getByRole('button', { name: 'Add Player' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error submitting player form:', expect.any(Error));
      });

      // Form should remain open and enabled
      expect(screen.getByRole('button', { name: 'Add Player' })).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();

      consoleSpy.mockRestore();
    });
  });

  describe('Form Cancellation', () => {
    it('should call onCancel when cancel button is clicked', () => {
      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should reset form when cancelled', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      // Fill form
      const nameInput = screen.getByLabelText('Player Name');
      await user.type(nameInput, 'John Doe');

      // Cancel
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Reopen dialog
      rerender(
        <TestProvider>
          <PlayerForm
            open={true}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      // Form should be reset
      const newNameInput = screen.getByLabelText('Player Name') as HTMLInputElement;
      expect(newNameInput.value).toBe('');
    });
  });

  describe('Role Selection', () => {
    it('should display all role options with descriptions', async () => {
      const user = userEvent.setup();

      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      const roleSelect = screen.getByRole('combobox');
      await user.click(roleSelect);

      expect(screen.getByText('Takes charge')).toBeInTheDocument();
      expect(screen.getByText('Follows lead')).toBeInTheDocument();
      expect(screen.getAllByText('Flexible role')).toHaveLength(2); // One might be in initial value
    });

    it('should show help text for role selection', () => {
      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      expect(screen.getByText('Choose player role')).toBeInTheDocument();
    });
  });

  describe('Dialog Behavior', () => {
    it('should not render when open is false', () => {
      render(
        <TestProvider>
          <PlayerForm
            open={false}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      expect(screen.queryByText('Add Player')).not.toBeInTheDocument();
    });

    it('should call onCancel when dialog backdrop is clicked', () => {
      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      // Simulate backdrop click by calling onClose
      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Character Limit', () => {
    it('should enforce 20 character limit on name input', () => {
      render(
        <TestProvider>
          <PlayerForm
            open={true}
            player={null}
            existingPlayers={existingPlayers}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestProvider>
      );

      const nameInput = screen.getByLabelText('Player Name') as HTMLInputElement;
      expect(nameInput.maxLength).toBe(20);
    });
  });
});
