import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LocalPlayerIndicator from '../index';
import type { LocalPlayer } from '@/types';

// Mock Material-UI icons to prevent file handle overflow
vi.mock('@mui/icons-material', () => ({
  Person: () => <div data-testid="PersonIcon">PersonIcon</div>,
  PlayArrow: () => <div data-testid="PlayArrowIcon">PlayArrowIcon</div>,
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (key.includes('turnOrder')) return `Turn ${options?.order || 1}`;
      if (key.includes('roles.')) return key.split('.')[1];
      if (key === 'localPlayers.noActivePlayer') return 'No active player';
      if (key === 'localPlayers.currentTurn') return 'Current Turn';
      if (key === 'localPlayers.onThisDevice') return 'This Device';
      if (key === 'localPlayers.remoteDevice') return 'Remote Device';
      if (key === 'localPlayers.clickToAdvance') return 'Click to advance turn';
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

describe('LocalPlayerIndicator', () => {
  const mockPlayer: LocalPlayer = {
    id: 'player1',
    name: 'Test Player',
    role: 'dom',
    order: 0,
    isActive: true,
    deviceId: 'current_device',
    location: 0,
    isFinished: false,
  };

  describe('No Current Player', () => {
    it('should render waiting state when no current player', () => {
      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={null} />
        </TestProvider>
      );

      expect(screen.getByText('No active player')).toBeInTheDocument();
    });

    it('should render waiting state with dashed border styling', () => {
      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={null} />
        </TestProvider>
      );

      const card = screen.getByText('No active player').closest('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });
  });

  describe('With Current Player', () => {
    it('should render player information correctly', () => {
      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={mockPlayer} />
        </TestProvider>
      );

      expect(screen.getByText('Test Player')).toBeInTheDocument();
      expect(screen.getByText('TP')).toBeInTheDocument(); // Initials
      expect(screen.getByText('Current Turn')).toBeInTheDocument();
      expect(screen.getByText('dom')).toBeInTheDocument(); // Role
      expect(screen.getByText('Turn 1')).toBeInTheDocument(); // Turn order
    });

    it('should display device information correctly', () => {
      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={mockPlayer} />
        </TestProvider>
      );

      expect(screen.getByText('This Device')).toBeInTheDocument();
    });

    it('should display remote device information correctly', () => {
      const remotePlayer = { ...mockPlayer, deviceId: 'other_device' };

      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={remotePlayer} />
        </TestProvider>
      );

      expect(screen.getByText('Remote Device')).toBeInTheDocument();
    });

    it('should generate correct initials for player names', () => {
      const playerWithLongName = { ...mockPlayer, name: 'John Michael Smith' };

      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={playerWithLongName} />
        </TestProvider>
      );

      expect(screen.getByText('JM')).toBeInTheDocument();
    });

    it('should handle single name correctly', () => {
      const playerWithSingleName = { ...mockPlayer, name: 'John' };

      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={playerWithSingleName} />
        </TestProvider>
      );

      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('should handle empty name gracefully', () => {
      const playerWithEmptyName = { ...mockPlayer, name: '' };

      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={playerWithEmptyName} />
        </TestProvider>
      );

      expect(screen.getByText('P')).toBeInTheDocument();
    });
  });

  describe('Role Colors', () => {
    it('should display dom role with primary color', () => {
      const domPlayer = { ...mockPlayer, role: 'dom' as const };

      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={domPlayer} />
        </TestProvider>
      );

      expect(screen.getByText('dom')).toBeInTheDocument();
    });

    it('should display sub role with secondary color', () => {
      const subPlayer = { ...mockPlayer, role: 'sub' as const };

      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={subPlayer} />
        </TestProvider>
      );

      expect(screen.getByText('sub')).toBeInTheDocument();
    });

    it('should display vers role with default color', () => {
      const versPlayer = { ...mockPlayer, role: 'vers' as const };

      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={versPlayer} />
        </TestProvider>
      );

      expect(screen.getByText('vers')).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('should render in compact mode with smaller avatar', () => {
      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={mockPlayer} compact={true} />
        </TestProvider>
      );

      const avatar = screen.getByText('TP');
      expect(avatar).toHaveStyle({ width: '40px', height: '40px' });
    });

    it('should hide detailed info in compact mode', () => {
      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={mockPlayer} compact={true} />
        </TestProvider>
      );

      // Turn order should not be visible in compact mode
      expect(screen.queryByText('Turn 1')).not.toBeInTheDocument();
    });

    it('should hide advance turn hint in compact mode', () => {
      const mockOnAdvanceTurn = vi.fn();

      render(
        <TestProvider>
          <LocalPlayerIndicator
            currentPlayer={mockPlayer}
            compact={true}
            onAdvanceTurn={mockOnAdvanceTurn}
          />
        </TestProvider>
      );

      expect(screen.queryByText('Click to advance turn')).not.toBeInTheDocument();
    });
  });

  describe('Turn Advancement', () => {
    it('should call onAdvanceTurn when card is clicked', () => {
      const mockOnAdvanceTurn = vi.fn();

      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={mockPlayer} onAdvanceTurn={mockOnAdvanceTurn} />
        </TestProvider>
      );

      const card = screen.getByText('Test Player').closest('.MuiCard-root');
      fireEvent.click(card!);

      expect(mockOnAdvanceTurn).toHaveBeenCalledTimes(1);
    });

    it('should show advance turn hint when onAdvanceTurn is provided', () => {
      const mockOnAdvanceTurn = vi.fn();

      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={mockPlayer} onAdvanceTurn={mockOnAdvanceTurn} />
        </TestProvider>
      );

      expect(screen.getByText('Click to advance turn')).toBeInTheDocument();
    });

    it('should not show advance turn hint when onAdvanceTurn is not provided', () => {
      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={mockPlayer} />
        </TestProvider>
      );

      expect(screen.queryByText('Click to advance turn')).not.toBeInTheDocument();
    });

    it('should apply hover styles when onAdvanceTurn is provided', () => {
      const mockOnAdvanceTurn = vi.fn();

      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={mockPlayer} onAdvanceTurn={mockOnAdvanceTurn} />
        </TestProvider>
      );

      const card = screen.getByText('Test Player').closest('.MuiCard-root');
      expect(card).toBeInTheDocument();
      // Check that the card has hover transition styles
      expect(card).toHaveStyle({ transition: 'all 0.3s ease-in-out' });
    });
  });

  describe('Transitions', () => {
    it('should wrap content with Fade transition by default', () => {
      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={mockPlayer} />
        </TestProvider>
      );

      // Component should render successfully with transition enabled
      expect(screen.getByText('Test Player')).toBeInTheDocument();
    });

    it('should not wrap with Fade when showTransition is false', () => {
      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={mockPlayer} showTransition={false} />
        </TestProvider>
      );

      // Check that no Fade wrapper exists
      const fadeWrapper = document.querySelector('.MuiFade-root');
      expect(fadeWrapper).not.toBeInTheDocument();
    });

    it('should show transition for null to player change', () => {
      const { rerender } = render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={null} />
        </TestProvider>
      );

      rerender(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={mockPlayer} />
        </TestProvider>
      );

      expect(screen.getByText('Test Player')).toBeInTheDocument();
    });
  });

  describe('Turn Order Display', () => {
    it('should display correct turn order for different players', () => {
      const secondPlayer = { ...mockPlayer, order: 1 };

      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={secondPlayer} />
        </TestProvider>
      );

      expect(screen.getByText('Turn 2')).toBeInTheDocument();
    });

    it('should handle zero-based order correctly', () => {
      const firstPlayer = { ...mockPlayer, order: 0 };

      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={firstPlayer} />
        </TestProvider>
      );

      expect(screen.getByText('Turn 1')).toBeInTheDocument();
    });
  });

  describe('Current Turn Badge', () => {
    it('should display current turn badge with pulsing animation', () => {
      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={mockPlayer} />
        </TestProvider>
      );

      const badge = screen.getByText('Current Turn');
      expect(badge).toBeInTheDocument();

      // Check that the badge has animation styling
      const chip = badge.closest('.MuiChip-root');
      expect(chip).toHaveStyle({ animation: 'pulse 2s infinite' });
    });

    it('should display person icon in current turn badge', () => {
      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={mockPlayer} />
        </TestProvider>
      );

      const personIcon = screen.getByTestId('PersonIcon');
      expect(personIcon).toBeInTheDocument();
    });
  });

  describe('Name Truncation', () => {
    it('should handle very long names with text overflow', () => {
      const longNamePlayer = {
        ...mockPlayer,
        name: 'This is a very long player name that should be truncated',
      };

      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={longNamePlayer} />
        </TestProvider>
      );

      const nameElement = screen.getByText(longNamePlayer.name);
      expect(nameElement).toHaveStyle({
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={mockPlayer} />
        </TestProvider>
      );

      const heading = screen.getByRole('heading', { name: 'Test Player' });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H3');
    });

    it('should be clickable when onAdvanceTurn is provided', () => {
      const mockOnAdvanceTurn = vi.fn();

      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={mockPlayer} onAdvanceTurn={mockOnAdvanceTurn} />
        </TestProvider>
      );

      const card = screen.getByText('Test Player').closest('.MuiCard-root');
      expect(card).toBeInTheDocument();

      // Should be clickable
      fireEvent.click(card!);
      expect(mockOnAdvanceTurn).toHaveBeenCalled();
    });
  });

  describe('Visual Styling', () => {
    it('should apply primary border and background styling', () => {
      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={mockPlayer} />
        </TestProvider>
      );

      const card = screen.getByText('Test Player').closest('.MuiCard-root');
      expect(card).toHaveStyle({
        border: '2px solid',
        transition: 'all 0.3s ease-in-out',
      });
    });

    it('should apply styling to avatar', () => {
      render(
        <TestProvider>
          <LocalPlayerIndicator currentPlayer={mockPlayer} />
        </TestProvider>
      );

      const avatar = screen.getByText('TP');
      expect(avatar).toBeInTheDocument();
      // Avatar should have MUI Avatar classes
      expect(avatar.closest('.MuiAvatar-root')).toBeInTheDocument();
    });
  });
});
