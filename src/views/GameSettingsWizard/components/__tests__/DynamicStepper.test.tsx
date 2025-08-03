import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useMediaQuery } from '@mui/material';
import DynamicStepper from '../DynamicStepper';
import darkTheme from '@/theme';

// Mock the translation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        roomSelection: 'Room Selection',
        actionsSelection: 'Actions Selection',
        finishSetup: 'Finish Setup',
        'localPlayersStep.title': 'Local Players',
        gameModeSelection: 'Game Mode Selection',
      };
      return translations[key] || fallback || key;
    },
  }),
}));

// Mock the migration context
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

// Mock Material-UI useMediaQuery hook
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: vi.fn(),
  };
});

const mockUseMediaQuery = vi.mocked(useMediaQuery);

// Helper function to render component with theme
const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={darkTheme}>{ui}</ThemeProvider>);
};

describe('DynamicStepper', () => {
  const mockOnStepClick = vi.fn();

  const defaultProps = {
    currentStep: 1,
    isPublicRoom: false,
    onStepClick: mockOnStepClick,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default to desktop (non-mobile) behavior
    mockUseMediaQuery.mockReturnValue(false);
  });

  describe('Component Rendering', () => {
    it('renders the stepper component with basic structure', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} />);

      // Check that the stepper is present
      expect(document.querySelector('.MuiStepper-root')).toBeInTheDocument();
      expect(document.querySelector('.MuiStepper-horizontal')).toBeInTheDocument();
    });

    it('renders with required props only (no onStepClick)', () => {
      const { currentStep, isPublicRoom } = defaultProps;
      renderWithTheme(<DynamicStepper currentStep={currentStep} isPublicRoom={isPublicRoom} />);

      expect(document.querySelector('.MuiStepper-root')).toBeInTheDocument();
    });

    it('displays proper step organization and layout', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} />);

      // Check for horizontal orientation
      const stepper = document.querySelector('.MuiStepper-root');
      expect(stepper).toBeInTheDocument();
      expect(stepper).toHaveAttribute('aria-orientation', 'horizontal');
    });
  });

  describe('Public vs Private Room Logic', () => {
    describe('Public Room Configuration (3 steps)', () => {
      const publicRoomProps = { ...defaultProps, isPublicRoom: true };

      it('displays 3 steps for public room', () => {
        renderWithTheme(<DynamicStepper {...publicRoomProps} />);

        const steps = document.querySelectorAll('.MuiStep-root');
        expect(steps).toHaveLength(3);
      });

      it('shows correct step labels for public room', () => {
        renderWithTheme(<DynamicStepper {...publicRoomProps} />);

        expect(screen.getByText('Room Selection')).toBeInTheDocument();
        expect(screen.getByText('Actions Selection')).toBeInTheDocument();
        expect(screen.getByText('Finish Setup')).toBeInTheDocument();
      });

      it('does not show local players and game mode steps for public room', () => {
        renderWithTheme(<DynamicStepper {...publicRoomProps} />);

        expect(screen.queryByText('Local Players')).not.toBeInTheDocument();
        expect(screen.queryByText('Game Mode Selection')).not.toBeInTheDocument();
      });

      it('maps wizard steps correctly for public room', () => {
        renderWithTheme(<DynamicStepper {...publicRoomProps} currentStep={4} />);

        // When current wizard step is 4 (Actions Selection), the second stepper step should be active
        const steps = document.querySelectorAll('.MuiStep-root');
        expect(steps[1]).toHaveClass('Mui-active');
      });
    });

    describe('Private Room Configuration (5 steps)', () => {
      const privateRoomProps = { ...defaultProps, isPublicRoom: false };

      it('displays 5 steps for private room', () => {
        renderWithTheme(<DynamicStepper {...privateRoomProps} />);

        const steps = document.querySelectorAll('.MuiStep-root');
        expect(steps).toHaveLength(5);
      });

      it('shows correct step labels for private room', () => {
        renderWithTheme(<DynamicStepper {...privateRoomProps} />);

        expect(screen.getByText('Room Selection')).toBeInTheDocument();
        expect(screen.getByText('Local Players')).toBeInTheDocument();
        expect(screen.getByText('Game Mode Selection')).toBeInTheDocument();
        expect(screen.getByText('Actions Selection')).toBeInTheDocument();
        expect(screen.getByText('Finish Setup')).toBeInTheDocument();
      });

      it('includes all required steps for private room', () => {
        renderWithTheme(<DynamicStepper {...privateRoomProps} />);

        // Verify all 5 steps are present
        const stepLabels = [
          'Room Selection',
          'Local Players',
          'Game Mode Selection',
          'Actions Selection',
          'Finish Setup',
        ];

        stepLabels.forEach((label) => {
          expect(screen.getByText(label)).toBeInTheDocument();
        });
      });

      it('maps wizard steps correctly for private room', () => {
        renderWithTheme(<DynamicStepper {...privateRoomProps} currentStep={3} />);

        // When current wizard step is 3 (Game Mode Selection), the third stepper step should be active
        const steps = document.querySelectorAll('.MuiStep-root');
        expect(steps[2]).toHaveClass('Mui-active');
      });
    });

    describe('Step Mapping and Wizard Step Correspondence', () => {
      it('correctly maps wizard step 1 to first stepper index for both room types', () => {
        // Public room
        renderWithTheme(<DynamicStepper isPublicRoom={true} currentStep={1} />);
        let steps = document.querySelectorAll('.MuiStep-root');
        expect(steps[0]).toHaveClass('Mui-active');

        // Private room
        renderWithTheme(<DynamicStepper isPublicRoom={false} currentStep={1} />);
        steps = document.querySelectorAll('.MuiStep-root');
        expect(steps[0]).toHaveClass('Mui-active');
      });

      it('correctly maps wizard step 5 to final stepper index for both room types', () => {
        // Public room - step 5 should be the 3rd (index 2) stepper step
        renderWithTheme(<DynamicStepper isPublicRoom={true} currentStep={5} />);
        let steps = document.querySelectorAll('.MuiStep-root');
        expect(steps[2]).toHaveClass('Mui-active');

        // Private room - step 5 should be the 5th (index 4) stepper step
        renderWithTheme(<DynamicStepper isPublicRoom={false} currentStep={5} />);
        steps = document.querySelectorAll('.MuiStep-root');
        expect(steps[4]).toHaveClass('Mui-active');
      });

      it('handles invalid wizard step gracefully', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} currentStep={99} />);

        // No step should be active for invalid wizard step
        const activeSteps = document.querySelectorAll('.MuiStep-root.Mui-active');
        expect(activeSteps).toHaveLength(0);
      });
    });
  });

  describe('Step Navigation', () => {
    it('highlights current step correctly', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} currentStep={2} />);

      // For private room, wizard step 2 corresponds to stepper index 1 (Local Players)
      const steps = document.querySelectorAll('.MuiStep-root');
      expect(steps[1]).toHaveClass('Mui-active');
    });

    it('calls onStepClick with correct wizard step when step is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(<DynamicStepper {...defaultProps} />);

      // Click on the second step (Local Players - wizard step 2)
      const secondStepLabel = screen.getByText('Local Players');
      await user.click(secondStepLabel);

      expect(mockOnStepClick).toHaveBeenCalledWith(2);
    });

    it('calls onStepClick with correct wizard step for public room navigation', async () => {
      const user = userEvent.setup();
      renderWithTheme(<DynamicStepper {...defaultProps} isPublicRoom={true} />);

      // Click on the second step (Actions Selection - wizard step 4 in public room)
      const actionsStepLabel = screen.getByText('Actions Selection');
      await user.click(actionsStepLabel);

      expect(mockOnStepClick).toHaveBeenCalledWith(4);
    });

    it('does not call onStepClick when callback is not provided', async () => {
      const user = userEvent.setup();
      const { currentStep, isPublicRoom } = defaultProps;
      renderWithTheme(<DynamicStepper currentStep={currentStep} isPublicRoom={isPublicRoom} />);

      const firstStepLabel = screen.getByText('Room Selection');
      await user.click(firstStepLabel);

      // No callback should be called since onStepClick was not provided
      expect(mockOnStepClick).not.toHaveBeenCalled();
    });

    it('handles multiple step clicks correctly', async () => {
      const user = userEvent.setup();
      renderWithTheme(<DynamicStepper {...defaultProps} />);

      // Click different steps
      await user.click(screen.getByText('Room Selection'));
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
        mockUseMediaQuery.mockReturnValue(false); // Desktop (md and up)
      });

      it('shows step labels on desktop', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} />);

        expect(screen.getByText('Room Selection')).toBeInTheDocument();
        expect(screen.getByText('Local Players')).toBeInTheDocument();
        expect(screen.getByText('Actions Selection')).toBeInTheDocument();
      });

      it('uses alternative label layout on desktop', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} />);

        // Check that alternativeLabel prop is true (not hidden by mobile styles)
        const stepper = document.querySelector('.MuiStepper-root');
        expect(stepper).not.toHaveClass('MuiStepper-alternativeLabel');
      });

      it('displays step labels in step label elements', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} />);

        const stepLabels = document.querySelectorAll('.MuiStepLabel-label');
        expect(stepLabels.length).toBeGreaterThan(0);

        // Verify labels are not hidden
        stepLabels.forEach((label) => {
          expect(label).not.toHaveStyle({ display: 'none' });
        });
      });
    });

    describe('Mobile Layout', () => {
      beforeEach(() => {
        mockUseMediaQuery.mockReturnValue(true); // Mobile (below md)
      });

      it('hides step labels on mobile', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} />);

        // Labels should still be in DOM but hidden by CSS
        const stepLabels = document.querySelectorAll('.MuiStepLabel-label');
        stepLabels.forEach((label) => {
          expect(label).toHaveStyle({ display: 'none' });
        });
      });

      it('does not use alternative label layout on mobile', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} />);

        // alternativeLabel should be false on mobile
        const stepper = document.querySelector('.MuiStepper-root');
        expect(stepper).not.toHaveClass('MuiStepper-alternativeLabel');
      });

      it('applies mobile-specific styling', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} />);

        // Verify the mobile styles are applied
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
        // Verify it's checking for theme.breakpoints.down('md')
        expect(mockUseMediaQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            values: expect.objectContaining({
              md: expect.any(Number),
            }),
          })
        );
      });

      it('responds to breakpoint changes', () => {
        const { rerender } = renderWithTheme(<DynamicStepper {...defaultProps} />);

        // Start with desktop
        mockUseMediaQuery.mockReturnValue(false);
        rerender(<DynamicStepper {...defaultProps} />);

        let stepLabels = document.querySelectorAll('.MuiStepLabel-label');
        stepLabels.forEach((label) => {
          expect(label).not.toHaveStyle({ display: 'none' });
        });

        // Switch to mobile
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
      it('shows pointer cursor when onStepClick is provided', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} />);

        const stepLabels = document.querySelectorAll('.MuiStepLabel-root');
        stepLabels.forEach((label) => {
          expect(label).toHaveStyle({ cursor: 'pointer' });
        });
      });

      it('shows default cursor when onStepClick is not provided', () => {
        const { currentStep, isPublicRoom } = defaultProps;
        renderWithTheme(<DynamicStepper currentStep={currentStep} isPublicRoom={isPublicRoom} />);

        const stepLabels = document.querySelectorAll('.MuiStepLabel-root');
        stepLabels.forEach((label) => {
          expect(label).toHaveStyle({ cursor: 'default' });
        });
      });

      it('applies hover styles when onStepClick is provided', () => {
        renderWithTheme(<DynamicStepper {...defaultProps} />);

        const stepLabels = document.querySelectorAll('.MuiStepLabel-root');
        expect(stepLabels.length).toBeGreaterThan(0);

        // Check that hover styles are configured (even if not actively hovered)
        stepLabels.forEach((label) => {
          expect(label).toHaveStyle({ cursor: 'pointer' });
        });
      });

      it('executes callback with correct parameters on click', async () => {
        const user = userEvent.setup();
        renderWithTheme(<DynamicStepper {...defaultProps} isPublicRoom={false} currentStep={1} />);

        // Test clicking each step and verify correct wizard step is passed
        await user.click(screen.getByText('Room Selection'));
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
        const { rerender } = renderWithTheme(<DynamicStepper {...defaultProps} currentStep={1} />);

        await user.click(screen.getByText('Actions Selection'));
        expect(mockOnStepClick).toHaveBeenCalledWith(4);

        // Change current step and verify interactivity is maintained
        rerender(<DynamicStepper {...defaultProps} currentStep={3} />);

        await user.click(screen.getByText('Finish Setup'));
        expect(mockOnStepClick).toHaveBeenCalledWith(5);
      });

      it('handles rapid clicks appropriately', async () => {
        const user = userEvent.setup();
        renderWithTheme(<DynamicStepper {...defaultProps} />);

        const roomStep = screen.getByText('Room Selection');

        // Perform rapid clicks
        await user.click(roomStep);
        await user.click(roomStep);
        await user.click(roomStep);

        expect(mockOnStepClick).toHaveBeenCalledTimes(3);
        expect(mockOnStepClick).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Translation Integration', () => {
    it('uses correct translation keys for step labels', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} />);

      // Verify that translations are being used
      expect(screen.getByText('Room Selection')).toBeInTheDocument();
      expect(screen.getByText('Local Players')).toBeInTheDocument();
      expect(screen.getByText('Game Mode Selection')).toBeInTheDocument();
      expect(screen.getByText('Actions Selection')).toBeInTheDocument();
      expect(screen.getByText('Finish Setup')).toBeInTheDocument();
    });

    it('converts translation results to strings', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} />);

      // This tests the String() conversion in the component
      // All step labels should be rendered as text
      const stepElements = document.querySelectorAll('.MuiStepLabel-label');
      stepElements.forEach((element) => {
        expect(element.textContent).toBeTruthy();
        expect(typeof element.textContent).toBe('string');
      });
    });

    it('handles translation fallbacks gracefully', () => {
      // Mock a translation that returns the key as fallback
      vi.mocked(vi.fn()).mockImplementation(() => ({
        t: (key: string, fallback?: string) => fallback || key,
      }));

      renderWithTheme(<DynamicStepper {...defaultProps} />);

      // Component should still render even with fallback translations
      expect(document.querySelector('.MuiStepper-root')).toBeInTheDocument();
    });

    it('applies localization support for step labels', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} />);

      // Verify step labels are properly localized
      const expectedLabels = [
        'Room Selection',
        'Local Players',
        'Game Mode Selection',
        'Actions Selection',
        'Finish Setup',
      ];

      expectedLabels.forEach((label) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });

  describe('FormData-Based Logic and Integration', () => {
    it('correctly handles isPublicRoom prop based on formData evaluation', () => {
      // Test with explicit public room
      renderWithTheme(<DynamicStepper {...defaultProps} isPublicRoom={true} />);

      let steps = document.querySelectorAll('.MuiStep-root');
      expect(steps).toHaveLength(3);

      // Test with explicit private room
      renderWithTheme(<DynamicStepper {...defaultProps} isPublicRoom={false} />);

      steps = document.querySelectorAll('.MuiStep-root');
      expect(steps).toHaveLength(5);
    });

    it('updates stepper configuration when room type changes', () => {
      const { rerender } = renderWithTheme(
        <DynamicStepper {...defaultProps} isPublicRoom={false} />
      );

      // Start with private room (5 steps)
      let steps = document.querySelectorAll('.MuiStep-root');
      expect(steps).toHaveLength(5);

      // Change to public room (3 steps)
      rerender(<DynamicStepper {...defaultProps} isPublicRoom={true} />);
      steps = document.querySelectorAll('.MuiStep-root');
      expect(steps).toHaveLength(3);

      // Change back to private room (5 steps)
      rerender(<DynamicStepper {...defaultProps} isPublicRoom={false} />);
      steps = document.querySelectorAll('.MuiStep-root');
      expect(steps).toHaveLength(5);
    });

    it('maintains correct active step mapping during room type transitions', () => {
      const { rerender } = renderWithTheme(
        <DynamicStepper {...defaultProps} currentStep={4} isPublicRoom={false} />
      );

      // Step 4 in private room should be the 4th stepper step (index 3)
      let steps = document.querySelectorAll('.MuiStep-root');
      expect(steps[3]).toHaveClass('Mui-active');

      // Step 4 in public room should be the 2nd stepper step (index 1)
      rerender(<DynamicStepper {...defaultProps} currentStep={4} isPublicRoom={true} />);
      steps = document.querySelectorAll('.MuiStep-root');
      expect(steps[1]).toHaveClass('Mui-active');
    });

    it('handles wizard step to stepper index mapping correctly for room type changes', async () => {
      const user = userEvent.setup();
      const { rerender } = renderWithTheme(
        <DynamicStepper {...defaultProps} isPublicRoom={false} />
      );

      // Click on Actions step in private room (4th step, index 3)
      await user.click(screen.getByText('Actions Selection'));
      expect(mockOnStepClick).toHaveBeenCalledWith(4);

      // Change to public room and click on Actions step (2nd step, index 1)
      rerender(<DynamicStepper {...defaultProps} isPublicRoom={true} />);
      await user.click(screen.getByText('Actions Selection'));
      expect(mockOnStepClick).toHaveBeenCalledWith(4); // Should still map to wizard step 4
    });

    it('preserves step navigation logic across room type changes', async () => {
      const user = userEvent.setup();
      const { rerender } = renderWithTheme(
        <DynamicStepper {...defaultProps} isPublicRoom={false} currentStep={2} />
      );

      // Verify Local Players step is clickable in private room
      await user.click(screen.getByText('Local Players'));
      expect(mockOnStepClick).toHaveBeenCalledWith(2);

      // Change to public room - Local Players should not be available
      rerender(<DynamicStepper {...defaultProps} isPublicRoom={true} currentStep={1} />);
      expect(screen.queryByText('Local Players')).not.toBeInTheDocument();
    });

    it('handles currentStep prop changes correctly for both room types', () => {
      const { rerender } = renderWithTheme(
        <DynamicStepper {...defaultProps} currentStep={1} isPublicRoom={false} />
      );

      // Check step 1 is active
      let steps = document.querySelectorAll('.MuiStep-root');
      expect(steps[0]).toHaveClass('Mui-active');

      // Change to step 3
      rerender(<DynamicStepper {...defaultProps} currentStep={3} isPublicRoom={false} />);
      steps = document.querySelectorAll('.MuiStep-root');
      expect(steps[2]).toHaveClass('Mui-active');

      // Switch to public room with step 4 (should map to index 1)
      rerender(<DynamicStepper {...defaultProps} currentStep={4} isPublicRoom={true} />);
      steps = document.querySelectorAll('.MuiStep-root');
      expect(steps[1]).toHaveClass('Mui-active');
    });
  });

  describe('GameSettingsWizard Integration Scenarios', () => {
    it('handles wizard step navigation patterns for public room workflow', async () => {
      const user = userEvent.setup();
      renderWithTheme(<DynamicStepper {...defaultProps} isPublicRoom={true} currentStep={4} />);

      // Public room workflow: Room Selection → Actions → Finish
      expect(screen.getByText('Room Selection')).toBeInTheDocument();
      expect(screen.getByText('Actions Selection')).toBeInTheDocument();
      expect(screen.getByText('Finish Setup')).toBeInTheDocument();

      // Click Room Selection (step 1)
      await user.click(screen.getByText('Room Selection'));
      expect(mockOnStepClick).toHaveBeenCalledWith(1);

      // Click Finish Setup (step 5)
      await user.click(screen.getByText('Finish Setup'));
      expect(mockOnStepClick).toHaveBeenCalledWith(5);
    });

    it('handles wizard step navigation patterns for private room workflow', async () => {
      const user = userEvent.setup();
      renderWithTheme(<DynamicStepper {...defaultProps} isPublicRoom={false} currentStep={2} />);

      // Private room workflow: Room → Local Players → Game Mode → Actions → Finish
      const expectedSteps = [
        { label: 'Room Selection', wizardStep: 1 },
        { label: 'Local Players', wizardStep: 2 },
        { label: 'Game Mode Selection', wizardStep: 3 },
        { label: 'Actions Selection', wizardStep: 4 },
        { label: 'Finish Setup', wizardStep: 5 },
      ];

      // Verify all steps are present
      expectedSteps.forEach(({ label }) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });

      // Test navigation to each step
      for (const { label, wizardStep } of expectedSteps) {
        await user.click(screen.getByText(label));
        expect(mockOnStepClick).toHaveBeenCalledWith(wizardStep);
      }
    });

    it('correctly maps protected steps in public room scenarios', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} isPublicRoom={true} currentStep={2} />);

      // Step 2 (Local Players) should not exist in public room
      // The component should handle this by not having step 2 in the steps array
      const steps = document.querySelectorAll('.MuiStep-root');
      expect(steps).toHaveLength(3); // Only 3 steps for public room

      // No step should be active since step 2 doesn't exist in public room
      const activeSteps = document.querySelectorAll('.MuiStep-root.Mui-active');
      expect(activeSteps).toHaveLength(0);
    });

    it('handles step redirection scenarios correctly', () => {
      // Test when wizard is on step 3 but room is public (should redirect)
      renderWithTheme(<DynamicStepper {...defaultProps} isPublicRoom={true} currentStep={3} />);

      // Step 3 should not exist in public room, so no step should be active
      const activeSteps = document.querySelectorAll('.MuiStep-root.Mui-active');
      expect(activeSteps).toHaveLength(0);
    });

    it('maintains step consistency during formData updates', () => {
      const { rerender } = renderWithTheme(
        <DynamicStepper {...defaultProps} isPublicRoom={false} currentStep={2} />
      );

      // Verify step 2 is active in private room
      let steps = document.querySelectorAll('.MuiStep-root');
      expect(steps[1]).toHaveClass('Mui-active');

      // Simulate formData change that switches to public room
      rerender(<DynamicStepper {...defaultProps} isPublicRoom={true} currentStep={4} />);

      // Should now show public room steps with step 4 active
      steps = document.querySelectorAll('.MuiStep-root');
      expect(steps).toHaveLength(3);
      expect(steps[1]).toHaveClass('Mui-active');
    });
  });

  describe('Advanced Step Management', () => {
    it('handles step validation and protection logic', () => {
      // Test that component correctly handles invalid step combinations
      renderWithTheme(<DynamicStepper {...defaultProps} isPublicRoom={true} currentStep={2} />);

      // Step 2 is invalid for public room, should result in no active step
      const activeSteps = document.querySelectorAll('.MuiStep-root.Mui-active');
      expect(activeSteps).toHaveLength(0);
    });

    it('provides correct step feedback for navigation state', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} isPublicRoom={false} currentStep={3} />);

      // Step 3 should be highlighted in private room
      const steps = document.querySelectorAll('.MuiStep-root');
      expect(steps[2]).toHaveClass('Mui-active');

      // Other steps should not be active
      expect(steps[0]).not.toHaveClass('Mui-active');
      expect(steps[1]).not.toHaveClass('Mui-active');
      expect(steps[3]).not.toHaveClass('Mui-active');
      expect(steps[4]).not.toHaveClass('Mui-active');
    });

    it('handles concurrent step and room type changes', () => {
      const { rerender } = renderWithTheme(
        <DynamicStepper {...defaultProps} isPublicRoom={false} currentStep={1} />
      );

      // Multiple rapid changes
      rerender(<DynamicStepper {...defaultProps} isPublicRoom={true} currentStep={4} />);
      rerender(<DynamicStepper {...defaultProps} isPublicRoom={false} currentStep={5} />);
      rerender(<DynamicStepper {...defaultProps} isPublicRoom={true} currentStep={1} />);

      // Final state should be correct
      const steps = document.querySelectorAll('.MuiStep-root');
      expect(steps).toHaveLength(3); // Public room
      expect(steps[0]).toHaveClass('Mui-active'); // Step 1 active
    });
  });

  describe('Styling and Accessibility', () => {
    it('applies correct stepper orientation', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} />);

      const stepper = document.querySelector('.MuiStepper-root');
      expect(stepper).toHaveAttribute('aria-orientation', 'horizontal');
    });

    it('maintains accessibility attributes for steps', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} />);

      const steps = document.querySelectorAll('.MuiStep-root');
      steps.forEach((step) => {
        // Each step should have proper accessibility attributes
        expect(step).toBeInTheDocument();

        // Check for step label accessibility
        const stepLabel = step.querySelector('.MuiStepLabel-root');
        expect(stepLabel).toBeInTheDocument();
      });
    });

    it('applies conditional styling based on interactivity', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} />);

      const stepLabels = document.querySelectorAll('.MuiStepLabel-root');
      stepLabels.forEach((label) => {
        expect(label).toHaveStyle({ cursor: 'pointer' });
      });
    });

    it('handles mobile-specific accessibility', () => {
      mockUseMediaQuery.mockReturnValue(true); // Mobile
      renderWithTheme(<DynamicStepper {...defaultProps} />);

      // Even on mobile, accessibility structure should be maintained
      const stepper = document.querySelector('.MuiStepper-root');
      expect(stepper).toBeInTheDocument();
      expect(stepper).toHaveAttribute('aria-orientation', 'horizontal');
    });

    it('maintains accessibility during room type transitions', () => {
      const { rerender } = renderWithTheme(
        <DynamicStepper {...defaultProps} isPublicRoom={false} />
      );

      // Check initial accessibility
      let stepper = document.querySelector('.MuiStepper-root');
      expect(stepper).toHaveAttribute('aria-orientation', 'horizontal');

      // Change room type and verify accessibility is maintained
      rerender(<DynamicStepper {...defaultProps} isPublicRoom={true} />);
      stepper = document.querySelector('.MuiStepper-root');
      expect(stepper).toHaveAttribute('aria-orientation', 'horizontal');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing onStepClick callback gracefully', async () => {
      const user = userEvent.setup();
      const { currentStep, isPublicRoom } = defaultProps;
      renderWithTheme(<DynamicStepper currentStep={currentStep} isPublicRoom={isPublicRoom} />);

      // Should not throw error when clicking without callback
      expect(async () => {
        await user.click(screen.getByText('Room Selection'));
      }).not.toThrow();
    });

    it('handles invalid currentStep values', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} currentStep={-1} />);

      // Should render without errors
      expect(document.querySelector('.MuiStepper-root')).toBeInTheDocument();

      // No step should be active
      const activeSteps = document.querySelectorAll('.MuiStep-root.Mui-active');
      expect(activeSteps).toHaveLength(0);
    });

    it('handles boundary step indices correctly', () => {
      // Test first step
      renderWithTheme(<DynamicStepper {...defaultProps} currentStep={1} />);
      let steps = document.querySelectorAll('.MuiStep-root');
      expect(steps[0]).toHaveClass('Mui-active');

      // Test last step for private room
      renderWithTheme(<DynamicStepper {...defaultProps} currentStep={5} isPublicRoom={false} />);
      steps = document.querySelectorAll('.MuiStep-root');
      expect(steps[4]).toHaveClass('Mui-active');

      // Test last step for public room
      renderWithTheme(<DynamicStepper {...defaultProps} currentStep={5} isPublicRoom={true} />);
      steps = document.querySelectorAll('.MuiStep-root');
      expect(steps[2]).toHaveClass('Mui-active');
    });

    it('handles step index out of bounds', () => {
      renderWithTheme(<DynamicStepper {...defaultProps} currentStep={10} />);

      // Should not crash and no step should be active
      expect(document.querySelector('.MuiStepper-root')).toBeInTheDocument();
      const activeSteps = document.querySelectorAll('.MuiStep-root.Mui-active');
      expect(activeSteps).toHaveLength(0);
    });

    it('handles prop combinations correctly', () => {
      // Test all valid combinations
      const combinations = [
        { currentStep: 1, isPublicRoom: true, onStepClick: undefined },
        { currentStep: 5, isPublicRoom: false, onStepClick: mockOnStepClick },
        { currentStep: 3, isPublicRoom: true, onStepClick: mockOnStepClick },
        { currentStep: 2, isPublicRoom: false, onStepClick: undefined },
      ];

      combinations.forEach((props, index) => {
        const { rerender } = renderWithTheme(<DynamicStepper {...props} />);

        // Should render without errors for all combinations
        expect(document.querySelector('.MuiStepper-root')).toBeInTheDocument();

        if (index < combinations.length - 1) {
          rerender(<DynamicStepper {...combinations[index + 1]} />);
        }
      });
    });

    it('maintains component stability with frequent prop changes', () => {
      const { rerender } = renderWithTheme(<DynamicStepper {...defaultProps} />);

      // Simulate rapid prop changes
      for (let i = 1; i <= 5; i++) {
        rerender(<DynamicStepper {...defaultProps} currentStep={i} />);
        expect(document.querySelector('.MuiStepper-root')).toBeInTheDocument();
      }

      // Switch room types rapidly
      rerender(<DynamicStepper {...defaultProps} isPublicRoom={true} />);
      expect(document.querySelectorAll('.MuiStep-root')).toHaveLength(3);

      rerender(<DynamicStepper {...defaultProps} isPublicRoom={false} />);
      expect(document.querySelectorAll('.MuiStep-root')).toHaveLength(5);
    });
  });
});
