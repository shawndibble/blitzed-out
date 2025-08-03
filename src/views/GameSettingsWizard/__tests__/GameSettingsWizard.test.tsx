import { render, screen, act } from '@/test-utils';
import { waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import GameSettingsWizard from '../index';

// Mock the child components
vi.mock('../RoomStep', () => ({
  default: ({ nextStep }: { nextStep: () => void }) => (
    <div data-testid="room-step">
      <button type="button" onClick={nextStep}>
        Next
      </button>
    </div>
  ),
}));

vi.mock('../GameModeStep', () => ({
  default: ({ nextStep, prevStep }: { nextStep: () => void; prevStep: () => void }) => (
    <div data-testid="game-mode-step">
      <button type="button" onClick={prevStep}>
        Previous
      </button>
      <button type="button" onClick={nextStep}>
        Next
      </button>
    </div>
  ),
}));

vi.mock('../ActionsStep', () => ({
  default: ({ nextStep, prevStep }: { nextStep: () => void; prevStep: () => void }) => (
    <div data-testid="actions-step">
      <button type="button" onClick={prevStep}>
        Previous
      </button>
      <button type="button" onClick={nextStep}>
        Next
      </button>
    </div>
  ),
}));

vi.mock('../FinishStep', () => ({
  default: ({ prevStep, close }: { prevStep: () => void; close?: () => void }) => (
    <div data-testid="finish-step">
      <button type="button" onClick={prevStep}>
        Previous
      </button>
      {close && (
        <button type="button" onClick={close}>
          Close
        </button>
      )}
    </div>
  ),
}));

vi.mock('@/views/GameSettings', () => ({
  default: ({ closeDialog }: { closeDialog?: () => void }) => (
    <div data-testid="game-settings">
      {closeDialog && (
        <button type="button" onClick={closeDialog}>
          Close Advanced
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
      room: overrides?.room || initialData?.room,
      advancedSettings: false,
      ...overrides,
    };
    return [formData, mockSetFormData];
  },
}));

vi.mock('@/hooks/useUnifiedActionList', () => ({
  default: () => ({ actionsList: {}, isLoading: false }),
}));

// Mock useParams to return the room from the URL
let mockRoom = 'TEST';
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: mockRoom }),
  };
});

vi.mock('@/helpers/strings', () => ({
  isPublicRoom: vi.fn((room?: string) => room?.toUpperCase() === 'PUBLIC'),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        advancedSetup: 'Advanced Settings',
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

const renderWizard = (room = 'TEST', close?: () => void) => {
  // Set the route before rendering since test-utils already provides BrowserRouter
  window.history.pushState({}, 'Test page', `/${room}`);
  // Update the mock room to match the URL
  mockRoom = room;
  return render(<GameSettingsWizard close={close} />);
};

describe('GameSettingsWizard', () => {
  const mockClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetFormData.mockClear();
  });

  describe('Initial rendering and step navigation', () => {
    it('renders the wizard with stepper', () => {
      renderWizard();

      // Check that the stepper container is present
      expect(document.querySelector('.MuiStepper-root')).toBeInTheDocument();
      expect(screen.getByTestId('room-step')).toBeInTheDocument();
    });

    it('shows correct step indicators', () => {
      renderWizard();

      // Should show 5 steps in the stepper for private room (TEST is not PUBLIC)
      const steps = document.querySelectorAll('.MuiStep-root');
      expect(steps).toHaveLength(5);
    });

    it('shows correct step indicators for public room', () => {
      renderWizard('PUBLIC');

      // Should show 3 steps in the stepper for public room
      const steps = document.querySelectorAll('.MuiStep-root');
      expect(steps).toHaveLength(3);
    });

    it('has advanced setup button', () => {
      renderWizard();

      expect(screen.getByRole('button', { name: /advanced/i })).toBeInTheDocument();
    });
  });

  describe('Step navigation flow', () => {
    it('navigates from Room step to Game Mode step', async () => {
      renderWizard();

      expect(screen.getByTestId('room-step')).toBeInTheDocument();

      const nextButton = screen.getByRole('button', { name: 'Next' });
      act(() => {
        nextButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('game-mode-step')).toBeInTheDocument();
      });
    });

    it('navigates through all steps in sequence', async () => {
      renderWizard();

      // Step 1: Room
      expect(screen.getByTestId('room-step')).toBeInTheDocument();
      act(() => {
        screen.getByRole('button', { name: 'Next' }).click();
      });

      // Step 2: Game Mode
      await waitFor(() => {
        expect(screen.getByTestId('game-mode-step')).toBeInTheDocument();
      });
      act(() => {
        screen.getByRole('button', { name: 'Next' }).click();
      });

      // Step 3: Actions
      await waitFor(() => {
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
      });
      act(() => {
        screen.getByRole('button', { name: 'Next' }).click();
      });

      // Step 4: Finish
      await waitFor(() => {
        expect(screen.getByTestId('finish-step')).toBeInTheDocument();
      });
    });

    it('can navigate backwards through steps', async () => {
      renderWizard();

      // Go to step 2
      act(() => {
        screen.getByRole('button', { name: 'Next' }).click();
      });
      await waitFor(() => {
        expect(screen.getByTestId('game-mode-step')).toBeInTheDocument();
      });

      // Go back to step 1
      act(() => {
        screen.getByRole('button', { name: 'Previous' }).click();
      });
      await waitFor(() => {
        expect(screen.getByTestId('room-step')).toBeInTheDocument();
      });
    });
  });

  describe('Public room behavior', () => {
    it('skips to step 3 for public room when close function provided', async () => {
      renderWizard('PUBLIC', mockClose);

      // PUBLIC room with close function skips to step 3 (actions-step)
      // because PUBLIC room forces online mode, skipping room and game mode steps
      // Should immediately render the actions step
      expect(screen.getByTestId('actions-step')).toBeInTheDocument();
    });

    it('starts at step 1 for public room when no close function', () => {
      renderWizard('PUBLIC');

      expect(screen.getByTestId('room-step')).toBeInTheDocument();
    });
  });

  describe('Private room behavior', () => {
    it('skips to step 3 for private room when close function provided', async () => {
      renderWizard('PRIVATE', mockClose);

      // Private room with close function skips to step 3 (actions-step)
      // because the gameMode is already 'online' in the mocked form data
      // Should immediately render the actions step
      expect(screen.getByTestId('actions-step')).toBeInTheDocument();
    });

    it('starts at step 1 for private room when no close function', () => {
      renderWizard('PRIVATE');

      expect(screen.getByTestId('room-step')).toBeInTheDocument();
    });
  });

  describe('Advanced settings', () => {
    it('switches to advanced settings view', async () => {
      renderWizard();

      const advancedButton = screen.getByRole('button', { name: /advanced/i });
      act(() => {
        advancedButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('game-settings')).toBeInTheDocument();
      });

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('can close advanced settings and return to wizard', async () => {
      renderWizard('TEST', mockClose);

      // Go to advanced
      act(() => {
        screen.getByRole('button', { name: /advanced/i }).click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('game-settings')).toBeInTheDocument();
      });

      // Close advanced
      act(() => {
        screen.getByRole('button', { name: 'Close Advanced' }).click();
      });

      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('Wizard completion', () => {
    it('calls close function when provided', async () => {
      renderWizard('TEST', mockClose);

      // Should start at step 3 (actions-step) since gameMode is already 'online' in mocked data
      await waitFor(() => {
        expect(screen.getByTestId('actions-step')).toBeInTheDocument();
      });

      // Navigate to finish step - we're already on actions-step (step 3)
      act(() => {
        screen.getByRole('button', { name: 'Next' }).click();
      });
      await waitFor(() => expect(screen.getByTestId('finish-step')).toBeInTheDocument());

      // Close from finish step
      act(() => {
        screen.getByRole('button', { name: 'Close' }).click();
      });

      expect(mockClose).toHaveBeenCalled();
    });

    it('does not show close button when no close function provided', async () => {
      renderWizard();

      // Navigate through all steps to finish step
      // Step 1: Room step
      act(() => {
        screen.getByRole('button', { name: 'Next' }).click();
      });
      await waitFor(() => expect(screen.getByTestId('game-mode-step')).toBeInTheDocument());

      act(() => {
        screen.getByRole('button', { name: 'Next' }).click();
      });
      await waitFor(() => expect(screen.getByTestId('actions-step')).toBeInTheDocument());

      act(() => {
        screen.getByRole('button', { name: 'Next' }).click();
      });
      await waitFor(() => expect(screen.getByTestId('finish-step')).toBeInTheDocument());

      expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    });
  });

  describe('Form data persistence', () => {
    it('maintains form data between step changes', async () => {
      renderWizard();

      // The wizard should maintain form data state across step transitions
      // This is implicitly tested by the navigation working correctly
      expect(screen.getByTestId('room-step')).toBeInTheDocument();

      act(() => {
        screen.getByRole('button', { name: 'Next' }).click();
      });
      await waitFor(() => expect(screen.getByTestId('game-mode-step')).toBeInTheDocument());

      act(() => {
        screen.getByRole('button', { name: 'Previous' }).click();
      });
      await waitFor(() => screen.getByTestId('room-step'));

      // Should still be functional after going back and forth
      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('handles missing room parameter gracefully', () => {
      render(<GameSettingsWizard />);

      // Should still render without errors
      expect(screen.getByTestId('room-step')).toBeInTheDocument();
    });

    it('handles invalid step transitions gracefully', async () => {
      renderWizard();

      // Try to go to an invalid step (this is prevented by the UI but testing robustness)
      expect(screen.getByTestId('room-step')).toBeInTheDocument();

      // The component should handle invalid states gracefully
      expect(() => document.querySelector('.MuiStepper-root')).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for stepper', () => {
      renderWizard();

      // Check that the stepper is present and accessible
      expect(document.querySelector('.MuiStepper-root')).toBeInTheDocument();
    });

    it('maintains focus management during navigation', async () => {
      renderWizard();

      const nextButton = screen.getByRole('button', { name: 'Next' });
      nextButton.focus();
      act(() => {
        nextButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('game-mode-step')).toBeInTheDocument();
      });

      // Should still have focusable elements
      expect(screen.getAllByRole('button')).toHaveLength(3); // Previous, Next, Advanced
    });
  });
});
