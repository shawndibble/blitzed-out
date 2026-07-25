import { ThemeProvider, useMediaQuery } from '@mui/material';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import DynamicStepper from '../DynamicStepper';
import darkTheme from '@/theme';
import userEvent from '@testing-library/user-event';

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

// DynamicStepper is purely presentational: it draws whatever step list and
// active index it's given. Which steps exist for a topology, and the
// wizardStep <-> stepper-index mapping, are wizardFlow.ts's job — covered by
// wizardFlow.test.ts (the list) and WizardFlowGuard.test.tsx (the render-based
// binding between what the stepper shows and what the router mounts).
describe('DynamicStepper', () => {
  const mockOnStepClick = vi.fn();

  const fourSteps = [
    { label: 'Player Setup', wizardStep: 1 },
    { label: 'Game Mode Selection', wizardStep: 3 },
    { label: 'Actions Selection', wizardStep: 4 },
    { label: 'Finish Setup', wizardStep: 5 },
  ];

  const fiveSteps = [
    { label: 'Player Setup', wizardStep: 1 },
    { label: 'Local Players', wizardStep: 2 },
    { label: 'Game Mode Selection', wizardStep: 3 },
    { label: 'Actions Selection', wizardStep: 4 },
    { label: 'Finish Setup', wizardStep: 5 },
  ];

  const defaultProps = {
    steps: fourSteps,
    activeStep: 0,
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
      renderWithTheme(<DynamicStepper steps={fourSteps} activeStep={0} />);

      expect(document.querySelector('.MuiStepper-root')).toBeInTheDocument();
    });

    it('renders exactly one MuiStep per entry in the steps prop', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} steps={fiveSteps} />);

      expect(document.querySelectorAll('.MuiStep-root')).toHaveLength(5);
    });

    it('renders the given labels in order', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} steps={fiveSteps} />);

      const labels = Array.from(document.querySelectorAll('.MuiStepLabel-label')).map(
        (el) => el.textContent
      );
      expect(labels).toEqual([
        'Player Setup',
        'Local Players',
        'Game Mode Selection',
        'Actions Selection',
        'Finish Setup',
      ]);
    });
  });

  describe('Active step highlighting', () => {
    it('marks the entry at activeStep as active', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} steps={fiveSteps} activeStep={1} />);

      const activeLabel = document.querySelector('.MuiStepLabel-label.Mui-active');
      expect(activeLabel).toHaveTextContent('Local Players');
    });

    it('marks no step active when activeStep is -1 (not-found sentinel)', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} activeStep={-1} />);

      expect(document.querySelectorAll('.MuiStepLabel-label.Mui-active')).toHaveLength(0);
    });

    it('does not crash when activeStep is out of bounds', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} activeStep={99} />);

      expect(document.querySelector('.MuiStepper-root')).toBeInTheDocument();
      expect(document.querySelectorAll('.MuiStepLabel-label.Mui-active')).toHaveLength(0);
    });
  });

  describe('Step click handling', () => {
    it('calls onStepClick with the wizardStep of the clicked entry, not the DOM index', async () => {
      const user = userEvent.setup();
      renderWithTheme(<DynamicStepper {...defaultProps} steps={fiveSteps} />);

      await user.click(screen.getByText('Local Players'));
      expect(mockOnStepClick).toHaveBeenCalledWith(2);

      await user.click(screen.getByText('Finish Setup'));
      expect(mockOnStepClick).toHaveBeenCalledWith(5);
    });

    it('does not call onStepClick when the callback is not provided', async () => {
      const user = userEvent.setup();
      renderWithTheme(<DynamicStepper steps={fourSteps} activeStep={0} />);

      await user.click(screen.getByText('Player Setup'));
      expect(mockOnStepClick).not.toHaveBeenCalled();
    });

    it('shows default cursor when onStepClick is not provided', () => {
      renderWithTheme(<DynamicStepper steps={fourSteps} activeStep={0} />);

      document
        .querySelectorAll('.MuiStepLabel-root')
        .forEach((label) => expect(label).toHaveStyle({ cursor: 'default' }));
    });
  });

  describe('Responsive Behavior', () => {
    describe('Desktop Layout', () => {
      beforeEach(() => {
        mockUseMediaQuery.mockReturnValue(false);
      });

      it('shows step labels on desktop', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} steps={fiveSteps} />);

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
        stepLabels.forEach((label) => expect(label).not.toHaveStyle({ display: 'none' }));
      });
    });

    describe('Mobile Layout', () => {
      beforeEach(() => {
        mockUseMediaQuery.mockReturnValue(true);
      });

      it('hides step labels on mobile', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} />);

        const stepLabels = document.querySelectorAll('.MuiStepLabel-label');
        stepLabels.forEach((label) => expect(label).toHaveStyle({ display: 'none' }));
      });

      it('does not use alternative label layout on mobile', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} />);

        const stepper = document.querySelector('.MuiStepper-root');
        expect(stepper).not.toHaveClass('MuiStepper-alternativeLabel');
      });
    });

    describe('Media Query Integration', () => {
      it('calls useMediaQuery with the expected breakpoint', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} />);

        expect(mockUseMediaQuery).toHaveBeenCalled();
        expect(mockUseMediaQuery).toHaveBeenCalledWith(expect.stringContaining('max-width'));
      });

      it('responds to breakpoint changes', () => {
        const { rerender } = renderWithTheme(<DynamicStepper {...defaultProps} />);

        mockUseMediaQuery.mockReturnValue(false);
        rerender(
          <ThemeProvider theme={darkTheme}>
            <DynamicStepper {...defaultProps} />
          </ThemeProvider>
        );
        document
          .querySelectorAll('.MuiStepLabel-label')
          .forEach((label) => expect(label).not.toHaveStyle({ display: 'none' }));

        mockUseMediaQuery.mockReturnValue(true);
        rerender(
          <ThemeProvider theme={darkTheme}>
            <DynamicStepper {...defaultProps} />
          </ThemeProvider>
        );
        document
          .querySelectorAll('.MuiStepLabel-label')
          .forEach((label) => expect(label).toHaveStyle({ display: 'none' }));
      });
    });
  });

  describe('Stability across prop changes', () => {
    it('rerenders cleanly as steps and activeStep change', () => {
      const { rerender } = renderWithTheme(<DynamicStepper {...defaultProps} steps={fiveSteps} />);

      for (let activeStep = 0; activeStep < fiveSteps.length; activeStep++) {
        rerender(
          <ThemeProvider theme={darkTheme}>
            <DynamicStepper {...defaultProps} steps={fiveSteps} activeStep={activeStep} />
          </ThemeProvider>
        );
        expect(document.querySelector('.MuiStepper-root')).toBeInTheDocument();
      }

      rerender(
        <ThemeProvider theme={darkTheme}>
          <DynamicStepper {...defaultProps} steps={fourSteps} />
        </ThemeProvider>
      );
      expect(document.querySelectorAll('.MuiStep-root')).toHaveLength(4);
    });
  });

  describe('Accessibility', () => {
    it('every step has a StepLabel', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} steps={fiveSteps} />);

      document.querySelectorAll('.MuiStep-root').forEach((step) => {
        expect(step.querySelector('.MuiStepLabel-root')).toBeInTheDocument();
      });
    });
  });
});
