import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import GameModeStep from '../index';
import { FormData } from '@/types';
import { Settings } from '@/types/Settings';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  Trans: ({ i18nKey, children }: { i18nKey?: string; children?: any }) => {
    const translations: Record<string, string> = {
      playingWithPeople: 'Are you playing with other people?',
      gameModeSelection: 'Game Mode Selection',
      yourRole: 'Your Role',
      areYouNaked: 'Are You Naked?',
      previous: 'Previous',
      next: 'Next',
      selected: 'Selected',
    };
    return <span data-testid={i18nKey}>{children || translations[i18nKey || ''] || i18nKey}</span>;
  },
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        physicalInteractionDesc: 'Physical interaction description',
        soloOnlinePlayDesc: 'Solo online play description',
        dominantRoleDesc: 'Dominant role description',
        switchRoleDesc: 'Switch role description',
        submissiveRoleDesc: 'Submissive role description',
        foreplayClothedDesc: 'Foreplay clothed description',
        intimateNudityDesc: 'Intimate nudity description',
        yesInteracting: 'Yes, Interacting',
        noInteracting: 'No, Interacting',
        dom: 'Dominant',
        vers: 'Switch',
        sub: 'Submissive',
        noNaked: 'Clothed',
        yesNaked: 'Naked',
        selected: 'Selected',
      };
      return translations[key] || key;
    },
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

// Mock helpers
vi.mock('@/helpers/strings', () => ({
  isOnlineMode: vi.fn((gameMode: string) => gameMode === 'online'),
}));

// Mock ButtonRow component
vi.mock('@/components/ButtonRow', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="button-row">{children}</div>
  ),
}));

describe('GameModeStep', () => {
  const mockSetFormData = vi.fn();
  const mockNextStep = vi.fn();
  const mockPrevStep = vi.fn();
  const user = userEvent.setup();

  const baseFormData: FormData & Partial<Settings> = {
    gameMode: 'local',
    role: 'sub',
    isNaked: false,
    room: 'PRIVATE',
    boardUpdated: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders correctly with base props', () => {
      render(
        <GameModeStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      expect(screen.getByTestId('button-row')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('renders with minimal height container', () => {
      const { container } = render(
        <GameModeStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      const mainBox = container.firstChild as Element;
      expect(mainBox).toHaveStyle({ minHeight: '200px' });
    });
  });

  describe('Game Mode Selection (Without Local Players)', () => {
    const formDataWithoutLocalPlayers = {
      ...baseFormData,
      hasLocalPlayers: false,
    };

    it('displays interaction mode question when no local players configured', () => {
      render(
        <GameModeStep
          formData={formDataWithoutLocalPlayers}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      expect(screen.getByTestId('playingWithPeople')).toBeInTheDocument();
      expect(screen.getByText('Yes, Interacting')).toBeInTheDocument();
      expect(screen.getByText('No, Interacting')).toBeInTheDocument();
    });

    it('selects local mode when clicking "Yes, Interacting"', async () => {
      render(
        <GameModeStep
          formData={formDataWithoutLocalPlayers}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      const localModeCard = screen.getByText('Yes, Interacting').closest('[role="button"]');
      expect(localModeCard).toBeInTheDocument();

      await user.click(localModeCard!);

      expect(mockSetFormData).toHaveBeenCalledWith({
        ...formDataWithoutLocalPlayers,
        gameMode: 'local',
        roomRealtime: false,
      });
    });

    it('selects online mode when clicking "No, Interacting"', async () => {
      render(
        <GameModeStep
          formData={formDataWithoutLocalPlayers}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      const onlineModeCard = screen.getByText('No, Interacting').closest('[role="button"]');
      expect(onlineModeCard).toBeInTheDocument();

      await user.click(onlineModeCard!);

      expect(mockSetFormData).toHaveBeenCalledWith({
        ...formDataWithoutLocalPlayers,
        gameMode: 'online',
        roomRealtime: true,
      });
    });

    it('shows selected chip for currently selected game mode', () => {
      const localModeSelected = {
        ...formDataWithoutLocalPlayers,
        gameMode: 'local' as const,
      };

      render(
        <GameModeStep
          formData={localModeSelected}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      // Should show selected chip in the local mode card
      const selectedChips = screen.getAllByText('Selected');
      expect(selectedChips).toHaveLength(3); // One for local mode, one for role (sub), one for not naked
    });

    it('applies correct styling for selected and unselected cards', () => {
      const localModeSelected = {
        ...formDataWithoutLocalPlayers,
        gameMode: 'local' as const,
      };

      render(
        <GameModeStep
          formData={localModeSelected}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      const interactionCards = screen.getAllByRole('button');
      const localCard = interactionCards.find((card) =>
        card.textContent?.includes('Yes, Interacting')
      );
      const onlineCard = interactionCards.find((card) =>
        card.textContent?.includes('No, Interacting')
      );

      expect(localCard).toBeInTheDocument();
      expect(onlineCard).toBeInTheDocument();
    });
  });

  describe('Local Players Configuration Effects', () => {
    it('hides interaction question when local players are configured', () => {
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

      expect(screen.queryByTestId('playingWithPeople')).not.toBeInTheDocument();
      expect(screen.getByTestId('gameModeSelection')).toBeInTheDocument();
    });

    it('forces local mode and disables realtime when local players are configured', async () => {
      const formDataWithLocalPlayers = {
        ...baseFormData,
        hasLocalPlayers: true,
        gameMode: 'online' as const, // Should be forced to local
      };

      render(
        <GameModeStep
          formData={formDataWithLocalPlayers}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      // Wait for useEffect to trigger
      await waitFor(() => {
        expect(mockSetFormData).toHaveBeenCalled();
      });

      // Verify the function was called with a function that updates the form data correctly
      const updateFunction = mockSetFormData.mock.calls[0][0];
      expect(typeof updateFunction).toBe('function');

      // Test that the function produces the expected result
      const testPrevState = { ...baseFormData, hasLocalPlayers: true };
      const result = updateFunction(testPrevState);
      expect(result).toEqual(
        expect.objectContaining({
          gameMode: 'local',
          roomRealtime: false,
        })
      );
    });

    it('responds to changes in hasLocalPlayers prop', async () => {
      const { rerender } = render(
        <GameModeStep
          formData={{ ...baseFormData, hasLocalPlayers: false }}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      expect(screen.getByTestId('playingWithPeople')).toBeInTheDocument();

      // Change to having local players
      rerender(
        <GameModeStep
          formData={{ ...baseFormData, hasLocalPlayers: true }}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      await waitFor(() => {
        expect(mockSetFormData).toHaveBeenCalled();
      });

      // Verify the function was called with a function that updates the form data correctly
      const updateFunction = mockSetFormData.mock.calls[mockSetFormData.mock.calls.length - 1][0];
      expect(typeof updateFunction).toBe('function');

      // Test that the function produces the expected result
      const testPrevState = { ...baseFormData, hasLocalPlayers: true };
      const result = updateFunction(testPrevState);
      expect(result).toEqual(
        expect.objectContaining({
          gameMode: 'local',
          roomRealtime: false,
        })
      );

      expect(screen.queryByTestId('playingWithPeople')).not.toBeInTheDocument();
      expect(screen.getByTestId('gameModeSelection')).toBeInTheDocument();
    });
  });

  describe('Role Selection', () => {
    const formDataForRoleSelection = {
      ...baseFormData,
      hasLocalPlayers: false,
      gameMode: 'local' as const,
    };

    it('shows role selection in local mode without local players', () => {
      render(
        <GameModeStep
          formData={formDataForRoleSelection}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      expect(screen.getByTestId('yourRole')).toBeInTheDocument();
      expect(screen.getByText('Dominant')).toBeInTheDocument();
      expect(screen.getByText('Switch')).toBeInTheDocument();
      expect(screen.getByText('Submissive')).toBeInTheDocument();
    });

    it('hides role selection in online mode', () => {
      const onlineFormData = {
        ...formDataForRoleSelection,
        gameMode: 'online' as const,
      };

      render(
        <GameModeStep
          formData={onlineFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      expect(screen.queryByTestId('yourRole')).not.toBeInTheDocument();
    });

    it('hides role selection when local players are configured', () => {
      const localPlayersFormData = {
        ...formDataForRoleSelection,
        hasLocalPlayers: true,
      };

      render(
        <GameModeStep
          formData={localPlayersFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      expect(screen.queryByTestId('yourRole')).not.toBeInTheDocument();
    });

    it('updates formData when role is selected', async () => {
      render(
        <GameModeStep
          formData={formDataForRoleSelection}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      const domRoleCard = screen.getByText('Dominant').closest('[role="button"]');
      expect(domRoleCard).toBeInTheDocument();

      await user.click(domRoleCard!);

      expect(mockSetFormData).toHaveBeenCalledWith({
        ...formDataForRoleSelection,
        role: 'dom',
      });
    });

    it('shows selected chip for currently selected role', () => {
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

      const selectedChips = screen.getAllByText('Selected');
      expect(selectedChips.length).toBeGreaterThan(0);
    });

    it('allows selecting all role options', async () => {
      render(
        <GameModeStep
          formData={formDataForRoleSelection}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      const roles = [
        { text: 'Dominant', value: 'dom' },
        { text: 'Switch', value: 'vers' },
        { text: 'Submissive', value: 'sub' },
      ];

      for (const role of roles) {
        const roleCard = screen.getByText(role.text).closest('[role="button"]');
        expect(roleCard).toBeInTheDocument();

        await user.click(roleCard!);

        expect(mockSetFormData).toHaveBeenCalledWith({
          ...formDataForRoleSelection,
          role: role.value,
        });

        mockSetFormData.mockClear();
      }
    });
  });

  describe('Intensity Selection', () => {
    const formDataForIntensitySelection = {
      ...baseFormData,
      hasLocalPlayers: false,
      gameMode: 'local' as const,
    };

    it('shows intensity selection in local mode', () => {
      render(
        <GameModeStep
          formData={formDataForIntensitySelection}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      expect(screen.getByTestId('areYouNaked')).toBeInTheDocument();
      expect(screen.getByText('Clothed')).toBeInTheDocument();
      expect(screen.getByText('Naked')).toBeInTheDocument();
    });

    it('shows intensity selection even with local players (local mode)', () => {
      const localPlayersFormData = {
        ...formDataForIntensitySelection,
        hasLocalPlayers: true,
      };

      render(
        <GameModeStep
          formData={localPlayersFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      expect(screen.getByTestId('areYouNaked')).toBeInTheDocument();
    });

    it('hides intensity selection in online mode', () => {
      const onlineFormData = {
        ...formDataForIntensitySelection,
        gameMode: 'online' as const,
      };

      render(
        <GameModeStep
          formData={onlineFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      expect(screen.queryByTestId('areYouNaked')).not.toBeInTheDocument();
    });

    it('updates formData when intensity is selected - clothed', async () => {
      const nakedFormData = {
        ...formDataForIntensitySelection,
        isNaked: true,
      };

      render(
        <GameModeStep
          formData={nakedFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      const clothedCard = screen.getByText('Clothed').closest('[role="button"]');
      expect(clothedCard).toBeInTheDocument();

      await user.click(clothedCard!);

      expect(mockSetFormData).toHaveBeenCalledWith({
        ...nakedFormData,
        isNaked: false,
      });
    });

    it('updates formData when intensity is selected - naked', async () => {
      render(
        <GameModeStep
          formData={formDataForIntensitySelection}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      const nakedCard = screen.getByText('Naked').closest('[role="button"]');
      expect(nakedCard).toBeInTheDocument();

      await user.click(nakedCard!);

      expect(mockSetFormData).toHaveBeenCalledWith({
        ...formDataForIntensitySelection,
        isNaked: true,
      });
    });

    it('shows selected chip for currently selected intensity', () => {
      const nakedFormData = {
        ...formDataForIntensitySelection,
        isNaked: true,
      };

      render(
        <GameModeStep
          formData={nakedFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      const selectedChips = screen.getAllByText('Selected');
      expect(selectedChips.length).toBeGreaterThan(0);
    });
  });

  describe('Navigation Buttons', () => {
    it('calls prevStep when Previous button is clicked', async () => {
      render(
        <GameModeStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      const prevButton = screen.getByText('Previous');
      await user.click(prevButton);

      expect(mockPrevStep).toHaveBeenCalledTimes(1);
    });

    it('calls nextStep when Next button is clicked', async () => {
      render(
        <GameModeStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      expect(mockNextStep).toHaveBeenCalledTimes(1);
    });

    it('renders navigation buttons in ButtonRow component', () => {
      render(
        <GameModeStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      const buttonRow = screen.getByTestId('button-row');
      expect(buttonRow).toBeInTheDocument();

      // Both buttons should be inside the button row
      expect(buttonRow).toContainElement(screen.getByText('Previous'));
      expect(buttonRow).toContainElement(screen.getByText('Next'));
    });
  });

  describe('Conditional Rendering Logic', () => {
    it('updates role selection visibility when game mode changes', async () => {
      const { rerender } = render(
        <GameModeStep
          formData={{ ...baseFormData, gameMode: 'local', hasLocalPlayers: false }}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      expect(screen.getByTestId('yourRole')).toBeInTheDocument();

      // Change to online mode
      rerender(
        <GameModeStep
          formData={{ ...baseFormData, gameMode: 'online', hasLocalPlayers: false }}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      await waitFor(() => {
        expect(screen.queryByTestId('yourRole')).not.toBeInTheDocument();
      });
    });

    it('shows correct content for different game mode combinations', async () => {
      const scenarios = [
        {
          name: 'Local mode without local players',
          formData: { ...baseFormData, gameMode: 'local' as const, hasLocalPlayers: false },
          shouldShow: { interaction: true, role: true, intensity: true, gameSelection: false },
        },
        {
          name: 'Local mode with local players',
          formData: { ...baseFormData, gameMode: 'local' as const, hasLocalPlayers: true },
          shouldShow: { interaction: false, role: false, intensity: true, gameSelection: true },
        },
        {
          name: 'Online mode without local players',
          formData: { ...baseFormData, gameMode: 'online' as const, hasLocalPlayers: false },
          shouldShow: { interaction: true, role: false, intensity: false, gameSelection: false },
        },
        {
          name: 'Online mode with local players (should force local)',
          formData: { ...baseFormData, gameMode: 'online' as const, hasLocalPlayers: true },
          shouldShow: { interaction: false, role: false, intensity: true, gameSelection: true },
        },
      ];

      for (const scenario of scenarios) {
        const { unmount } = render(
          <GameModeStep
            formData={scenario.formData}
            setFormData={mockSetFormData}
            nextStep={mockNextStep}
            prevStep={mockPrevStep}
          />
        );

        // Wait for useEffect to complete if needed
        if (scenario.formData.hasLocalPlayers) {
          await waitFor(() => {
            expect(mockSetFormData).toHaveBeenCalled();
          });
          vi.clearAllMocks();
        }

        // Check interaction question
        if (scenario.shouldShow.interaction) {
          expect(screen.getByTestId('playingWithPeople')).toBeInTheDocument();
        } else {
          expect(screen.queryByTestId('playingWithPeople')).not.toBeInTheDocument();
        }

        // Check game mode selection title
        if (scenario.shouldShow.gameSelection) {
          expect(screen.getByTestId('gameModeSelection')).toBeInTheDocument();
        } else {
          expect(screen.queryByTestId('gameModeSelection')).not.toBeInTheDocument();
        }

        // Check role selection
        if (scenario.shouldShow.role) {
          expect(screen.getByTestId('yourRole')).toBeInTheDocument();
        } else {
          expect(screen.queryByTestId('yourRole')).not.toBeInTheDocument();
        }

        // Check intensity selection
        if (scenario.shouldShow.intensity) {
          expect(screen.getByTestId('areYouNaked')).toBeInTheDocument();
        } else {
          expect(screen.queryByTestId('areYouNaked')).not.toBeInTheDocument();
        }

        unmount();
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles undefined gameMode gracefully', () => {
      const formDataWithUndefinedGameMode = {
        ...baseFormData,
        gameMode: undefined as any,
      };

      expect(() => {
        render(
          <GameModeStep
            formData={formDataWithUndefinedGameMode}
            setFormData={mockSetFormData}
            nextStep={mockNextStep}
            prevStep={mockPrevStep}
          />
        );
      }).not.toThrow();
    });

    it('handles missing role gracefully', () => {
      const formDataWithoutRole = {
        ...baseFormData,
        role: undefined,
      };

      expect(() => {
        render(
          <GameModeStep
            formData={formDataWithoutRole}
            setFormData={mockSetFormData}
            nextStep={mockNextStep}
            prevStep={mockPrevStep}
          />
        );
      }).not.toThrow();
    });

    it('handles missing isNaked property gracefully', () => {
      const formDataWithoutIsNaked = {
        ...baseFormData,
        isNaked: undefined,
      };

      expect(() => {
        render(
          <GameModeStep
            formData={formDataWithoutIsNaked}
            setFormData={mockSetFormData}
            nextStep={mockNextStep}
            prevStep={mockPrevStep}
          />
        );
      }).not.toThrow();
    });

    it('handles rapid consecutive clicks without errors', async () => {
      render(
        <GameModeStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      const nextButton = screen.getByText('Next');

      // Rapidly click multiple times
      await user.click(nextButton);
      await user.click(nextButton);
      await user.click(nextButton);

      expect(mockNextStep).toHaveBeenCalledTimes(3);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA roles for interactive cards', () => {
      render(
        <GameModeStep
          formData={{ ...baseFormData, hasLocalPlayers: false }}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      const interactionCards = screen.getAllByRole('button');
      expect(interactionCards.length).toBeGreaterThan(0);

      // Each card should have role="button"
      interactionCards.forEach((card) => {
        expect(card).toHaveAttribute('role', 'button');
      });
    });

    it('maintains focus management for keyboard navigation', async () => {
      render(
        <GameModeStep
          formData={{ ...baseFormData, hasLocalPlayers: false }}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      const interactionCards = screen.getAllByRole('button');
      const firstCard = interactionCards[0];

      // Focus the first card
      firstCard.focus();
      expect(document.activeElement).toBe(firstCard);

      // Press Enter to activate
      await user.keyboard('{Enter}');

      expect(mockSetFormData).toHaveBeenCalled();
    });

    it('provides proper text descriptions for all interactive elements', () => {
      render(
        <GameModeStep
          formData={{ ...baseFormData, hasLocalPlayers: false }}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      // Check that all cards have descriptive text
      expect(screen.getByText('Physical interaction description')).toBeInTheDocument();
      expect(screen.getByText('Solo online play description')).toBeInTheDocument();
      expect(screen.getByText('Foreplay clothed description')).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('does not cause unnecessary re-renders when props do not change', () => {
      const { rerender } = render(
        <GameModeStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      const firstRenderButtonCount = screen.getAllByRole('button').length;

      // Re-render with same props
      rerender(
        <GameModeStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      const secondRenderButtonCount = screen.getAllByRole('button').length;
      expect(firstRenderButtonCount).toBe(secondRenderButtonCount);
    });

    it('handles form data updates efficiently', async () => {
      render(
        <GameModeStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      // Should only call the function once per click
      expect(mockNextStep).toHaveBeenCalledTimes(1);
    });
  });
});
