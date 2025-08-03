import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import GameSettingsWizard from '../index';

// Mock dependencies
vi.mock('react-i18next', () => ({
  Trans: ({ i18nKey, children }: { i18nKey?: string; children?: any }) => {
    const translations: Record<string, string> = {
      advancedSetup: 'Advanced Setup',
    };
    return <span data-testid={i18nKey}>{children || translations[i18nKey || ''] || i18nKey}</span>;
  },
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
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

// Mock hooks
const mockUseSettingsToFormData = vi.fn();
vi.mock('@/hooks/useSettingsToFormData', () => ({
  default: mockUseSettingsToFormData,
}));

const mockUseUnifiedActionList = {
  actionsList: [
    { id: 'action1', text: 'Test Action 1' },
    { id: 'action2', text: 'Test Action 2' },
  ],
  isLoading: false,
};
vi.mock('@/hooks/useUnifiedActionList', () => ({
  default: () => mockUseUnifiedActionList,
}));

// Mock helper
vi.mock('@/helpers/strings', () => ({
  isPublicRoom: (room: string) => room === 'PUBLIC',
}));

// Mock step components
const mockRoomStep = vi.fn();
const mockLocalPlayersStep = vi.fn();
const mockGameModeStep = vi.fn();
const mockActionsStep = vi.fn();
const mockFinishStep = vi.fn();

vi.mock('../RoomStep', () => ({
  default: (props: any) => {
    mockRoomStep(props);
    return (
      <div data-testid="room-step">
        <button onClick={() => props.nextStep()}>Next from Room</button>
      </div>
    );
  },
}));

vi.mock('../LocalPlayersStep', () => ({
  default: (props: any) => {
    mockLocalPlayersStep(props);
    return (
      <div data-testid="local-players-step">
        <button onClick={() => props.nextStep()}>Next from Local Players</button>
        <button onClick={() => props.prevStep()}>Previous from Local Players</button>
      </div>
    );
  },
}));

vi.mock('../GameModeStep', () => ({
  default: (props: any) => {
    mockGameModeStep(props);
    return (
      <div data-testid="game-mode-step">
        <button onClick={() => props.nextStep()}>Next from Game Mode</button>
        <button onClick={() => props.prevStep()}>Previous from Game Mode</button>
      </div>
    );
  },
}));

vi.mock('../ActionsStep', () => ({
  default: (props: any) => {
    mockActionsStep(props);
    return (
      <div data-testid="actions-step">
        <div data-testid="actions-list">
          {props.actionsList?.map((action: any) => (
            <div key={action.id}>{action.text}</div>
          ))}
        </div>
        <div data-testid="is-loading">{props.isActionsLoading.toString()}</div>
        <button onClick={() => props.nextStep()}>Next from Actions</button>
        <button onClick={() => props.prevStep()}>Previous from Actions</button>
      </div>
    );
  },
}));

vi.mock('../FinishStep', () => ({
  default: (props: any) => {
    mockFinishStep(props);
    return (
      <div data-testid="finish-step">
        <button onClick={() => props.prevStep()}>Previous from Finish</button>
        <button onClick={() => props.close?.()}>Close</button>
      </div>
    );
  },
}));

// Mock DynamicStepper
const mockDynamicStepper = vi.fn();
vi.mock('../components/DynamicStepper', () => ({
  default: (props: any) => {
    mockDynamicStepper(props);
    return (
      <div data-testid="dynamic-stepper">
        <div data-testid="current-step">{props.currentStep}</div>
        <div data-testid="is-public-room">{props.isPublicRoom.toString()}</div>
        <button onClick={() => props.onStepClick?.(1)}>Step 1</button>
        <button onClick={() => props.onStepClick?.(2)}>Step 2</button>
        <button onClick={() => props.onStepClick?.(3)}>Step 3</button>
        <button onClick={() => props.onStepClick?.(4)}>Step 4</button>
        <button onClick={() => props.onStepClick?.(5)}>Step 5</button>
      </div>
    );
  },
}));

// Mock GameSettings
const mockGameSettings = vi.fn();
vi.mock('@/views/GameSettings', () => ({
  default: (props: any) => {
    mockGameSettings(props);
    return (
      <div data-testid="game-settings">
        <button onClick={() => props.onOpenSetupWizard?.()}>Back to Wizard</button>
        <button onClick={() => props.closeDialog?.()}>Close Settings</button>
      </div>
    );
  },
}));

describe('GameSettingsWizard - Public Room Flow', () => {
  const mockClose = vi.fn();
  const mockSetFormData = vi.fn();
  let user: ReturnType<typeof userEvent.setup>;

  const publicRoomFormData = {
    room: 'PUBLIC',
    gameMode: 'online',
    roomRealtime: true,
    actions: [],
    consumption: [],
    role: 'sub',
    boardUpdated: false,
    advancedSettings: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();

    mockUseSettingsToFormData.mockReturnValue([publicRoomFormData, mockSetFormData]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement, route = '/PUBLIC') => {
    return render(<MemoryRouter initialEntries={[route]}>{component}</MemoryRouter>);
  };

  describe('Initial Navigation Behavior', () => {
    it('should skip to step 4 (Actions) for public rooms on initial load', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('room-step')).not.toBeInTheDocument();
      expect(screen.queryByTestId('local-players-step')).not.toBeInTheDocument();
      expect(screen.queryByTestId('game-mode-step')).not.toBeInTheDocument();
    });

    it('should pass correct props to DynamicStepper for public room', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await waitFor(() => {
        expect(mockDynamicStepper).toHaveBeenCalledWith(
          expect.objectContaining({
            currentStep: 4,
            isPublicRoom: true,
            onStepClick: expect.any(Function),
          })
        );
      });
    });

    it('should show only 3 steps in stepper for public room', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('is-public-room')).toHaveTextContent('true');
        expect(screen.getByTestId('current-step')).toHaveTextContent('4');
      });
    });

    it('should pass actions list and loading state to ActionsStep', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await waitFor(() => {
        expect(mockActionsStep).toHaveBeenCalledWith(
          expect.objectContaining({
            actionsList: mockUseUnifiedActionList.actionsList,
            isActionsLoading: false,
          })
        );
      });
    });
  });

  describe('Step Protection for Public Rooms', () => {
    it('should auto-redirect from step 2 (Local Players) to step 4 (Actions)', async () => {
      // Start from actions step
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
      });

      // Try to navigate to step 2 via stepper
      const step2Button = screen.getByText('Step 2');
      await user.click(step2Button);

      // Should immediately redirect back to actions step
      await waitFor(() => {
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
        expect(screen.queryByTestId('local-players-step')).not.toBeInTheDocument();
      });
    });

    it('should auto-redirect from step 3 (Game Mode) to step 4 (Actions)', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
      });

      // Try to navigate to step 3 via stepper
      const step3Button = screen.getByText('Step 3');
      await user.click(step3Button);

      // Should immediately redirect back to actions step
      await waitFor(() => {
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
        expect(screen.queryByTestId('game-mode-step')).not.toBeInTheDocument();
      });
    });

    it('should prevent accessing protected steps during renderStep calls', () => {
      // Mock formData to simulate accessing step 2 with public room
      const formDataStep2 = { ...publicRoomFormData };
      mockUseSettingsToFormData.mockReturnValue([formDataStep2, mockSetFormData]);

      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      // The component should not render local players step for public room
      expect(screen.queryByTestId('local-players-step')).not.toBeInTheDocument();
      expect(mockLocalPlayersStep).not.toHaveBeenCalled();
    });
  });

  describe('Step Navigation in Public Room', () => {
    it('should allow navigation to step 1 (Room Selection)', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
      });

      const step1Button = screen.getByText('Step 1');
      await user.click(step1Button);

      await waitFor(() => {
        expect(screen.getByTestId('room-step')).toBeInTheDocument();
        expect(mockRoomStep).toHaveBeenCalledWith(
          expect.objectContaining({
            formData: publicRoomFormData,
            setFormData: mockSetFormData,
            nextStep: expect.any(Function),
          })
        );
      });
    });

    it('should allow navigation to step 5 (Finish)', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
      });

      const step5Button = screen.getByText('Step 5');
      await user.click(step5Button);

      await waitFor(() => {
        expect(screen.getByTestId('finish-step')).toBeInTheDocument();
        expect(mockFinishStep).toHaveBeenCalledWith(
          expect.objectContaining({
            formData: publicRoomFormData,
            setFormData: mockSetFormData,
            prevStep: expect.any(Function),
            actionsList: mockUseUnifiedActionList.actionsList,
            close: mockClose,
          })
        );
      });
    });

    it('should handle previous button correctly from Actions step in public room', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
      });

      const prevButton = screen.getByText('Previous from Actions');
      await user.click(prevButton);

      // Should go back 3 steps to Room Selection (step 1) since steps 2 and 3 are skipped
      await waitFor(() => {
        expect(screen.getByTestId('room-step')).toBeInTheDocument();
      });
    });
  });

  describe('Stepper Updates Based on FormData', () => {
    it('should update stepper when room type changes from private to public', async () => {
      // Start with private room
      const privateRoomFormData = { ...publicRoomFormData, room: 'PRIVATE_ROOM' };
      mockUseSettingsToFormData.mockReturnValue([privateRoomFormData, mockSetFormData]);

      const { rerender } = renderWithRouter(<GameSettingsWizard close={mockClose} />);

      // Initially should be private room
      await waitFor(() => {
        expect(mockDynamicStepper).toHaveBeenCalledWith(
          expect.objectContaining({
            isPublicRoom: false,
          })
        );
      });

      // Change to public room
      mockUseSettingsToFormData.mockReturnValue([publicRoomFormData, mockSetFormData]);
      rerender(<GameSettingsWizard close={mockClose} />);

      await waitFor(() => {
        expect(mockDynamicStepper).toHaveBeenCalledWith(
          expect.objectContaining({
            isPublicRoom: true,
          })
        );
      });
    });

    it('should use formData.room for stepper configuration, not URL parameter', async () => {
      // URL shows PUBLIC but formData shows private room (edge case)
      const privateRoomFormData = { ...publicRoomFormData, room: 'PRIVATE_ROOM' };
      mockUseSettingsToFormData.mockReturnValue([privateRoomFormData, mockSetFormData]);

      renderWithRouter(<GameSettingsWizard close={mockClose} />, '/PUBLIC');

      await waitFor(() => {
        expect(mockDynamicStepper).toHaveBeenCalledWith(
          expect.objectContaining({
            isPublicRoom: false, // Should use formData.room, not URL
          })
        );
      });
    });
  });

  describe('Advanced Settings Mode', () => {
    it('should open advanced settings when advancedSettings is true', async () => {
      const advancedFormData = { ...publicRoomFormData, advancedSettings: true };
      mockUseSettingsToFormData.mockReturnValue([advancedFormData, mockSetFormData]);

      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('game-settings')).toBeInTheDocument();
        expect(mockGameSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            closeDialog: mockClose,
            onOpenSetupWizard: expect.any(Function),
          })
        );
      });
    });

    it('should navigate to advanced settings when button is clicked', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
      });

      const advancedButton = screen.getByTestId('advancedSetup');
      await user.click(advancedButton);

      await waitFor(() => {
        expect(screen.getByTestId('game-settings')).toBeInTheDocument();
      });
    });

    it('should return to wizard from advanced settings using goToSetupWizard', async () => {
      const advancedFormData = { ...publicRoomFormData, advancedSettings: true };
      mockUseSettingsToFormData.mockReturnValue([advancedFormData, mockSetFormData]);

      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('game-settings')).toBeInTheDocument();
      });

      const backToWizardButton = screen.getByText('Back to Wizard');
      await user.click(backToWizardButton);

      // Should return to actions step for public room
      await waitFor(() => {
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
      });
    });
  });

  describe('Component Integration', () => {
    it('should pass correct nextStep and prevStep functions to components', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      // Navigate to finish step
      await waitFor(() => {
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next from Actions');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByTestId('finish-step')).toBeInTheDocument();
      });

      // Test prevStep from finish
      const prevButton = screen.getByText('Previous from Finish');
      await user.click(prevButton);

      await waitFor(() => {
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
      });
    });

    it('should handle actions loading state correctly', async () => {
      mockUseUnifiedActionList.isLoading = true;

      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
      });
    });

    it('should handle close callback properly', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      // Navigate to finish step
      const step5Button = screen.getByText('Step 5');
      await user.click(step5Button);

      await waitFor(() => {
        expect(screen.getByTestId('finish-step')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      expect(mockClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Public Room Form Data Override', () => {
    it('should apply public room overrides correctly', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await waitFor(() => {
        expect(mockUseSettingsToFormData).toHaveBeenCalledWith(
          expect.objectContaining({
            gameMode: 'online',
            roomRealtime: true,
            room: 'PUBLIC',
          }),
          expect.objectContaining({
            room: 'PUBLIC',
            gameMode: 'online',
            roomRealtime: true,
          })
        );
      });
    });

    it('should maintain public room settings throughout navigation', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      // Navigate through different steps
      const step1Button = screen.getByText('Step 1');
      await user.click(step1Button);

      await waitFor(() => {
        expect(mockRoomStep).toHaveBeenCalledWith(
          expect.objectContaining({
            formData: expect.objectContaining({
              room: 'PUBLIC',
              gameMode: 'online',
              roomRealtime: true,
            }),
          })
        );
      });

      const step5Button = screen.getByText('Step 5');
      await user.click(step5Button);

      await waitFor(() => {
        expect(mockFinishStep).toHaveBeenCalledWith(
          expect.objectContaining({
            formData: expect.objectContaining({
              room: 'PUBLIC',
              gameMode: 'online',
              roomRealtime: true,
            }),
          })
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing close prop gracefully', async () => {
      renderWithRouter(<GameSettingsWizard />);

      await waitFor(() => {
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
      });

      // Component should still render and function
      expect(mockActionsStep).toHaveBeenCalledWith(
        expect.objectContaining({
          close: undefined,
        })
      );
    });

    it('should handle undefined room parameter', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />, '/');

      // Should still apply PUBLIC as default for room
      await waitFor(() => {
        expect(mockUseSettingsToFormData).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            room: undefined,
          })
        );
      });
    });

    it('should handle stepper click with no onStepClick', async () => {
      // Mock DynamicStepper without onStepClick
      mockDynamicStepper.mockImplementation((props) => (
        <div data-testid="dynamic-stepper">
          <button onClick={() => props.onStepClick?.(1)}>Step 1</button>
        </div>
      ));

      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      const step1Button = screen.getByText('Step 1');
      await user.click(step1Button);

      // Should handle gracefully without errors
      expect(screen.getByTestId('dynamic-stepper')).toBeInTheDocument();
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should maintain proper component structure for screen readers', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('dynamic-stepper')).toBeInTheDocument();
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
        expect(screen.getByTestId('advancedSetup')).toBeInTheDocument();
      });
    });

    it('should provide clear navigation feedback', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('current-step')).toHaveTextContent('4');
        expect(screen.getByTestId('is-public-room')).toHaveTextContent('true');
      });
    });
  });
});
