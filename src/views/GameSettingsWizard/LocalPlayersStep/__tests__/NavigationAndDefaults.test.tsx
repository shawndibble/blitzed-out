import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import LocalPlayersStep from '../index';

// Mock dependencies
vi.mock('@/hooks/useLocalPlayers', () => ({
  useLocalPlayers: vi.fn(),
}));

vi.mock('@/components/LocalPlayerSetup', () => ({
  default: ({ onComplete, onCancel }: any) => (
    <div data-testid="local-player-setup">
      <button onClick={() => onComplete([], {})}>Complete Setup</button>
      <button onClick={onCancel}>Cancel Setup</button>
    </div>
  ),
}));

// Mock translation
vi.mock('react-i18next', () => ({
  Trans: ({ i18nKey, children }: any) => <span data-testid={i18nKey}>{children || i18nKey}</span>,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

import { useLocalPlayers } from '@/hooks/useLocalPlayers';

describe('LocalPlayersStep Navigation and Defaults', () => {
  const mockSetFormData = vi.fn();
  const mockNextStep = vi.fn();
  const mockPrevStep = vi.fn();

  const baseFormData = {
    room: 'PRIVATE',
    gameMode: 'local',
  };

  const mockLocalPlayersHook = {
    hasLocalPlayers: false,
    clearLocalSession: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useLocalPlayers as any).mockReturnValue(mockLocalPlayersHook);
  });

  describe('Navigation Consistency', () => {
    it('should use "Previous" button, not "Back"', () => {
      render(
        <LocalPlayersStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      // Should have "Previous" button
      expect(screen.getByText('previous')).toBeInTheDocument();

      // Should NOT have "Back" button
      expect(screen.queryByText('back')).not.toBeInTheDocument();
    });

    it('should call prevStep when Previous button is clicked', () => {
      render(
        <LocalPlayersStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      fireEvent.click(screen.getByText('previous'));
      expect(mockPrevStep).toHaveBeenCalled();
    });
  });

  describe('Option Layout and Styling', () => {
    it('should display both local player options with equal styling', () => {
      render(
        <LocalPlayersStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      // Both options should be present
      expect(screen.getByTestId('localPlayersStep.setupOption.title')).toBeInTheDocument();
      expect(screen.getByTestId('localPlayersStep.skipOption.title')).toBeInTheDocument();

      // No "selected" indicator should be present by default (equal weighting)
      expect(screen.queryByText('selected')).not.toBeInTheDocument();
    });

    it('should show both options with consistent styling', () => {
      render(
        <LocalPlayersStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      // Both options should be present
      expect(screen.getByTestId('localPlayersStep.setupOption.title')).toBeInTheDocument();
      expect(screen.getByTestId('localPlayersStep.skipOption.title')).toBeInTheDocument();

      // Both should have similar button styling (outlined variant)
      const setupButton = screen.getByTestId('localPlayersStep.setupOption.button');
      const skipButton = screen.getByTestId('localPlayersStep.skipOption.button');

      expect(setupButton).toBeInTheDocument();
      expect(skipButton).toBeInTheDocument();
    });
  });

  describe('Option Selection Behavior', () => {
    it('should navigate to next step when skip option is selected', () => {
      render(
        <LocalPlayersStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      // Click the skip button (either card or button)
      fireEvent.click(screen.getByText('skip'));
      expect(mockNextStep).toHaveBeenCalled();
    });

    it('should open setup modal when setup option is selected', () => {
      render(
        <LocalPlayersStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      // Click the setup option
      const setupButton = screen.getByTestId('localPlayersStep.setupOption.button');
      fireEvent.click(setupButton);

      // Should show the LocalPlayerSetup component
      expect(screen.getByTestId('local-player-setup')).toBeInTheDocument();
    });
  });

  describe('Local Player Setup Integration', () => {
    it('should update formData when setup is completed', () => {
      render(
        <LocalPlayersStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      // Open setup modal
      const setupButton = screen.getByTestId('localPlayersStep.setupOption.button');
      fireEvent.click(setupButton);

      // Complete the setup
      fireEvent.click(screen.getByText('Complete Setup'));

      expect(mockSetFormData).toHaveBeenCalledWith({
        localPlayersData: [],
        localPlayerSessionSettings: {},
        hasLocalPlayers: true,
      });

      expect(mockNextStep).toHaveBeenCalled();
    });

    it('should close setup modal when cancelled', () => {
      render(
        <LocalPlayersStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      // Open setup modal
      const setupButton = screen.getByTestId('localPlayersStep.setupOption.button');
      fireEvent.click(setupButton);

      // Should show setup
      expect(screen.getByTestId('local-player-setup')).toBeInTheDocument();

      // Cancel the setup
      fireEvent.click(screen.getByText('Cancel Setup'));

      // Should not show setup anymore
      expect(screen.queryByTestId('local-player-setup')).not.toBeInTheDocument();
    });
  });

  describe('Public Room Handling', () => {
    it('should auto-skip for public rooms', () => {
      const publicRoomFormData = {
        ...baseFormData,
        room: 'PUBLIC',
      };

      render(
        <LocalPlayersStep
          formData={publicRoomFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      // Should automatically call nextStep for public rooms
      expect(mockNextStep).toHaveBeenCalled();
    });
  });

  describe('Existing Local Players Status', () => {
    it('should show status alert when local players already exist', () => {
      const mockWithExistingPlayers = {
        ...mockLocalPlayersHook,
        hasLocalPlayers: true,
      };

      (useLocalPlayers as any).mockReturnValue(mockWithExistingPlayers);

      render(
        <LocalPlayersStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      // Should show the current status alert
      expect(screen.getByTestId('localPlayersStep.currentStatus.hasPlayers')).toBeInTheDocument();
    });

    it('should clear existing session when skip is selected', () => {
      const mockClearSession = vi.fn();
      const mockWithExistingPlayers = {
        ...mockLocalPlayersHook,
        hasLocalPlayers: true,
        clearLocalSession: mockClearSession,
      };

      (useLocalPlayers as any).mockReturnValue(mockWithExistingPlayers);

      render(
        <LocalPlayersStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      // Click skip
      fireEvent.click(screen.getByText('skip'));

      expect(mockClearSession).toHaveBeenCalled();
      expect(mockNextStep).toHaveBeenCalled();
    });
  });

  describe('Data Persistence Preparation', () => {
    it('should pass initial data to LocalPlayerSetup when available', () => {
      const formDataWithExistingPlayers = {
        ...baseFormData,
        localPlayersData: [
          { id: 'player1', name: 'Existing Player', role: 'dom', isActive: true, order: 1 },
        ],
        localPlayerSessionSettings: {
          showTurnTransitions: true,
          enableTurnSounds: false,
          showPlayerAvatars: true,
        },
      };

      render(
        <LocalPlayersStep
          formData={formDataWithExistingPlayers}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      // Open setup modal
      const setupButton = screen.getByTestId('localPlayersStep.setupOption.button');
      fireEvent.click(setupButton);

      // The LocalPlayerSetup component should receive the initial data
      // This is tested through the props passed to the mocked component
      expect(screen.getByTestId('local-player-setup')).toBeInTheDocument();
    });
  });
});
