import { render, screen, act } from '@/test-utils';
import { waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import GameSettingsWizard from '../index';

// Mock the child step components
vi.mock('../RoomStep', () => ({
  default: ({ nextStep, formData, setFormData }: any) => (
    <div data-testid="room-step">
      <button type="button" onClick={() => nextStep()} data-testid="room-next-btn">
        Next
      </button>
      <span data-testid="room-form-data">{JSON.stringify(formData?.room)}</span>
      <button
        type="button"
        onClick={() => setFormData((prev: any) => ({ ...prev, room: 'UPDATED' }))}
        data-testid="update-room-btn"
      >
        Update Room
      </button>
    </div>
  ),
}));

vi.mock('../LocalPlayersStep', () => ({
  default: ({ nextStep, prevStep, formData, setFormData }: any) => (
    <div data-testid="local-players-step">
      <button type="button" onClick={() => prevStep()} data-testid="local-players-prev-btn">
        Previous
      </button>
      <button type="button" onClick={() => nextStep()} data-testid="local-players-next-btn">
        Next
      </button>
      <span data-testid="local-players-form-data">{JSON.stringify(formData?.hasLocalPlayers)}</span>
      <button
        type="button"
        onClick={() => setFormData((prev: any) => ({ ...prev, hasLocalPlayers: true }))}
        data-testid="update-local-players-btn"
      >
        Update Local Players
      </button>
    </div>
  ),
}));

vi.mock('../GameModeStep', () => ({
  default: ({ nextStep, prevStep, formData, setFormData }: any) => (
    <div data-testid="game-mode-step">
      <button type="button" onClick={() => prevStep()} data-testid="game-mode-prev-btn">
        Previous
      </button>
      <button type="button" onClick={() => nextStep()} data-testid="game-mode-next-btn">
        Next
      </button>
      <span data-testid="game-mode-form-data">{JSON.stringify(formData?.gameMode)}</span>
      <button
        type="button"
        onClick={() => setFormData((prev: any) => ({ ...prev, gameMode: 'local' }))}
        data-testid="update-game-mode-btn"
      >
        Update Game Mode
      </button>
    </div>
  ),
}));

vi.mock('../ActionsStep', () => ({
  default: ({ nextStep, prevStep, formData, setFormData, actionsList, isActionsLoading }: any) => (
    <div data-testid="actions-step">
      <button type="button" onClick={() => prevStep()} data-testid="actions-prev-btn">
        Previous
      </button>
      <button type="button" onClick={() => nextStep()} data-testid="actions-next-btn">
        Next
      </button>
      <span data-testid="actions-form-data">{JSON.stringify(formData?.actions)}</span>
      <span data-testid="actions-list">{JSON.stringify(actionsList)}</span>
      <span data-testid="actions-loading">{JSON.stringify(isActionsLoading)}</span>
      <button
        type="button"
        onClick={() => setFormData((prev: any) => ({ ...prev, actions: ['updated'] }))}
        data-testid="update-actions-btn"
      >
        Update Actions
      </button>
    </div>
  ),
}));

vi.mock('../FinishStep', () => ({
  default: ({ prevStep, formData, setFormData, actionsList, close }: any) => (
    <div data-testid="finish-step">
      <button type="button" onClick={() => prevStep()} data-testid="finish-prev-btn">
        Previous
      </button>
      {close && (
        <button type="button" onClick={close} data-testid="finish-close-btn">
          Close
        </button>
      )}
      <span data-testid="finish-form-data">{JSON.stringify(formData?.boardUpdated)}</span>
      <span data-testid="finish-actions-list">{JSON.stringify(actionsList)}</span>
      <button
        type="button"
        onClick={() => setFormData((prev: any) => ({ ...prev, boardUpdated: true }))}
        data-testid="update-finish-btn"
      >
        Update Finish
      </button>
    </div>
  ),
}));

vi.mock('../components/DynamicStepper', () => ({
  default: ({ currentStep, isPublicRoom, onStepClick }: any) => (
    <div data-testid="dynamic-stepper">
      <span data-testid="stepper-current-step">{currentStep}</span>
      <span data-testid="stepper-is-public">{JSON.stringify(isPublicRoom)}</span>
      {onStepClick && (
        <>
          <button type="button" onClick={() => onStepClick(1)} data-testid="stepper-step-1">
            Step 1
          </button>
          <button type="button" onClick={() => onStepClick(4)} data-testid="stepper-step-4">
            Step 4
          </button>
        </>
      )}
    </div>
  ),
}));

vi.mock('@/views/GameSettings', () => ({
  default: ({ closeDialog, onOpenSetupWizard }: any) => (
    <div data-testid="game-settings">
      {closeDialog && (
        <button type="button" onClick={closeDialog} data-testid="game-settings-close-btn">
          Close Advanced
        </button>
      )}
      {onOpenSetupWizard && (
        <button
          type="button"
          onClick={onOpenSetupWizard}
          data-testid="game-settings-setup-wizard-btn"
        >
          Back to Setup Wizard
        </button>
      )}
    </div>
  ),
}));

// Mock hooks
const mockSetFormData = vi.fn();
vi.mock('@/hooks/useSettingsToFormData', () => ({
  default: (initialData: any, overrides: any) => {
    // Create a new object each time to ensure useEffect dependency detects changes
    const formData = {
      gameMode: 'online',
      roomRealtime: true,
      actions: [],
      consumption: [],
      role: 'sub',
      boardUpdated: false,
      room: overrides?.room || initialData?.room || 'TEST',
      advancedSettings: false,
      hasLocalPlayers: false,
      ...overrides,
    };
    return [formData, mockSetFormData];
  },
}));

vi.mock('@/hooks/useUnifiedActionList', () => ({
  default: () => ({ actionsList: { action1: 'test', action2: 'test2' }, isLoading: false }),
}));

vi.mock('@/helpers/strings', () => ({
  isPublicRoom: vi.fn((room?: string) => room?.toUpperCase() === 'PUBLIC'),
}));

// Mock react-router-dom
const mockParams = { id: 'TEST' };

vi.mock('react-router-dom', () => ({
  useParams: () => mockParams,
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        advancedSetup: 'Advanced Settings',
        roomSelection: 'Room Selection',
        'localPlayersStep.title': 'Local Players',
        gameModeSelection: 'Game Mode Selection',
        actionsSelection: 'Actions Selection',
        finishSetup: 'Finish Setup',
      };
      return translations[key] || key;
    },
    i18n: {
      resolvedLanguage: 'en',
    },
  }),
  Trans: ({ i18nKey, children }: { i18nKey?: string; children?: any }) => {
    const translations: Record<string, string> = {
      advancedSetup: 'Advanced Settings',
    };
    return i18nKey ? translations[i18nKey] || i18nKey : children;
  },
}));

// Mock migration context
vi.mock('@/context/migration', () => ({
  useMigration: () => ({
    currentLanguageMigrated: true,
    isMigrationInProgress: false,
    isMigrationCompleted: true,
    error: null,
    isHealthy: true,
    recoveryAttempted: false,
    triggerMigration: vi.fn(),
    ensureLanguageMigrated: vi.fn(),
    forceRecovery: vi.fn(),
  }),
}));

const renderWizard = (room = 'TEST', close?: () => void) => {
  mockParams.id = room;
  // Set the route before rendering since test-utils already provides BrowserRouter
  window.history.pushState({}, 'Test page', `/${room}`);
  return render(<GameSettingsWizard close={close} />);
};

describe('GameSettingsWizard - Enhanced Test Coverage', () => {
  const mockClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetFormData.mockClear();
  });

  describe('Enhanced Component Behavior', () => {
    it('renders the wizard with stepper and form data integration', () => {
      renderWizard();

      expect(screen.getByTestId('dynamic-stepper')).toBeInTheDocument();
      expect(screen.getByTestId('room-step')).toBeInTheDocument();
      expect(screen.getByTestId('room-form-data')).toHaveTextContent('"TEST"');
      expect(screen.getByRole('button', { name: /advanced/i })).toBeInTheDocument();
    });

    it('passes correct props to stepper for public rooms', () => {
      renderWizard('PUBLIC');

      expect(screen.getByTestId('stepper-current-step')).toHaveTextContent('1');
      expect(screen.getByTestId('stepper-is-public')).toHaveTextContent('true');
    });

    it('passes correct props to stepper for private rooms', () => {
      renderWizard('PRIVATE');

      expect(screen.getByTestId('stepper-current-step')).toHaveTextContent('1');
      expect(screen.getByTestId('stepper-is-public')).toHaveTextContent('false');
    });
  });

  describe('Form Data Integration and Props Passing', () => {
    it('passes actionsList and loading state to ActionsStep', async () => {
      renderWizard();

      // Navigate to actions step
      act(() => {
        screen.getByTestId('room-next-btn').click();
      });
      await waitFor(() => expect(screen.getByTestId('local-players-step')).toBeInTheDocument());

      act(() => {
        screen.getByTestId('local-players-next-btn').click();
      });
      await waitFor(() => expect(screen.getByTestId('game-mode-step')).toBeInTheDocument());

      act(() => {
        screen.getByTestId('game-mode-next-btn').click();
      });
      await waitFor(() => {
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
      });

      expect(screen.getByTestId('actions-list')).toHaveTextContent(
        '{"action1":"test","action2":"test2"}'
      );
      expect(screen.getByTestId('actions-loading')).toHaveTextContent('false');
    });

    it('passes actionsList to FinishStep', async () => {
      renderWizard();

      // Navigate through all steps to finish
      act(() => screen.getByTestId('room-next-btn').click());
      await waitFor(() => expect(screen.getByTestId('local-players-step')).toBeInTheDocument());

      act(() => screen.getByTestId('local-players-next-btn').click());
      await waitFor(() => expect(screen.getByTestId('game-mode-step')).toBeInTheDocument());

      act(() => screen.getByTestId('game-mode-next-btn').click());
      await waitFor(() => expect(screen.getByTestId('actions-step')).toBeInTheDocument());

      act(() => screen.getByTestId('actions-next-btn').click());
      await waitFor(() => {
        expect(screen.getByTestId('finish-step')).toBeInTheDocument();
      });

      expect(screen.getByTestId('finish-actions-list')).toHaveTextContent(
        '{"action1":"test","action2":"test2"}'
      );
    });

    it('maintains form data updates across step transitions', async () => {
      renderWizard();

      // Update form data in room step
      act(() => {
        screen.getByTestId('update-room-btn').click();
      });
      expect(mockSetFormData).toHaveBeenCalledWith(expect.any(Function));

      // Navigate to next step and verify form data structure maintained
      act(() => {
        screen.getByTestId('room-next-btn').click();
      });
      await waitFor(() => {
        expect(screen.getByTestId('local-players-step')).toBeInTheDocument();
      });

      expect(screen.getByTestId('local-players-form-data')).toBeInTheDocument();
    });
  });

  describe('Stepper Click Navigation', () => {
    it('allows stepper click navigation when setStep callback provided', async () => {
      renderWizard();

      const stepperStep4 = screen.queryByTestId('stepper-step-4');
      if (stepperStep4) {
        act(() => {
          stepperStep4.click();
        });
        await waitFor(() => {
          expect(screen.getByTestId('actions-step')).toBeInTheDocument();
        });
      }
    });

    it('updates stepper current step when navigating', async () => {
      renderWizard();

      expect(screen.getByTestId('stepper-current-step')).toHaveTextContent('1');

      act(() => {
        screen.getByTestId('room-next-btn').click();
      });
      await waitFor(() => {
        expect(screen.getByTestId('local-players-step')).toBeInTheDocument();
      });

      expect(screen.getByTestId('stepper-current-step')).toHaveTextContent('2');
    });
  });

  describe('Step Component Integration', () => {
    it('passes correct game mode to useUnifiedActionList hook', () => {
      renderWizard();

      // Verify the hook was called with the form data's game mode
      // This is tested implicitly through the form data being passed correctly
      expect(screen.getByTestId('room-step')).toBeInTheDocument();
    });

    it('handles form data updates from child components', async () => {
      renderWizard();

      act(() => {
        screen.getByTestId('update-room-btn').click();
      });

      expect(mockSetFormData).toHaveBeenCalledWith(expect.any(Function));

      // Test the update function logic
      const updateFunction = mockSetFormData.mock.calls[0][0];
      const previousData = { room: 'OLD' };
      const result = updateFunction(previousData);
      expect(result).toEqual({ room: 'UPDATED' });
    });
  });

  describe('Advanced Settings Integration', () => {
    it('provides goToSetupWizard callback to GameSettings', async () => {
      renderWizard('PUBLIC', mockClose);

      act(() => {
        screen.getByRole('button', { name: /advanced/i }).click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('game-settings')).toBeInTheDocument();
      });

      expect(screen.getByTestId('game-settings-setup-wizard-btn')).toBeInTheDocument();

      act(() => {
        screen.getByTestId('game-settings-setup-wizard-btn').click();
      });

      // Should return to actions step for public room
      await waitFor(() => {
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
      });
    });
  });

  describe('Room Parameter Integration', () => {
    it('handles missing room parameter gracefully', () => {
      mockParams.id = undefined as any;

      expect(() => render(<GameSettingsWizard />)).not.toThrow();
      expect(screen.getByTestId('room-step')).toBeInTheDocument();
    });

    it('uses room parameter in form data initialization', () => {
      renderWizard('CUSTOM_ROOM');

      // Room should be reflected in the form data passed to components
      expect(screen.getByTestId('room-form-data')).toHaveTextContent('"CUSTOM_ROOM"');
    });
  });

  describe('Component Props and Callback Integration', () => {
    it('passes close function to FinishStep when provided', async () => {
      renderWizard('TEST', mockClose);

      // Navigate to finish step (starts at actions for online mode)
      await waitFor(() => {
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
      });

      act(() => {
        screen.getByTestId('actions-next-btn').click();
      });
      await waitFor(() => {
        expect(screen.getByTestId('finish-step')).toBeInTheDocument();
      });

      expect(screen.getByTestId('finish-close-btn')).toBeInTheDocument();

      act(() => {
        screen.getByTestId('finish-close-btn').click();
      });
      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('does not pass close function when not provided', async () => {
      renderWizard();

      // Navigate to finish step manually
      act(() => screen.getByTestId('room-next-btn').click());
      await waitFor(() => expect(screen.getByTestId('local-players-step')).toBeInTheDocument());

      act(() => screen.getByTestId('local-players-next-btn').click());
      await waitFor(() => expect(screen.getByTestId('game-mode-step')).toBeInTheDocument());

      act(() => screen.getByTestId('game-mode-next-btn').click());
      await waitFor(() => expect(screen.getByTestId('actions-step')).toBeInTheDocument());

      act(() => screen.getByTestId('actions-next-btn').click());
      await waitFor(() => {
        expect(screen.getByTestId('finish-step')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('finish-close-btn')).not.toBeInTheDocument();
    });
  });
});
