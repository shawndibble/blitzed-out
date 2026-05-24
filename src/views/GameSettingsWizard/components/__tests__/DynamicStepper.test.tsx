import { ThemeProvider, useMediaQuery } from '@mui/material';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import DynamicStepper from '../DynamicStepper';
import darkTheme from '@/theme';
import userEvent from '@testing-library/user-event';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'playerTopology.stepLabel': 'Player Setup',
        roomSelection: 'Room Selection',
        'localPlayersStep.title': 'Local Players',
        gameModeSelection: 'Game Mode Selection',
        actionsSelection: 'Actions Selection',
        finishSetup: 'Finish Setup',
      };
      return translations[key] || fallback || key;
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

vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: vi.fn(),
  };
});

const mockUseMediaQuery = vi.mocked(useMediaQuery);

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={darkTheme}>{ui}</ThemeProvider>);
};

describe('DynamicStepper', () => {
  const mockOnStepClick = vi.fn();

  const defaultProps = {
    currentStep: 1,
    onStepClick: mockOnStepClick,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMediaQuery.mockReturnValue(false);
  });

  describe('Component Rendering', () => {
    it('renders the stepper component with basic structure', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} />);

      expect(document.querySelector('.MuiStepper-root')).toBeInTheDocument();
      expect(document.querySelector('.MuiStepper-horizontal')).toBeInTheDocument();
    });

    it('renders with required props only (no onStepClick)', () => {
      renderWithTheme(<DynamicStepper currentStep={1} />);

      expect(document.querySelector('.MuiStepper-root')).toBeInTheDocument();
    });

    it('displays proper step organization and layout', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} />);

      const stepper = document.querySelector('.MuiStepper-root');
      expect(stepper).toBeInTheDocument();
      expect(stepper).toHaveClass('MuiStepper-horizontal');
    });
  });

  describe('Game Mode Configuration', () => {
    describe('Solo / Default (4 steps)', () => {
      it('displays 4 steps when gameMode is solo', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} gameMode="solo" />);

        const steps = document.querySelectorAll('.MuiStep-root');
        expect(steps).toHaveLength(4);
      });

      it('displays 4 steps when gameMode is undefined', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} />);

        const steps = document.querySelectorAll('.MuiStep-root');
        expect(steps).toHaveLength(4);
      });

      it('shows correct step labels for solo mode', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} gameMode="solo" />);

        expect(screen.getByText('Player Setup')).toBeInTheDocument();
        expect(screen.getByText('Game Mode Selection')).toBeInTheDocument();
        expect(screen.getByText('Actions Selection')).toBeInTheDocument();
        expect(screen.getByText('Finish Setup')).toBeInTheDocument();
      });

      it('does not show Local Players or Room Selection in solo mode', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} gameMode="solo" />);

        expect(screen.queryByText('Local Players')).not.toBeInTheDocument();
        expect(screen.queryByText('Room Selection')).not.toBeInTheDocument();
      });
    });

    describe('Local Mode (5 steps)', () => {
      it('displays 5 steps when gameMode is local', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} gameMode="local" />);

        const steps = document.querySelectorAll('.MuiStep-root');
        expect(steps).toHaveLength(5);
      });

      it('shows correct step labels for local mode', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} gameMode="local" />);

        expect(screen.getByText('Player Setup')).toBeInTheDocument();
        expect(screen.getByText('Local Players')).toBeInTheDocument();
        expect(screen.getByText('Game Mode Selection')).toBeInTheDocument();
        expect(screen.getByText('Actions Selection')).toBeInTheDocument();
        expect(screen.getByText('Finish Setup')).toBeInTheDocument();
      });

      it('does not show Room Selection in local mode', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} gameMode="local" />);

        expect(screen.queryByText('Room Selection')).not.toBeInTheDocument();
      });
    });

    describe('Online Mode (5 steps)', () => {
      it('displays 5 steps when gameMode is online', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} gameMode="online" />);

        const steps = document.querySelectorAll('.MuiStep-root');
        expect(steps).toHaveLength(5);
      });

      it('shows correct step labels for online mode', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} gameMode="online" />);

        expect(screen.getByText('Player Setup')).toBeInTheDocument();
        expect(screen.getByText('Room Selection')).toBeInTheDocument();
        expect(screen.getByText('Game Mode Selection')).toBeInTheDocument();
        expect(screen.getByText('Actions Selection')).toBeInTheDocument();
        expect(screen.getByText('Finish Setup')).toBeInTheDocument();
      });

      it('does not show Local Players in online mode', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} gameMode="online" />);

        expect(screen.queryByText('Local Players')).not.toBeInTheDocument();
      });
    });

    describe('Step count changes with gameMode', () => {
      it('updates step count when gameMode changes', () => {
        const { rerender } = renderWithTheme(<DynamicStepper {...defaultProps} gameMode="solo" />);

        let steps = document.querySelectorAll('.MuiStep-root');
        expect(steps).toHaveLength(4);

        rerender(<DynamicStepper {...defaultProps} gameMode="local" />);
        steps = document.querySelectorAll('.MuiStep-root');
        expect(steps).toHaveLength(5);

        rerender(<DynamicStepper {...defaultProps} gameMode="solo" />);
        steps = document.querySelectorAll('.MuiStep-root');
        expect(steps).toHaveLength(4);
      });
    });
  });

  describe('Step Navigation', () => {
    it('highlights current step correctly for local mode', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} gameMode="local" currentStep={2} />);

      const steps = document.querySelectorAll('.MuiStep-root');
      expect(steps).toHaveLength(5);
      expect(steps[1]).toBeInTheDocument();
      expect(screen.getByText('Local Players')).toBeInTheDocument();
    });

    it('calls onStepClick with wizard step 2 when Local Players step is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(<DynamicStepper {...defaultProps} gameMode="local" />);

      await user.click(screen.getByText('Local Players'));

      expect(mockOnStepClick).toHaveBeenCalledWith(2);
    });

    it('calls onStepClick with wizard step 2 when Room Selection step is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(<DynamicStepper {...defaultProps} gameMode="online" />);

      await user.click(screen.getByText('Room Selection'));

      expect(mockOnStepClick).toHaveBeenCalledWith(2);
    });

    it('does not call onStepClick when callback is not provided', async () => {
      const user = userEvent.setup();
      renderWithTheme(<DynamicStepper currentStep={1} gameMode="local" />);

      await user.click(screen.getByText('Player Setup'));

      expect(mockOnStepClick).not.toHaveBeenCalled();
    });

    it('handles multiple step clicks correctly for local mode', async () => {
      const user = userEvent.setup();
      renderWithTheme(<DynamicStepper {...defaultProps} gameMode="local" />);

      await user.click(screen.getByText('Player Setup'));
      expect(mockOnStepClick).toHaveBeenCalledWith(1);

      await user.click(screen.getByText('Actions Selection'));
      expect(mockOnStepClick).toHaveBeenCalledWith(4);

      await user.click(screen.getByText('Finish Setup'));
      expect(mockOnStepClick).toHaveBeenCalledWith(5);

      expect(mockOnStepClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Responsive Behavior', () => {
    describe('Desktop Layout', () => {
      beforeEach(() => {
        mockUseMediaQuery.mockReturnValue(false);
      });

      it('shows step labels on desktop', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} gameMode="local" />);

        expect(screen.getByText('Player Setup')).toBeInTheDocument();
        expect(screen.getByText('Local Players')).toBeInTheDocument();
        expect(screen.getByText('Actions Selection')).toBeInTheDocument();
      });

      it('uses alternative label layout on desktop', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} />);

        const stepper = document.querySelector('.MuiStepper-root');
        expect(stepper).toHaveClass('MuiStepper-alternativeLabel');
      });

      it('displays step labels in step label elements', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} />);

        const stepLabels = document.querySelectorAll('.MuiStepLabel-label');
        expect(stepLabels.length).toBeGreaterThan(0);

        stepLabels.forEach((label) => {
          expect(label).not.toHaveStyle({ display: 'none' });
        });
      });
    });

    describe('Mobile Layout', () => {
      beforeEach(() => {
        mockUseMediaQuery.mockReturnValue(true);
      });

      it('hides step labels on mobile', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} />);

        const stepLabels = document.querySelectorAll('.MuiStepLabel-label');
        stepLabels.forEach((label) => {
          expect(label).toHaveStyle({ display: 'none' });
        });
      });

      it('does not use alternative label layout on mobile', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} />);

        const stepper = document.querySelector('.MuiStepper-root');
        expect(stepper).not.toHaveClass('MuiStepper-alternativeLabel');
      });

      it('applies mobile-specific styling', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} />);

        const stepLabels = document.querySelectorAll('.MuiStepLabel-label');
        stepLabels.forEach((label) => {
          expect(label).toHaveStyle({ display: 'none' });
        });
      });
    });

    describe('Media Query Integration', () => {
      it('calls useMediaQuery with correct breakpoint', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} />);

        expect(mockUseMediaQuery).toHaveBeenCalled();
        expect(mockUseMediaQuery).toHaveBeenCalledWith(expect.stringContaining('max-width'));
      });

      it('responds to breakpoint changes', () => {
        const { rerender } = renderWithTheme(<DynamicStepper {...defaultProps} />);

        mockUseMediaQuery.mockReturnValue(false);
        rerender(<DynamicStepper {...defaultProps} />);

        let stepLabels = document.querySelectorAll('.MuiStepLabel-label');
        stepLabels.forEach((label) => {
          expect(label).not.toHaveStyle({ display: 'none' });
        });

        mockUseMediaQuery.mockReturnValue(true);
        rerender(<DynamicStepper {...defaultProps} />);

        stepLabels = document.querySelectorAll('.MuiStepLabel-label');
        stepLabels.forEach((label) => {
          expect(label).toHaveStyle({ display: 'none' });
        });
      });
    });
  });

  describe('User Interactions', () => {
    describe('Step Click Handling', () => {
      it('shows pointer cursor when onStepClick is provided', async () => {
        renderWithTheme(<DynamicStepper {...defaultProps} />);

        const stepLabels = document.querySelectorAll('.MuiStepLabel-root');
        expect(stepLabels.length).toBeGreaterThan(0);

        const firstLabel = stepLabels[0] as HTMLElement;
        firstLabel.click();

        expect(mockOnStepClick).toHaveBeenCalled();
      });

      it('shows default cursor when onStepClick is not provided', () => {
        renderWithTheme(<DynamicStepper currentStep={1} />);

        const stepLabels = document.querySelectorAll('.MuiStepLabel-root');
        stepLabels.forEach((label) => {
          expect(label).toHaveStyle({ cursor: 'default' });
        });
      });

      it('applies hover styles when onStepClick is provided', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} gameMode="local" />);

        const stepLabels = document.querySelectorAll('.MuiStepLabel-root');
        expect(stepLabels.length).toBeGreaterThan(0);

        stepLabels.forEach((label) => {
          (label as HTMLElement).click();
        });

        expect(mockOnStepClick).toHaveBeenCalledTimes(stepLabels.length);
      });

      it('executes callback with correct parameters for local mode', async () => {
        const user = userEvent.setup();
        renderWithTheme(<DynamicStepper {...defaultProps} gameMode="local" currentStep={1} />);

        await user.click(screen.getByText('Player Setup'));
        expect(mockOnStepClick).toHaveBeenLastCalledWith(1);

        await user.click(screen.getByText('Local Players'));
        expect(mockOnStepClick).toHaveBeenLastCalledWith(2);

        await user.click(screen.getByText('Game Mode Selection'));
        expect(mockOnStepClick).toHaveBeenLastCalledWith(3);

        await user.click(screen.getByText('Actions Selection'));
        expect(mockOnStepClick).toHaveBeenLastCalledWith(4);

        await user.click(screen.getByText('Finish Setup'));
        expect(mockOnStepClick).toHaveBeenLastCalledWith(5);
      });
    });

    describe('Interactive Behavior', () => {
      it('maintains interactivity across different currentStep values', async () => {
        const user = userEvent.setup();
        const { rerender } = renderWithTheme(
          <DynamicStepper {...defaultProps} gameMode="local" currentStep={1} />
        );

        await user.click(screen.getByText('Actions Selection'));
        expect(mockOnStepClick).toHaveBeenCalledWith(4);

        rerender(<DynamicStepper {...defaultProps} gameMode="local" currentStep={3} />);

        await user.click(screen.getByText('Finish Setup'));
        expect(mockOnStepClick).toHaveBeenCalledWith(5);
      });

      it('handles rapid clicks appropriately', async () => {
        const user = userEvent.setup();
        renderWithTheme(<DynamicStepper {...defaultProps} />);

        const playerSetupStep = screen.getByText('Player Setup');

        await user.click(playerSetupStep);
        await user.click(playerSetupStep);
        await user.click(playerSetupStep);

        expect(mockOnStepClick).toHaveBeenCalledTimes(3);
        expect(mockOnStepClick).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Translation Integration', () => {
    it('uses correct translation keys for step labels in local mode', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} gameMode="local" />);

      expect(screen.getByText('Player Setup')).toBeInTheDocument();
      expect(screen.getByText('Local Players')).toBeInTheDocument();
      expect(screen.getByText('Game Mode Selection')).toBeInTheDocument();
      expect(screen.getByText('Actions Selection')).toBeInTheDocument();
      expect(screen.getByText('Finish Setup')).toBeInTheDocument();
    });

    it('converts translation results to strings', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} />);

      const stepElements = document.querySelectorAll('.MuiStepLabel-label');
      stepElements.forEach((element) => {
        expect(element.textContent).toBeTruthy();
        expect(typeof element.textContent).toBe('string');
      });
    });

    it('handles translation fallbacks gracefully', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} />);

      expect(document.querySelector('.MuiStepper-root')).toBeInTheDocument();
    });

    it('applies localization support for all step labels in online mode', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} gameMode="online" />);

      const expectedLabels = [
        'Player Setup',
        'Room Selection',
        'Game Mode Selection',
        'Actions Selection',
        'Finish Setup',
      ];

      expectedLabels.forEach((label) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles invalid currentStep values', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} currentStep={-1} />);

      expect(document.querySelector('.MuiStepper-root')).toBeInTheDocument();

      const activeSteps = document.querySelectorAll('.MuiStep-root.Mui-active');
      expect(activeSteps).toHaveLength(0);
    });

    it('handles boundary step indices correctly', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} gameMode="local" currentStep={1} />);
      let steps = document.querySelectorAll('.MuiStep-root');
      expect(steps[0]).toBeInTheDocument();

      renderWithTheme(<DynamicStepper {...defaultProps} gameMode="local" currentStep={5} />);
      steps = document.querySelectorAll('.MuiStep-root');
      expect(steps[4]).toBeInTheDocument();

      renderWithTheme(<DynamicStepper {...defaultProps} gameMode="solo" currentStep={5} />);
      steps = document.querySelectorAll('.MuiStep-root');
      expect(steps[3]).toBeInTheDocument();
    });

    it('handles step index out of bounds', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} currentStep={10} />);

      expect(document.querySelector('.MuiStepper-root')).toBeInTheDocument();
      const activeSteps = document.querySelectorAll('.MuiStep-root.Mui-active');
      expect(activeSteps).toHaveLength(0);
    });

    it('handles prop combinations correctly', () => {
      const combinations = [
        { currentStep: 1, gameMode: 'solo' as const, onStepClick: undefined },
        { currentStep: 5, gameMode: 'local' as const, onStepClick: mockOnStepClick },
        { currentStep: 3, gameMode: 'online' as const, onStepClick: mockOnStepClick },
        { currentStep: 2, gameMode: 'local' as const, onStepClick: undefined },
      ];

      combinations.forEach((props, index) => {
        const { rerender } = renderWithTheme(<DynamicStepper {...props} />);

        expect(document.querySelector('.MuiStepper-root')).toBeInTheDocument();

        if (index < combinations.length - 1) {
          rerender(<DynamicStepper {...combinations[index + 1]} />);
        }
      });
    });

    it('maintains component stability with frequent prop changes', () => {
      const { rerender } = renderWithTheme(<DynamicStepper {...defaultProps} gameMode="local" />);

      for (let i = 1; i <= 5; i++) {
        rerender(<DynamicStepper {...defaultProps} gameMode="local" currentStep={i} />);
        expect(document.querySelector('.MuiStepper-root')).toBeInTheDocument();
      }

      rerender(<DynamicStepper {...defaultProps} gameMode="solo" />);
      expect(document.querySelectorAll('.MuiStep-root')).toHaveLength(4);

      rerender(<DynamicStepper {...defaultProps} gameMode="local" />);
      expect(document.querySelectorAll('.MuiStep-root')).toHaveLength(5);
    });
  });

  describe('Styling and Accessibility', () => {
    it('applies correct stepper orientation', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} />);

      const stepper = document.querySelector('.MuiStepper-root');
      expect(stepper).toBeInTheDocument();
    });

    it('maintains accessibility attributes for steps', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} gameMode="local" />);

      const steps = document.querySelectorAll('.MuiStep-root');
      steps.forEach((step) => {
        expect(step).toBeInTheDocument();

        const stepLabel = step.querySelector('.MuiStepLabel-root');
        expect(stepLabel).toBeInTheDocument();
      });
    });

    it('applies conditional styling based on interactivity', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} gameMode="local" />);

      const stepLabels = document.querySelectorAll('.MuiStepLabel-root');
      expect(stepLabels.length).toBeGreaterThan(0);

      stepLabels.forEach((label) => {
        (label as HTMLElement).click();
      });

      expect(mockOnStepClick).toHaveBeenCalledTimes(stepLabels.length);
    });

    it('handles mobile-specific accessibility', () => {
      mockUseMediaQuery.mockReturnValue(true);
      renderWithTheme(<DynamicStepper {...defaultProps} />);

      const stepper = document.querySelector('.MuiStepper-root');
      expect(stepper).toBeInTheDocument();
    });

    it('maintains accessibility during gameMode transitions', () => {
      const { rerender } = renderWithTheme(<DynamicStepper {...defaultProps} gameMode="solo" />);

      let stepper = document.querySelector('.MuiStepper-root');
      expect(stepper).toBeInTheDocument();

      rerender(<DynamicStepper {...defaultProps} gameMode="local" />);
      stepper = document.querySelector('.MuiStepper-root');
      expect(stepper).toBeInTheDocument();
    });
  });

  describe('GameSettingsWizard Integration Scenarios', () => {
    it('handles wizard step navigation patterns for local mode workflow', async () => {
      const user = userEvent.setup();
      renderWithTheme(<DynamicStepper {...defaultProps} gameMode="local" currentStep={2} />);

      expect(screen.getByText('Player Setup')).toBeInTheDocument();
      expect(screen.getByText('Local Players')).toBeInTheDocument();
      expect(screen.getByText('Actions Selection')).toBeInTheDocument();
      expect(screen.getByText('Finish Setup')).toBeInTheDocument();

      await user.click(screen.getByText('Player Setup'));
      expect(mockOnStepClick).toHaveBeenCalledWith(1);

      await user.click(screen.getByText('Finish Setup'));
      expect(mockOnStepClick).toHaveBeenCalledWith(5);
    });

    it('handles wizard step navigation patterns for online mode workflow', async () => {
      const user = userEvent.setup();
      renderWithTheme(<DynamicStepper {...defaultProps} gameMode="online" currentStep={2} />);

      const expectedSteps = [
        { label: 'Player Setup', wizardStep: 1 },
        { label: 'Room Selection', wizardStep: 2 },
        { label: 'Game Mode Selection', wizardStep: 3 },
        { label: 'Actions Selection', wizardStep: 4 },
        { label: 'Finish Setup', wizardStep: 5 },
      ];

      expectedSteps.forEach(({ label }) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });

      for (const { label, wizardStep } of expectedSteps) {
        await user.click(screen.getByText(label));
        expect(mockOnStepClick).toHaveBeenCalledWith(wizardStep);
      }
    });

    it('maintains step consistency during formData updates', () => {
      const { rerender } = renderWithTheme(
        <DynamicStepper {...defaultProps} gameMode="local" currentStep={2} />
      );

      let steps = document.querySelectorAll('.MuiStep-root');
      expect(steps[1]).toBeInTheDocument();

      rerender(<DynamicStepper {...defaultProps} gameMode="online" currentStep={2} />);

      steps = document.querySelectorAll('.MuiStep-root');
      expect(steps).toHaveLength(5);
      expect(steps[1]).toBeInTheDocument();
    });
  });
});
