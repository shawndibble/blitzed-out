import { MemoryRouter, useParams } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { GameMode } from '@/types/Settings';
import GameSettingsWizard from '../index';
import type { PlayerRole } from '@/types/Settings';
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
    mockUseParams.mockReturnValue({ id: 'PRIVATE_ROOM' });
    mockUseSettingsToFormData.mockReturnValue([privateRoomFormData, mockSetFormData]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<MemoryRouter initialEntries={['/PRIVATE_ROOM']}>{component}</MemoryRouter>);
  };

  describe('Initial State', () => {
    it('should render on step 1 with private room configuration', () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      expect(screen.getByTestId('room-step')).toBeInTheDocument();
      expect(screen.getByTestId('is-public-room')).toHaveTextContent('false');
      expect(screen.getByTestId('current-step')).toHaveTextContent('1');
      expect(screen.queryByTestId('local-players-step')).not.toBeInTheDocument();
    });

    it('should show all 5 step buttons for private room', () => {
      renderWithRouter(<GameSettingsWizard />);

      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 2')).toBeInTheDocument();
      expect(screen.getByText('Step 3')).toBeInTheDocument();
      expect(screen.getByText('Step 4')).toBeInTheDocument();
      expect(screen.getByText('Step 5')).toBeInTheDocument();
    });
  });

  describe('Forward Navigation', () => {
    it('should navigate through all 5 steps sequentially', async () => {
      renderWithRouter(<GameSettingsWizard />);

      // Step 1 → 2
      expect(screen.getByTestId('room-step')).toBeInTheDocument();
      await user.click(screen.getByText('Next from Room'));
      expect(screen.getByTestId('local-players-step')).toBeInTheDocument();

      // Step 2 → 3
      await user.click(screen.getByText('Next from Local Players'));
      expect(screen.getByTestId('game-mode-step')).toBeInTheDocument();

      // Step 3 → 4
      await user.click(screen.getByText('Next from Game Mode'));
      expect(screen.getByTestId('actions-step')).toBeInTheDocument();

      // Step 4 → 5
      await user.click(screen.getByText('Next from Actions'));
      expect(screen.getByTestId('finish-step')).toBeInTheDocument();
    });

    it('should pass correct props during forward navigation', async () => {
      renderWithRouter(<GameSettingsWizard />);

      await user.click(screen.getByText('Next from Room'));
      expect(mockLocalPlayersStep).toHaveBeenCalledWith(
        expect.objectContaining({
          formData: privateRoomFormData,
          setFormData: mockSetFormData,
          nextStep: expect.any(Function),
          prevStep: expect.any(Function),
        })
      );

      await user.click(screen.getByText('Next from Local Players'));
      await user.click(screen.getByText('Next from Game Mode'));
      expect(mockActionsStep).toHaveBeenCalledWith(
        expect.objectContaining({
          formData: privateRoomFormData,
          actionsList: mockUseUnifiedActionList.actionsList,
          isActionsLoading: false,
        })
      );
    });
  });

  describe('Backward Navigation', () => {
    it('should navigate backward through all steps', async () => {
      renderWithRouter(<GameSettingsWizard />);

      // Jump to step 5
      await user.click(screen.getByText('Step 5'));
      expect(screen.getByTestId('finish-step')).toBeInTheDocument();

      // Step 5 → 4 → 3 → 2 → 1
      await user.click(screen.getByText('Previous from Finish'));
      expect(screen.getByTestId('actions-step')).toBeInTheDocument();

      await user.click(screen.getByText('Previous from Actions'));
      expect(screen.getByTestId('game-mode-step')).toBeInTheDocument();

      await user.click(screen.getByText('Previous from Game Mode'));
      expect(screen.getByTestId('local-players-step')).toBeInTheDocument();

      await user.click(screen.getByText('Previous from Local Players'));
      expect(screen.getByTestId('room-step')).toBeInTheDocument();
    });

    it('should go to Game Mode (step 3) when clicking previous from Actions in private room', async () => {
      renderWithRouter(<GameSettingsWizard />);

      await user.click(screen.getByText('Step 4'));
      expect(screen.getByTestId('actions-step')).toBeInTheDocument();

      await user.click(screen.getByText('Previous from Actions'));
      expect(screen.getByTestId('game-mode-step')).toBeInTheDocument();
    });
  });

  describe('Direct Step Navigation', () => {
    it('should allow jumping to any step and update stepper state', async () => {
      renderWithRouter(<GameSettingsWizard />);

      const steps = [
        { button: 'Step 3', testId: 'game-mode-step', stepNum: '3' },
        { button: 'Step 5', testId: 'finish-step', stepNum: '5' },
        { button: 'Step 2', testId: 'local-players-step', stepNum: '2' },
        { button: 'Step 1', testId: 'room-step', stepNum: '1' },
      ];

      for (const step of steps) {
        await user.click(screen.getByText(step.button));
        expect(screen.getByTestId(step.testId)).toBeInTheDocument();
        expect(screen.getByTestId('current-step')).toHaveTextContent(step.stepNum);
      }
    });
  });

  describe('Room Type Changes', () => {
    it('should update stepper configuration when room type changes', () => {
      const publicFormData = { ...privateRoomFormData, room: 'PUBLIC' };
      mockUseSettingsToFormData.mockReturnValue([publicFormData, mockSetFormData]);

      const { rerender } = renderWithRouter(<GameSettingsWizard close={mockClose} />);

      expect(mockDynamicStepper).toHaveBeenCalledWith(
        expect.objectContaining({ isPublicRoom: true })
      );

      // Change back to private
      mockUseSettingsToFormData.mockReturnValue([privateRoomFormData, mockSetFormData]);
      rerender(
        <MemoryRouter initialEntries={['/PRIVATE_ROOM']}>
          <GameSettingsWizard close={mockClose} />
        </MemoryRouter>
      );

      expect(mockDynamicStepper).toHaveBeenCalledWith(
        expect.objectContaining({ isPublicRoom: false })
      );
    });

    it('should use formData.room over URL parameter for configuration', () => {
      const publicFormData = { ...privateRoomFormData, room: 'PUBLIC' };
      mockUseSettingsToFormData.mockReturnValue([publicFormData, mockSetFormData]);

      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      expect(mockDynamicStepper).toHaveBeenCalledWith(
        expect.objectContaining({ isPublicRoom: true })
      );
    });
  });

  describe('Advanced Settings Integration', () => {
    it('should navigate to advanced settings and return to step 1 for local gameMode', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await user.click(screen.getAllByTestId('advancedSetup')[0]);
      expect(screen.getByTestId('game-settings')).toBeInTheDocument();

      await user.click(screen.getByText('Back to Wizard'));
      expect(screen.getByTestId('room-step')).toBeInTheDocument();
    });

    it('should return to step 4 for online gameMode when leaving advanced settings', async () => {
      const onlineFormData = { ...privateRoomFormData, gameMode: 'online' as GameMode };
      mockUseSettingsToFormData.mockReturnValue([onlineFormData, mockSetFormData]);

      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await user.click(screen.getAllByTestId('advancedSetup')[0]);
      await user.click(screen.getByText('Back to Wizard'));

      expect(screen.getByTestId('actions-step')).toBeInTheDocument();
    });

    it('should call close callback when closing from advanced settings', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await user.click(screen.getAllByTestId('advancedSetup')[0]);
      await user.click(screen.getByText('Close Settings'));

      expect(mockClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form Data Persistence', () => {
    it('should maintain consistent formData across navigation', async () => {
      renderWithRouter(<GameSettingsWizard />);

      await user.click(screen.getByText('Step 2'));
      expect(mockLocalPlayersStep).toHaveBeenCalledWith(
        expect.objectContaining({
          formData: expect.objectContaining({
            room: 'PRIVATE_ROOM',
            gameMode: 'local',
          }),
        })
      );

      await user.click(screen.getByText('Step 4'));
      expect(mockActionsStep).toHaveBeenCalledWith(
        expect.objectContaining({
          formData: expect.objectContaining({
            room: 'PRIVATE_ROOM',
            gameMode: 'local',
          }),
        })
      );
    });

    it('should not apply public room overrides to private rooms', () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      expect(mockUseSettingsToFormData).toHaveBeenCalledWith(
        expect.objectContaining({
          gameMode: 'online',
          roomRealtime: true,
          room: 'PRIVATE_ROOM',
        }),
        expect.objectContaining({ room: 'PRIVATE_ROOM' })
      );
    });
  });

  describe('Actions Loading State', () => {
    it('should reflect actions loading state in UI', async () => {
      mockUseUnifiedActionList.isLoading = true;
      renderWithRouter(<GameSettingsWizard />);

      await user.click(screen.getByText('Step 4'));
      expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
    });
  });
});
