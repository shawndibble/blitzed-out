import { MemoryRouter, useParams } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameMode } from '@/types/Settings';
import GameSettingsWizard from '../index';
import type { PlayerRole } from '@/types/Settings';
import useSettingsToFormData from '@/hooks/useSettingsToFormData';

vi.mock('react-i18next', () => ({
  Trans: ({ i18nKey, children }: any) => <span data-testid={i18nKey}>{children || i18nKey}</span>,
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
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

vi.mock('@/hooks/useSettingsToFormData', () => ({
  default: vi.fn(),
}));

const mockUseSettingsToFormData = vi.mocked(useSettingsToFormData);
const mockUseParams = vi.mocked(useParams);

const mockUseUnifiedActionList = {
  actionsList: [{ id: 'action1', text: 'Test Action 1' }],
  isLoading: false,
};
vi.mock('@/hooks/useUnifiedActionList', () => ({
  default: () => mockUseUnifiedActionList,
}));

vi.mock('@/helpers/strings', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/helpers/strings')>();
  return { ...actual };
});

vi.mock('../PlayerTopologyStep', () => ({
  default: (props: any) => (
    <div data-testid="player-topology-step">
      <button onClick={() => props.nextStep(2)}>Next from Topology (skip 2)</button>
      <button onClick={() => props.nextStep()}>Next from Topology</button>
    </div>
  ),
}));

vi.mock('../RoomStep', () => ({
  default: (props: any) => (
    <div data-testid="room-step">
      <button onClick={() => props.nextStep(1)}>Next from Room</button>
      <button onClick={() => props.prevStep()}>Previous from Room</button>
    </div>
  ),
}));

vi.mock('../LocalPlayersStep', () => ({
  default: (props: any) => (
    <div data-testid="local-players-step">
      <button onClick={() => props.nextStep()}>Next from Local Players</button>
      <button onClick={() => props.prevStep()}>Previous from Local Players</button>
    </div>
  ),
}));

vi.mock('../GameModeStep', () => ({
  default: (props: any) => (
    <div data-testid="game-mode-step">
      <button onClick={() => props.nextStep()}>Next from Game Mode</button>
      <button onClick={() => props.prevStep()}>Previous from Game Mode</button>
    </div>
  ),
}));

vi.mock('../ActionsStep', () => ({
  default: (props: any) => (
    <div data-testid="actions-step">
      <button onClick={() => props.nextStep()}>Next from Actions</button>
      <button onClick={() => props.prevStep()}>Previous from Actions</button>
    </div>
  ),
}));

vi.mock('../FinishStep', () => ({
  default: (props: any) => (
    <div data-testid="finish-step">
      <button onClick={() => props.prevStep()}>Previous from Finish</button>
      <button onClick={() => props.close?.()}>Close</button>
    </div>
  ),
}));

const mockDynamicStepper = vi.fn();
vi.mock('../components/DynamicStepper', () => ({
  default: (props: any) => {
    mockDynamicStepper(props);
    return (
      <div data-testid="dynamic-stepper">
        <div data-testid="current-step">{props.currentStep}</div>
        <div data-testid="game-mode">{props.gameMode}</div>
        <button onClick={() => props.onStepClick?.(1)}>Step 1</button>
        <button onClick={() => props.onStepClick?.(2)}>Step 2</button>
        <button onClick={() => props.onStepClick?.(3)}>Step 3</button>
        <button onClick={() => props.onStepClick?.(4)}>Step 4</button>
        <button onClick={() => props.onStepClick?.(5)}>Step 5</button>
      </div>
    );
  },
}));

vi.mock('@/views/GameSettings', () => ({
  default: (props: any) => (
    <div data-testid="game-settings">
      <button onClick={() => props.onOpenSetupWizard?.()}>Back to Wizard</button>
      <button onClick={() => props.closeDialog?.()}>Close Settings</button>
    </div>
  ),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useParams: vi.fn() };
});

describe('GameSettingsWizard - Topology-first flow', () => {
  const mockClose = vi.fn();
  const mockSetFormData = vi.fn();
  let user: ReturnType<typeof userEvent.setup>;

  const localFormData = {
    room: 'AB12C',
    gameMode: 'local' as GameMode,
    roomRealtime: false,
    actions: [],
    consumption: [],
    role: 'sub' as PlayerRole,
    boardUpdated: false,
  };

  const renderWithRouter = (component: React.ReactElement) =>
    render(<MemoryRouter initialEntries={['/AB12C']}>{component}</MemoryRouter>);

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
    mockUseParams.mockReturnValue({ id: 'AB12C' });
    mockUseSettingsToFormData.mockReturnValue([localFormData, mockSetFormData]);
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockUseUnifiedActionList.isLoading = false;
  });

  describe('Initial State', () => {
    it('renders step 1 as PlayerTopologyStep', () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);
      expect(screen.getByTestId('player-topology-step')).toBeInTheDocument();
      expect(screen.getByTestId('current-step')).toHaveTextContent('1');
    });

    it('passes gameMode to DynamicStepper', () => {
      renderWithRouter(<GameSettingsWizard />);
      expect(mockDynamicStepper).toHaveBeenCalledWith(
        expect.objectContaining({ gameMode: 'local' })
      );
    });
  });

  describe('Forward Navigation — local gameMode', () => {
    it('navigates through all 5 steps', async () => {
      renderWithRouter(<GameSettingsWizard />);

      // Step 1 → 2 (topology → local players)
      expect(screen.getByTestId('player-topology-step')).toBeInTheDocument();
      await user.click(screen.getByText('Next from Topology'));
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
  });

  describe('Solo gameMode — skips step 2', () => {
    it('goes from step 1 to step 3 when solo is selected (nextStep(2))', async () => {
      const soloFormData = { ...localFormData, gameMode: 'solo' as GameMode };
      mockUseSettingsToFormData.mockReturnValue([soloFormData, mockSetFormData]);

      renderWithRouter(<GameSettingsWizard />);

      await user.click(screen.getByText('Next from Topology (skip 2)'));
      expect(screen.getByTestId('game-mode-step')).toBeInTheDocument();
      expect(screen.getByTestId('current-step')).toHaveTextContent('3');
    });
  });

  describe('Backward Navigation', () => {
    it('navigates backward through all steps', async () => {
      renderWithRouter(<GameSettingsWizard />);

      // Jump to step 5
      await user.click(screen.getByText('Step 5'));
      expect(screen.getByTestId('finish-step')).toBeInTheDocument();

      await user.click(screen.getByText('Previous from Finish'));
      expect(screen.getByTestId('actions-step')).toBeInTheDocument();

      await user.click(screen.getByText('Previous from Actions'));
      expect(screen.getByTestId('game-mode-step')).toBeInTheDocument();

      await user.click(screen.getByText('Previous from Game Mode'));
      expect(screen.getByTestId('local-players-step')).toBeInTheDocument();

      await user.click(screen.getByText('Previous from Local Players'));
      expect(screen.getByTestId('player-topology-step')).toBeInTheDocument();
    });
  });

  describe('Direct Step Navigation', () => {
    it('jumps to step 3 and shows game mode step', async () => {
      renderWithRouter(<GameSettingsWizard />);
      await user.click(screen.getByText('Step 3'));
      expect(screen.getByTestId('game-mode-step')).toBeInTheDocument();
      expect(screen.getByTestId('current-step')).toHaveTextContent('3');
    });

    it('jumps to step 5 and shows finish step', async () => {
      renderWithRouter(<GameSettingsWizard />);
      await user.click(screen.getByText('Step 5'));
      expect(screen.getByTestId('finish-step')).toBeInTheDocument();
    });
  });

  describe('Advanced Settings Integration', () => {
    it('navigates to advanced settings (step 0) and returns to step 1', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);

      await user.click(screen.getAllByTestId('advancedSetup')[0]);
      expect(screen.getByTestId('game-settings')).toBeInTheDocument();

      await user.click(screen.getByText('Back to Wizard'));
      expect(screen.getByTestId('player-topology-step')).toBeInTheDocument();
    });

    it('calls close when closing from advanced settings', async () => {
      renderWithRouter(<GameSettingsWizard close={mockClose} />);
      await user.click(screen.getAllByTestId('advancedSetup')[0]);
      await user.click(screen.getByText('Close Settings'));
      expect(mockClose).toHaveBeenCalledTimes(1);
    });
  });
});
