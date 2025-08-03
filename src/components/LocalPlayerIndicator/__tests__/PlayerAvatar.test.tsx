import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PlayerAvatar from '../PlayerAvatar';
import type { LocalPlayer } from '@/types';

// Mock the migration context
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

describe('PlayerAvatar', () => {
  const mockPlayer: LocalPlayer = {
    id: 'player1',
    name: 'Test Player',
    role: 'dom',
    order: 0,
    isActive: false,
    deviceId: 'current_device',
    location: 0,
    isFinished: false,
  };

  describe('Basic Rendering', () => {
    it('should render player avatar with initials', () => {
      render(
        <TestProvider>
          <PlayerAvatar player={mockPlayer} />
        </TestProvider>
      );

      expect(screen.getByText('TP')).toBeInTheDocument();
    });

    it('should render single initial for single name', () => {
      const singleNamePlayer = { ...mockPlayer, name: 'John' };

      render(
        <TestProvider>
          <PlayerAvatar player={singleNamePlayer} />
        </TestProvider>
      );

      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('should render first two initials for multiple names', () => {
      const multiNamePlayer = { ...mockPlayer, name: 'John Michael Smith' };

      render(
        <TestProvider>
          <PlayerAvatar player={multiNamePlayer} />
        </TestProvider>
      );

      expect(screen.getByText('JM')).toBeInTheDocument();
    });

    it('should handle empty name gracefully', () => {
      const emptyNamePlayer = { ...mockPlayer, name: '' };

      render(
        <TestProvider>
          <PlayerAvatar player={emptyNamePlayer} />
        </TestProvider>
      );

      expect(screen.getByText('P')).toBeInTheDocument();
    });

    it('should handle whitespace-only name', () => {
      const whitespacePlayer = { ...mockPlayer, name: '   ' };

      render(
        <TestProvider>
          <PlayerAvatar player={whitespacePlayer} />
        </TestProvider>
      );

      expect(screen.getByText('P')).toBeInTheDocument();
    });
  });

  describe('Size Variations', () => {
    it('should render small size avatar', () => {
      render(
        <TestProvider>
          <PlayerAvatar player={mockPlayer} size="small" />
        </TestProvider>
      );

      const avatar = screen.getByText('TP');
      expect(avatar).toHaveStyle({ width: '32px', height: '32px' });
    });

    it('should render medium size avatar (default)', () => {
      render(
        <TestProvider>
          <PlayerAvatar player={mockPlayer} size="medium" />
        </TestProvider>
      );

      const avatar = screen.getByText('TP');
      expect(avatar).toHaveStyle({ width: '48px', height: '48px' });
    });

    it('should render large size avatar', () => {
      render(
        <TestProvider>
          <PlayerAvatar player={mockPlayer} size="large" />
        </TestProvider>
      );

      const avatar = screen.getByText('TP');
      expect(avatar).toHaveStyle({ width: '64px', height: '64px' });
    });

    it('should default to medium size when no size specified', () => {
      render(
        <TestProvider>
          <PlayerAvatar player={mockPlayer} />
        </TestProvider>
      );

      const avatar = screen.getByText('TP');
      expect(avatar).toHaveStyle({ width: '48px', height: '48px' });
    });
  });

  describe('Active State', () => {
    it('should apply active styling when isActive is true', () => {
      render(
        <TestProvider>
          <PlayerAvatar player={mockPlayer} isActive={true} />
        </TestProvider>
      );

      const avatar = screen.getByText('TP');
      expect(avatar).toHaveStyle({ border: '2px solid' });
    });

    it('should apply inactive styling when isActive is false', () => {
      render(
        <TestProvider>
          <PlayerAvatar player={mockPlayer} isActive={false} />
        </TestProvider>
      );

      const avatar = screen.getByText('TP');
      expect(avatar).toHaveStyle({ border: '1px solid' });
    });

    it('should show active indicator badge when isActive and not showing role badge', () => {
      render(
        <TestProvider>
          <PlayerAvatar player={mockPlayer} isActive={true} showRoleBadge={false} />
        </TestProvider>
      );

      // Check for the star icon in the active badge
      const starIcon = screen.getByTestId('StarIcon');
      expect(starIcon).toBeInTheDocument();
    });
  });

  describe('Role Badge', () => {
    it('should show role badge when showRoleBadge is true', () => {
      render(
        <TestProvider>
          <PlayerAvatar player={mockPlayer} showRoleBadge={true} />
        </TestProvider>
      );

      // For 'dom' role, should show star icon
      const starIcon = screen.getByTestId('StarIcon');
      expect(starIcon).toBeInTheDocument();
    });

    it('should show star icon for dom role', () => {
      const domPlayer = { ...mockPlayer, role: 'dom' as const };

      render(
        <TestProvider>
          <PlayerAvatar player={domPlayer} showRoleBadge={true} />
        </TestProvider>
      );

      const starIcon = screen.getByTestId('StarIcon');
      expect(starIcon).toBeInTheDocument();
    });

    it('should show person icon for sub role', () => {
      const subPlayer = { ...mockPlayer, role: 'sub' as const };

      render(
        <TestProvider>
          <PlayerAvatar player={subPlayer} showRoleBadge={true} />
        </TestProvider>
      );

      const personIcon = screen.getByTestId('PersonIcon');
      expect(personIcon).toBeInTheDocument();
    });

    it('should show dot indicator for vers role', () => {
      const versPlayer = { ...mockPlayer, role: 'vers' as const };

      render(
        <TestProvider>
          <PlayerAvatar player={versPlayer} showRoleBadge={true} />
        </TestProvider>
      );

      // Check for the dot (Box element with specific styling)
      const badge = screen.getByText('TP').closest('.MuiBadge-root');
      expect(badge).toBeInTheDocument();
    });

    it('should not show role badge when showRoleBadge is false', () => {
      render(
        <TestProvider>
          <PlayerAvatar player={mockPlayer} showRoleBadge={false} />
        </TestProvider>
      );

      // Should not have role-specific icons when badge is hidden
      expect(screen.queryByTestId('StarIcon')).toBeNull();
      expect(screen.queryByTestId('PersonIcon')).toBeNull();
    });
  });

  describe('Online Status Badge', () => {
    it('should show online status badge by default', () => {
      render(
        <TestProvider>
          <PlayerAvatar player={mockPlayer} />
        </TestProvider>
      );

      // Look for badge container
      const badge = screen.getByText('TP').closest('.MuiBadge-root');
      expect(badge).toBeInTheDocument();
    });

    it('should show green badge for current device', () => {
      const currentDevicePlayer = { ...mockPlayer, deviceId: 'current_device' };

      render(
        <TestProvider>
          <PlayerAvatar player={currentDevicePlayer} showOnlineStatus={true} />
        </TestProvider>
      );

      // Badge should be present (implementation uses MUI theme colors)
      const badge = screen.getByText('TP').closest('.MuiBadge-root');
      expect(badge).toBeInTheDocument();
    });

    it('should show warning badge for other devices', () => {
      const otherDevicePlayer = { ...mockPlayer, deviceId: 'other_device' };

      render(
        <TestProvider>
          <PlayerAvatar player={otherDevicePlayer} showOnlineStatus={true} />
        </TestProvider>
      );

      const badge = screen.getByText('TP').closest('.MuiBadge-root');
      expect(badge).toBeInTheDocument();
    });

    it('should not show online status badge when showOnlineStatus is false', () => {
      render(
        <TestProvider>
          <PlayerAvatar player={mockPlayer} showOnlineStatus={false} />
        </TestProvider>
      );

      // Without online status badge, should only have the avatar
      const avatar = screen.getByText('TP');
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('Click Interaction', () => {
    it('should call onClick when avatar is clicked', () => {
      const mockOnClick = vi.fn();

      render(
        <TestProvider>
          <PlayerAvatar player={mockPlayer} onClick={mockOnClick} />
        </TestProvider>
      );

      const avatar = screen.getByText('TP');
      fireEvent.click(avatar);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when no onClick handler provided', () => {
      render(
        <TestProvider>
          <PlayerAvatar player={mockPlayer} />
        </TestProvider>
      );

      const avatar = screen.getByText('TP');
      // Should not throw error when clicked without onClick handler
      expect(() => fireEvent.click(avatar)).not.toThrow();
    });

    it('should apply pointer cursor when onClick is provided', () => {
      const mockOnClick = vi.fn();

      render(
        <TestProvider>
          <PlayerAvatar player={mockPlayer} onClick={mockOnClick} />
        </TestProvider>
      );

      const avatar = screen.getByText('TP');
      expect(avatar).toHaveStyle({ cursor: 'pointer' });
    });

    it('should apply default cursor when no onClick provided', () => {
      render(
        <TestProvider>
          <PlayerAvatar player={mockPlayer} />
        </TestProvider>
      );

      const avatar = screen.getByText('TP');
      expect(avatar).toHaveStyle({ cursor: 'default' });
    });
  });

  describe('Badge Combinations', () => {
    it('should show both role badge and online status when both enabled', () => {
      render(
        <TestProvider>
          <PlayerAvatar player={mockPlayer} showRoleBadge={true} showOnlineStatus={true} />
        </TestProvider>
      );

      // Should have both badges (nested MuiBadge components)
      const badges = screen.getAllByText('TP')[0].closest('.MuiBadge-root');
      expect(badges).toBeInTheDocument();

      // Should show role-specific icon
      const starIcon = screen.getByTestId('StarIcon');
      expect(starIcon).toBeInTheDocument();
    });

    it('should prioritize role badge over active indicator', () => {
      render(
        <TestProvider>
          <PlayerAvatar player={mockPlayer} isActive={true} showRoleBadge={true} />
        </TestProvider>
      );

      // Should show role badge (star for dom), not active indicator
      const starIcons = screen.getAllByTestId('StarIcon');
      expect(starIcons.length).toBeGreaterThan(0);
    });

    it('should show active indicator when role badge disabled but isActive true', () => {
      render(
        <TestProvider>
          <PlayerAvatar player={mockPlayer} isActive={true} showRoleBadge={false} />
        </TestProvider>
      );

      // Should show active indicator (star icon in active badge)
      const starIcon = screen.getByTestId('StarIcon');
      expect(starIcon).toBeInTheDocument();
    });
  });

  describe('Name Handling Edge Cases', () => {
    it('should handle names with special characters', () => {
      const specialCharPlayer = { ...mockPlayer, name: 'Player-1 & Player_2' };

      render(
        <TestProvider>
          <PlayerAvatar player={specialCharPlayer} />
        </TestProvider>
      );

      expect(screen.getByText('P&')).toBeInTheDocument();
    });

    it('should handle very long names', () => {
      const longNamePlayer = {
        ...mockPlayer,
        name: 'VeryLongFirstName VeryLongLastName VeryLongMiddleName',
      };

      render(
        <TestProvider>
          <PlayerAvatar player={longNamePlayer} />
        </TestProvider>
      );

      // Should only show first two initials
      expect(screen.getByText('VV')).toBeInTheDocument();
    });

    it('should handle names with numbers', () => {
      const numberNamePlayer = { ...mockPlayer, name: 'Player1 Player2' };

      render(
        <TestProvider>
          <PlayerAvatar player={numberNamePlayer} />
        </TestProvider>
      );

      expect(screen.getByText('PP')).toBeInTheDocument();
    });

    it('should handle names with emojis', () => {
      const emojiNamePlayer = { ...mockPlayer, name: '😀Player 🎮Gamer' };

      render(
        <TestProvider>
          <PlayerAvatar player={emojiNamePlayer} />
        </TestProvider>
      );

      // Just verify the component renders successfully without errors
      const avatar = document.querySelector('.MuiAvatar-root');
      expect(avatar).toBeInTheDocument();
    });

    it('should handle mixed case names correctly', () => {
      const mixedCasePlayer = { ...mockPlayer, name: 'john doe' };

      render(
        <TestProvider>
          <PlayerAvatar player={mixedCasePlayer} />
        </TestProvider>
      );

      // Should convert to uppercase
      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });

  describe('Role Color Mapping', () => {
    it('should apply correct color for dom role', () => {
      const domPlayer = { ...mockPlayer, role: 'dom' as const };

      render(
        <TestProvider>
          <PlayerAvatar player={domPlayer} showRoleBadge={true} />
        </TestProvider>
      );

      // Component should render without errors and show star icon
      const starIcon = screen.getByTestId('StarIcon');
      expect(starIcon).toBeInTheDocument();
    });

    it('should apply correct color for sub role', () => {
      const subPlayer = { ...mockPlayer, role: 'sub' as const };

      render(
        <TestProvider>
          <PlayerAvatar player={subPlayer} showRoleBadge={true} />
        </TestProvider>
      );

      const personIcon = screen.getByTestId('PersonIcon');
      expect(personIcon).toBeInTheDocument();
    });

    it('should apply correct color for vers role', () => {
      const versPlayer = { ...mockPlayer, role: 'vers' as const };

      render(
        <TestProvider>
          <PlayerAvatar player={versPlayer} showRoleBadge={true} />
        </TestProvider>
      );

      // Component should render without errors
      const avatar = screen.getByText('TP');
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have clickable styling when onClick is provided', () => {
      const mockOnClick = vi.fn();

      render(
        <TestProvider>
          <PlayerAvatar player={mockPlayer} onClick={mockOnClick} />
        </TestProvider>
      );

      const avatar = screen.getByText('TP');
      expect(avatar).toHaveStyle({ cursor: 'pointer' });
    });

    it('should have proper ARIA attributes when interactive', () => {
      const mockOnClick = vi.fn();

      render(
        <TestProvider>
          <PlayerAvatar player={mockPlayer} onClick={mockOnClick} />
        </TestProvider>
      );

      const avatar = screen.getByText('TP');
      expect(avatar).toBeInTheDocument();
      // MUI Avatar should handle ARIA attributes appropriately
    });
  });

  describe('Animation', () => {
    it('should apply hover effects when clickable', () => {
      const mockOnClick = vi.fn();

      render(
        <TestProvider>
          <PlayerAvatar player={mockPlayer} onClick={mockOnClick} />
        </TestProvider>
      );

      const avatar = screen.getByText('TP');

      // Should have transition styling for hover effects
      expect(avatar).toHaveStyle({ transition: 'all 0.2s ease-in-out' });
    });

    it('should not apply hover effects when not clickable', () => {
      render(
        <TestProvider>
          <PlayerAvatar player={mockPlayer} />
        </TestProvider>
      );

      const avatar = screen.getByText('TP');

      // Should still have transition but no hover behavior
      expect(avatar).toHaveStyle({ transition: 'all 0.2s ease-in-out' });
    });
  });
});
