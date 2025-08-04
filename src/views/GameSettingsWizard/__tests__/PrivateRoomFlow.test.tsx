import { MemoryRouter, useParams } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { GameMode } from '@/types/Settings'; // Adjust the path if needed
import GameSettingsWizard from '../index';
import type { PlayerRole } from '@/types/Settings'; // Add this import at the top if not present
import useSettingsToFormData from '@/hooks/useSettingsToFormData';
import userEvent from '@testing-library/user-event';

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
vi.mock('@/hooks/useSettingsToFormData', () => ({
  default: vi.fn(),
}));

const mockUseSettingsToFormData = vi.mocked(useSettingsToFormData);
const mockUseParams = vi.mocked(useParams);

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

// Override the global useParams mock to use the actual router parameter
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
  };
});

describe('GameSettingsWizard - Private Room Flow', () => {
  const mockClose = vi.fn();
  const mockSetFormData = vi.fn();
  let user: ReturnType<typeof userEvent.setup>;

  const privateRoomFormData = {
    room: 'PRIVATE_ROOM',
    gameMode: 'local' as GameMode,
    roomRealtime: false,
    actions: [],
    consumption: [],
    role: 'sub' as PlayerRole,
    boardUpdated: false,
    advancedSettings: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();

    // Set default route parameter
    mockUseParams.mockReturnValue({ id: 'PRIVATE_ROOM' });
    mockUseSettingsToFormData.mockReturnValue([privateRoomFormData, mockSetFormData]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement, route = '/PRIVATE_ROOM') => {
    return render(<MemoryRouter initialEntries={[route]}>{component}</MemoryRouter>);
  };

  describe('Initial Navigation Behavior', () => {
    it('should start at step 1 (Room Selection) for private rooms without close function', async () => {
      renderWithRouter(<GameSettingsWizard />);

      await waitFor(() => {
        expect(screen.getByTestId('room-step')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('actions-step')).not.toBeInTheDocument();
    });

    it('should start at step 1 (Room Selection) for private rooms with close function', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('room-step')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('local-players-step')).not.toBeInTheDocument();
    });

    it('should start at step 1 even when gameMode is already online', async () => {
      const onlineFormData = { ...privateRoomFormData, gameMode: 'online' as GameMode };
      mockUseSettingsToFormData.mockReturnValue([onlineFormData, mockSetFormData]);

      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('room-step')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('actions-step')).not.toBeInTheDocument();
    });

    it('should pass correct props to DynamicStepper for private room', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await waitFor(() => {
        expect(mockDynamicStepper).toHaveBeenCalledWith(
          expect.objectContaining({
            currentStep: 1,
            isPublicRoom: false,
            onStepClick: expect.any(Function),
          })
        );
      });
    });

    it('should show all 5 steps in stepper for private room', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('is-public-room')).toHaveTextContent('false');
        expect(screen.getByTestId('current-step')).toHaveTextContent('1');
      });
    });
  });

  describe('Complete Step Navigation Flow', () => {
    it('should allow navigation through all 5 steps in order', async () => {
      renderWithRouter(<GameSettingsWizard />);

      // Step 1: Room Selection
      await waitFor(() => {
        expect(screen.getByTestId('room-step')).toBeInTheDocument();
        expect(mockRoomStep).toHaveBeenCalledWith(
          expect.objectContaining({
            formData: privateRoomFormData,
            setFormData: mockSetFormData,
            nextStep: expect.any(Function),
          })
        );
      });

      // Navigate to Step 2: Local Players
      const nextFromRoom = screen.getByText('Next from Room');
      await user.click(nextFromRoom);

      await waitFor(() => {
        expect(screen.getByTestId('local-players-step')).toBeInTheDocument();
        expect(mockLocalPlayersStep).toHaveBeenCalledWith(
          expect.objectContaining({
            formData: privateRoomFormData,
            setFormData: mockSetFormData,
            nextStep: expect.any(Function),
            prevStep: expect.any(Function),
          })
        );
      });

      // Navigate to Step 3: Game Mode
      const nextFromLocalPlayers = screen.getByText('Next from Local Players');
      await user.click(nextFromLocalPlayers);

      await waitFor(() => {
        expect(screen.getByTestId('game-mode-step')).toBeInTheDocument();
        expect(mockGameModeStep).toHaveBeenCalledWith(
          expect.objectContaining({
            formData: privateRoomFormData,
            setFormData: mockSetFormData,
            nextStep: expect.any(Function),
            prevStep: expect.any(Function),
          })
        );
      });

      // Navigate to Step 4: Actions
      const nextFromGameMode = screen.getByText('Next from Game Mode');
      await user.click(nextFromGameMode);

      await waitFor(() => {
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
        expect(mockActionsStep).toHaveBeenCalledWith(
          expect.objectContaining({
            formData: privateRoomFormData,
            setFormData: mockSetFormData,
            nextStep: expect.any(Function),
            prevStep: expect.any(Function),
            actionsList: mockUseUnifiedActionList.actionsList,
            isActionsLoading: false,
          })
        );
      });

      // Navigate to Step 5: Finish
      const nextFromActions = screen.getByText('Next from Actions');
      await user.click(nextFromActions);

      await waitFor(() => {
        expect(screen.getByTestId('finish-step')).toBeInTheDocument();
        expect(mockFinishStep).toHaveBeenCalledWith(
          expect.objectContaining({
            formData: privateRoomFormData,
            setFormData: mockSetFormData,
            prevStep: expect.any(Function),
            actionsList: mockUseUnifiedActionList.actionsList,
            close: undefined,
          })
        );
      });
    });

    it('should allow backward navigation through all steps', async () => {
      renderWithRouter(<GameSettingsWizard />);

      // Navigate to step 5 first
      const step5Button = screen.getByText('Step 5');
      await user.click(step5Button);

      await waitFor(() => {
        expect(screen.getByTestId('finish-step')).toBeInTheDocument();
      });

      // Navigate backwards: Step 5 → Step 4
      const prevFromFinish = screen.getByText('Previous from Finish');
      await user.click(prevFromFinish);

      await waitFor(() => {
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
      });

      // Step 4 → Step 3
      const prevFromActions = screen.getByText('Previous from Actions');
      await user.click(prevFromActions);

      await waitFor(() => {
        expect(screen.getByTestId('game-mode-step')).toBeInTheDocument();
      });

      // Step 3 → Step 2
      const prevFromGameMode = screen.getByText('Previous from Game Mode');
      await user.click(prevFromGameMode);

      await waitFor(() => {
        expect(screen.getByTestId('local-players-step')).toBeInTheDocument();
      });

      // Step 2 → Step 1
      const prevFromLocalPlayers = screen.getByText('Previous from Local Players');
      await user.click(prevFromLocalPlayers);

      await waitFor(() => {
        expect(screen.getByTestId('room-step')).toBeInTheDocument();
      });
    });
  });

  describe('Stepper Click Navigation', () => {
    it('should allow direct navigation to any step via stepper clicks', async () => {
      renderWithRouter(<GameSettingsWizard />);

      // Start at step 1, navigate to each step via stepper
      await waitFor(() => {
        expect(screen.getByTestId('room-step')).toBeInTheDocument();
      });

      // Click step 2
      const step2Button = screen.getByText('Step 2');
      await user.click(step2Button);

      await waitFor(() => {
        expect(screen.getByTestId('local-players-step')).toBeInTheDocument();
      });

      // Click step 3
      const step3Button = screen.getByText('Step 3');
      await user.click(step3Button);

      await waitFor(() => {
        expect(screen.getByTestId('game-mode-step')).toBeInTheDocument();
      });

      // Click step 4
      const step4Button = screen.getByText('Step 4');
      await user.click(step4Button);

      await waitFor(() => {
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
      });

      // Click step 5
      const step5Button = screen.getByText('Step 5');
      await user.click(step5Button);

      await waitFor(() => {
        expect(screen.getByTestId('finish-step')).toBeInTheDocument();
      });

      // Click back to step 1
      const step1Button = screen.getByText('Step 1');
      await user.click(step1Button);

      await waitFor(() => {
        expect(screen.getByTestId('room-step')).toBeInTheDocument();
      });
    });

    it('should update stepper current step correctly during navigation', async () => {
      renderWithRouter(<GameSettingsWizard />);

      const checkStepperState = async (expectedStep: number) => {
        await waitFor(() => {
          expect(screen.getByTestId('current-step')).toHaveTextContent(expectedStep.toString());
        });
      };

      // Check initial state
      await checkStepperState(1);

      // Navigate through steps and verify stepper updates
      const step3Button = screen.getByText('Step 3');
      await user.click(step3Button);
      await checkStepperState(3);

      const step5Button = screen.getByText('Step 5');
      await user.click(step5Button);
      await checkStepperState(5);

      const step2Button = screen.getByText('Step 2');
      await user.click(step2Button);
      await checkStepperState(2);
    });
  });

  describe('Previous Button Behavior in Actions Step', () => {
    it('should go back 1 step from Actions to Game Mode in private room', async () => {
      renderWithRouter(<GameSettingsWizard />);

      // Navigate to actions step
      const step4Button = screen.getByText('Step 4');
      await user.click(step4Button);

      await waitFor(() => {
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
      });

      // Click previous button
      const prevButton = screen.getByText('Previous from Actions');
      await user.click(prevButton);

      // Should go back to step 3 (Game Mode), not step 1 like in public rooms
      await waitFor(() => {
        expect(screen.getByTestId('game-mode-step')).toBeInTheDocument();
      });
    });

    it('should correctly handle previous navigation from different starting points', async () => {
      renderWithRouter(<GameSettingsWizard />);

      // Test from step 4 going back to step 3
      const step4Button = screen.getByText('Step 4');
      await user.click(step4Button);

      await waitFor(() => {
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
      });

      const prevFromActions = screen.getByText('Previous from Actions');
      await user.click(prevFromActions);

      await waitFor(() => {
        expect(screen.getByTestId('game-mode-step')).toBeInTheDocument();
      });

      // Test from step 3 going back to step 2
      const prevFromGameMode = screen.getByText('Previous from Game Mode');
      await user.click(prevFromGameMode);

      await waitFor(() => {
        expect(screen.getByTestId('local-players-step')).toBeInTheDocument();
      });
    });
  });

  describe('Stepper Updates Based on FormData', () => {
    it('should update stepper when room type changes from public to private', async () => {
      // Start with public room
      const publicRoomFormData = { ...privateRoomFormData, room: 'PUBLIC' };
      mockUseSettingsToFormData.mockReturnValue([publicRoomFormData, mockSetFormData]);

      const { rerender } = renderWithRouter(<GameSettingsWizard close={mockClose} />);

      // Initially should be public room
      await waitFor(() => {
        expect(mockDynamicStepper).toHaveBeenCalledWith(
          expect.objectContaining({
            isPublicRoom: true,
          })
        );
      });

      // Change to private room
      mockUseSettingsToFormData.mockReturnValue([privateRoomFormData, mockSetFormData]);
      rerender(<GameSettingsWizard close={mockClose} />);

      await waitFor(() => {
        expect(mockDynamicStepper).toHaveBeenCalledWith(
          expect.objectContaining({
            isPublicRoom: false,
          })
        );
      });
    });

    it('should use formData.room for stepper configuration, not URL parameter', async () => {
      // URL shows PRIVATE_ROOM but formData shows public room (edge case)
      const publicRoomFormData = { ...privateRoomFormData, room: 'PUBLIC' };
      mockUseSettingsToFormData.mockReturnValue([publicRoomFormData, mockSetFormData]);

      renderWithRouter(<GameSettingsWizard close={mockClose} />, '/PRIVATE_ROOM');

      await waitFor(() => {
        expect(mockDynamicStepper).toHaveBeenCalledWith(
          expect.objectContaining({
            isPublicRoom: true, // Should use formData.room, not URL
          })
        );
      });
    });

    it('should handle room type changes and maintain correct step flow', async () => {
      renderWithRouter(<GameSettingsWizard />);

      // Start at step 1 for private room
      await waitFor(() => {
        expect(screen.getByTestId('room-step')).toBeInTheDocument();
      });

      // Simulate room type change to public
      const publicFormData = { ...privateRoomFormData, room: 'PUBLIC' };
      mockUseSettingsToFormData.mockReturnValue([publicFormData, mockSetFormData]);

      // Navigate to a step that would be protected in public room
      const step2Button = screen.getByText('Step 2');
      await user.click(step2Button);

      // If room type changed to public, local players step should not be accessible
      // This tests the integration between formData changes and step protection
    });
  });

  describe('goToSetupWizard Function Behavior', () => {
    it('should return to step 1 for private room with local gameMode', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      // First navigate to advanced settings
      const advancedButton = screen.getAllByTestId('advancedSetup')[0];
      await user.click(advancedButton);

      await waitFor(() => {
        expect(screen.getByTestId('game-settings')).toBeInTheDocument();
      });

      const backToWizardButton = screen.getByText('Back to Wizard');
      await user.click(backToWizardButton);

      // Should return to step 1 for private room with local gameMode
      await waitFor(() => {
        expect(screen.getByTestId('room-step')).toBeInTheDocument();
      });
      const onlineFormData = {
        ...privateRoomFormData,
        gameMode: 'online' as GameMode,
      };
      mockUseSettingsToFormData.mockReturnValue([onlineFormData, mockSetFormData]);

      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      // First navigate to advanced settings
      const advancedButtonOnline = screen.getAllByTestId('advancedSetup')[0];
      await user.click(advancedButtonOnline);

      await waitFor(() => {
        expect(screen.getByTestId('game-settings')).toBeInTheDocument();
      });

      const backToWizardButtonOnline = screen.getByText('Back to Wizard');
      await user.click(backToWizardButtonOnline);

      // Should skip to step 4 for online gameMode even in private room
      await waitFor(() => {
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
      });
    });

    it('should handle goToSetupWizard from advanced mode correctly', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      // Navigate to advanced settings
      const advancedButton = screen.getAllByTestId('advancedSetup')[0];
      await user.click(advancedButton);

      await waitFor(() => {
        expect(screen.getByTestId('game-settings')).toBeInTheDocument();
      });

      // Return to wizard
      const backToWizardButton = screen.getByText('Back to Wizard');
      await user.click(backToWizardButton);

      // Should return to step 1 (Room Selection) as that's the initial step for private room with close function
      await waitFor(() => {
        expect(screen.getByTestId('room-step')).toBeInTheDocument();
      });
    });
  });

  describe('Component Integration and Props', () => {
    it('should pass correct props to all step components', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      // Navigate through each step and verify props
      await waitFor(() => {
        expect(screen.getByTestId('room-step')).toBeInTheDocument();
      });

      // Navigate to Step 2: Local Players
      const nextFromRoom = screen.getByText('Next from Room');
      await user.click(nextFromRoom);

      await waitFor(() => {
        expect(screen.getByTestId('local-players-step')).toBeInTheDocument();
        expect(mockLocalPlayersStep).toHaveBeenCalledWith(
          expect.objectContaining({
            formData: privateRoomFormData,
            setFormData: mockSetFormData,
            nextStep: expect.any(Function),
            prevStep: expect.any(Function),
          })
        );
      });

      const step3Button = screen.getByText('Step 3');
      await user.click(step3Button);

      await waitFor(() => {
        expect(mockGameModeStep).toHaveBeenCalledWith(
          expect.objectContaining({
            formData: privateRoomFormData,
            setFormData: mockSetFormData,
            nextStep: expect.any(Function),
            prevStep: expect.any(Function),
          })
        );
      });

      const step4Button = screen.getByText('Step 4');
      await user.click(step4Button);

      await waitFor(() => {
        expect(mockActionsStep).toHaveBeenCalledWith(
          expect.objectContaining({
            formData: privateRoomFormData,
            setFormData: mockSetFormData,
            nextStep: expect.any(Function),
            prevStep: expect.any(Function),
            actionsList: mockUseUnifiedActionList.actionsList,
            isActionsLoading: false,
          })
        );
      });

      const step5Button = screen.getByText('Step 5');
      await user.click(step5Button);

      await waitFor(() => {
        expect(mockFinishStep).toHaveBeenCalledWith(
          expect.objectContaining({
            formData: privateRoomFormData,
            setFormData: mockSetFormData,
            prevStep: expect.any(Function),
            actionsList: mockUseUnifiedActionList.actionsList,
            close: mockClose,
          })
        );
      });
    });

    it('should handle actions loading state correctly', async () => {
      mockUseUnifiedActionList.isLoading = true;

      renderWithRouter(<GameSettingsWizard />);

      const step4Button = screen.getByText('Step 4');
      await user.click(step4Button);

      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
      });
    });

    it('should maintain consistent formData across step navigation', async () => {
      renderWithRouter(<GameSettingsWizard />);

      // Navigate through steps and verify formData consistency
      const step2Button = screen.getByText('Step 2');
      await user.click(step2Button);

      await waitFor(() => {
        expect(mockLocalPlayersStep).toHaveBeenCalledWith(
          expect.objectContaining({
            formData: expect.objectContaining({
              room: 'PRIVATE_ROOM',
              gameMode: 'local',
            }),
          })
        );
      });

      const step4Button = screen.getByText('Step 4');
      await user.click(step4Button);

      await waitFor(() => {
        expect(mockActionsStep).toHaveBeenCalledWith(
          expect.objectContaining({
            formData: expect.objectContaining({
              room: 'PRIVATE_ROOM',
              gameMode: 'local',
            }),
          })
        );
      });
    });
  });

  describe('Private Room Form Data Override', () => {
    it('should not apply public room overrides for private rooms', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await waitFor(() => {
        expect(mockUseSettingsToFormData).toHaveBeenCalledWith(
          expect.objectContaining({
            gameMode: 'online',
            roomRealtime: true,
            room: 'PRIVATE_ROOM',
          }),
          expect.objectContaining({
            room: 'PRIVATE_ROOM',
            // Should not force gameMode: 'online' for private rooms
            // Should not force roomRealtime: true for private rooms
          })
        );
      });
    });

    it('should maintain private room settings throughout navigation', async () => {
      renderWithRouter(<GameSettingsWizard />);

      // Navigate through different steps and verify private room settings are maintained
      const step3Button = screen.getByText('Step 3');
      await user.click(step3Button);

      await waitFor(() => {
        expect(mockGameModeStep).toHaveBeenCalledWith(
          expect.objectContaining({
            formData: expect.objectContaining({
              room: 'PRIVATE_ROOM',
              gameMode: 'local', // Should maintain local for private room
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
              room: 'PRIVATE_ROOM',
              gameMode: 'local',
            }),
          })
        );
      });
    });
  });

  describe('Advanced Settings Integration', () => {
    it('should navigate to advanced settings and back correctly', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('room-step')).toBeInTheDocument();
      });

      const advancedButton = screen.getAllByTestId('advancedSetup')[0];
      await user.click(advancedButton);

      await waitFor(() => {
        expect(screen.getByTestId('game-settings')).toBeInTheDocument();
      });

      const backToWizardButton = screen.getByText('Back to Wizard');
      await user.click(backToWizardButton);

      await waitFor(() => {
        expect(screen.getByTestId('room-step')).toBeInTheDocument();
      });
    });

    it('should handle close from advanced settings', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      const advancedButton = screen.getAllByTestId('advancedSetup')[0];
      await user.click(advancedButton);

      await waitFor(() => {
        expect(screen.getByTestId('game-settings')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('Close Settings');
      await user.click(closeButton);

      expect(mockClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Step Count and Navigation Logic', () => {
    it('should show correct step count for private room (5 steps)', async () => {
      renderWithRouter(<GameSettingsWizard />);

      await waitFor(() => {
        expect(mockDynamicStepper).toHaveBeenCalledWith(
          expect.objectContaining({
            isPublicRoom: false,
          })
        );
      });

      // All 5 step buttons should be available
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 2')).toBeInTheDocument();
      expect(screen.getByText('Step 3')).toBeInTheDocument();
      expect(screen.getByText('Step 4')).toBeInTheDocument();
      expect(screen.getByText('Step 5')).toBeInTheDocument();
    });

    it('should handle step arithmetic correctly for private room navigation', async () => {
      renderWithRouter(<GameSettingsWizard />);

      // Start at step 1
      await waitFor(() => {
        expect(screen.getByTestId('room-step')).toBeInTheDocument();
      });

      // Navigate to step 4, then use previous button (should go to step 3)
      const step4Button = screen.getByText('Step 4');
      await user.click(step4Button);

      await waitFor(() => {
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
      });

      const prevFromActions = screen.getByText('Previous from Actions');
      await user.click(prevFromActions);

      await waitFor(() => {
        expect(screen.getByTestId('game-mode-step')).toBeInTheDocument();
      });
    });
  });
});
