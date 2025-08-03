import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import GameModeStep from '../index';

// Mock translation
vi.mock('react-i18next', () => ({
  Trans: ({ i18nKey, children }: any) => <span data-testid={i18nKey}>{children || i18nKey}</span>,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('GameModeStep Content Filtering', () => {
  const mockSetFormData = vi.fn();
  const mockNextStep = vi.fn();
  const mockPrevStep = vi.fn();

  const baseFormData = {
    gameMode: 'local' as const,
    role: 'sub' as const,
    isNaked: false,
    room: 'PRIVATE',
    boardUpdated: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Content visibility based on local player configuration', () => {
    it('should show only intensity selection when local players are configured', () => {
      const formDataWithLocalPlayers = {
        ...baseFormData,
        hasLocalPlayers: true,
        localPlayersData: [
          {
            id: 'player1',
            name: 'Player 1',
            role: 'dom' as const,
            isActive: true,
            order: 1,
            deviceId: 'device1',
            location: 0,
            isFinished: false,
          },
          {
            id: 'player2',
            name: 'Player 2',
            role: 'sub' as const,
            isActive: false,
            order: 2,
            deviceId: 'device1',
            location: 0,
            isFinished: false,
          },
        ],
      };

      render(
        <GameModeStep
          formData={formDataWithLocalPlayers}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      // Interaction question should not be visible when local players are configured
      expect(screen.queryByTestId('playingWithPeople')).not.toBeInTheDocument();

      // Role selection should not be visible when local players are configured (roles are per player)
      expect(screen.queryByTestId('yourRole')).not.toBeInTheDocument();

      // Intensity selection SHOULD be visible when local players are configured
      expect(screen.getByTestId('areYouNaked')).toBeInTheDocument();
    });

    it('should show intimate content when no local players are configured', () => {
      const formDataWithoutLocalPlayers = {
        ...baseFormData,
        hasLocalPlayers: false,
      };

      render(
        <GameModeStep
          formData={formDataWithoutLocalPlayers}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      // Role selection should be visible for solo local play
      expect(screen.getByTestId('yourRole')).toBeInTheDocument();

      // Intensity selection should be visible for solo local play
      expect(screen.getByTestId('areYouNaked')).toBeInTheDocument();
    });

    it('should hide intimate content in online mode regardless of local players', () => {
      const onlineFormData = {
        ...baseFormData,
        gameMode: 'online' as const,
        hasLocalPlayers: false,
      };

      render(
        <GameModeStep
          formData={onlineFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      // Nothing should be visible in online mode
      expect(screen.queryByTestId('yourRole')).not.toBeInTheDocument();
      expect(screen.queryByTestId('areYouNaked')).not.toBeInTheDocument();
    });
  });

  describe('Interaction mode selection', () => {
    it('should allow switching between local and online modes', () => {
      render(
        <GameModeStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      // Should show interaction mode selection
      expect(screen.getByTestId('playingWithPeople')).toBeInTheDocument();

      // Should have both local and online options
      expect(screen.getByText('yesInteracting')).toBeInTheDocument();
      expect(screen.getByText('noInteracting')).toBeInTheDocument();
    });

    it('should update formData when interaction mode is changed', () => {
      render(
        <GameModeStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      // Click on online mode
      const onlineOption = screen.getByText('noInteracting').closest('div[role="button"]');
      if (onlineOption) {
        fireEvent.click(onlineOption);
      }

      expect(mockSetFormData).toHaveBeenCalledWith(
        expect.objectContaining({
          gameMode: 'online',
        })
      );
    });
  });

  describe('Role selection when visible', () => {
    const formDataForRoleSelection = {
      ...baseFormData,
      hasLocalPlayers: false, // No local players, so role selection should be visible
    };

    it('should show all role options', () => {
      render(
        <GameModeStep
          formData={formDataForRoleSelection}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      expect(screen.getByText('dom')).toBeInTheDocument();
      expect(screen.getByText('vers')).toBeInTheDocument();
      expect(screen.getByText('sub')).toBeInTheDocument();
    });

    it('should update formData when role is selected', () => {
      render(
        <GameModeStep
          formData={formDataForRoleSelection}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      // Click on dominant role
      const domOption = screen.getByText('dom').closest('div[role="button"]');
      if (domOption) {
        fireEvent.click(domOption);
      }

      expect(mockSetFormData).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'dom',
        })
      );
    });

    it('should show selected state for current role', () => {
      const formDataWithDomRole = {
        ...formDataForRoleSelection,
        role: 'dom' as const,
      };

      render(
        <GameModeStep
          formData={formDataWithDomRole}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      // Verify the dom role card has a selected chip
      const domCard = screen.getByText('dom').closest('[role="button"]');
      expect(domCard).toContainElement(screen.getByText('selected'));

      // Verify that no other role cards have a selected chip (only dom should be selected)
      const versCard = screen.getByText('vers').closest('[role="button"]');
      const subCard = screen.getByText('sub').closest('[role="button"]');

      expect(versCard).not.toContainElement(
        screen.getAllByText('selected').find((el) => versCard?.contains(el)) ||
          document.createElement('div')
      );
      expect(subCard).not.toContainElement(
        screen.getAllByText('selected').find((el) => subCard?.contains(el)) ||
          document.createElement('div')
      );
    });
  });

  describe('Intensity selection when visible', () => {
    const formDataForIntensitySelection = {
      ...baseFormData,
      hasLocalPlayers: false, // No local players, so intensity selection should be visible
    };

    it('should show intensity options', () => {
      render(
        <GameModeStep
          formData={formDataForIntensitySelection}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      expect(screen.getByText('noNaked')).toBeInTheDocument();
      expect(screen.getByText('yesNaked')).toBeInTheDocument();
    });

    it('should update formData when intensity is selected', () => {
      render(
        <GameModeStep
          formData={formDataForIntensitySelection}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      // Click on naked option
      const nakedOption = screen.getByText('yesNaked').closest('div[role="button"]');
      if (nakedOption) {
        fireEvent.click(nakedOption);
      }

      expect(mockSetFormData).toHaveBeenCalledWith(
        expect.objectContaining({
          isNaked: true,
        })
      );
    });
  });

  describe('Navigation buttons', () => {
    it('should have previous and next buttons', () => {
      render(
        <GameModeStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      expect(screen.getByText('previous')).toBeInTheDocument();
      expect(screen.getByText('next')).toBeInTheDocument();
    });

    it('should call appropriate functions when navigation buttons are clicked', () => {
      render(
        <GameModeStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      fireEvent.click(screen.getByText('previous'));
      expect(mockPrevStep).toHaveBeenCalled();

      fireEvent.click(screen.getByText('next'));
      expect(mockNextStep).toHaveBeenCalled();
    });
  });
});
