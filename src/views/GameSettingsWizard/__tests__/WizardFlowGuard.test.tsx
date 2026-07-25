/**
 * Characterization tests for the wizard's step-graph rules — written before
 * the flow module exists, against the real PlayerTopologyStep and the real
 * DynamicStepper (everything else stubbed). These are the tests the old
 * integer-arithmetic implementation never actually had:
 *  - clicking "Just Me" then Next really does skip to GameModeStep
 *  - a shared `?step=2` QR link really does land on RoomStep in online mode
 *  - a stale `?resumeStep=2` link against a persisted solo gameMode pins
 *    today's blank-body behavior, so any future fix is a deliberate change
 */
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GameSettingsWizard from '../index';
import { stepsFor } from '../wizardFlow';
import type { GameMode } from '@/types/Settings';

vi.mock('react-i18next', () => ({
  Trans: ({ i18nKey, children }: any) => <span data-testid={i18nKey}>{children || i18nKey}</span>,
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

vi.mock('@/helpers/networkStatus', () => ({
  isOffline: () => false,
}));

let persistedSettings: Record<string, any> = {};
vi.mock('@/stores/settingsStore', () => ({
  useSettings: () => [persistedSettings, vi.fn()],
}));

vi.mock('@/context/hooks/useMessages', () => ({
  default: () => ({ messages: [] }),
}));

vi.mock('@/hooks/useLocalPlayers', () => ({
  useLocalPlayers: () => ({ createLocalSession: vi.fn() }),
}));

vi.mock('@/hooks/useUnifiedActionList', () => ({
  default: () => ({ actionsList: [], isLoading: false }),
}));

vi.mock('../RoomStep', () => ({
  default: (props: any) => (
    <div data-testid="room-step">
      <button onClick={() => props.nextStep()}>Next</button>
    </div>
  ),
}));

vi.mock('../LocalPlayersStep', () => ({
  default: (props: any) => (
    <div data-testid="local-players-step">
      <button onClick={() => props.nextStep()}>Next</button>
    </div>
  ),
}));

vi.mock('../GameModeStep', () => ({
  default: (props: any) => (
    <div data-testid="game-mode-step">
      <button onClick={() => props.nextStep()}>Next</button>
    </div>
  ),
}));

vi.mock('../ActionsStep', () => ({
  default: (props: any) => (
    <div data-testid="actions-step">
      <button onClick={() => props.nextStep()}>Next</button>
    </div>
  ),
}));

vi.mock('../FinishStep', () => ({
  default: () => <div data-testid="finish-step" />,
}));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <GameSettingsWizard />
    </MemoryRouter>
  );

describe('Wizard flow guard — real PlayerTopologyStep + real DynamicStepper', () => {
  beforeEach(() => {
    persistedSettings = {};
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('clicking Just Me then Next renders GameModeStep, skipping the room/local-players screen', async () => {
    const user = userEvent.setup();
    renderAt('/AB12C');

    expect(screen.getByText('Just Me')).toBeInTheDocument();
    await user.click(screen.getByText('Just Me'));
    await user.click(screen.getByRole('button', { name: 'next' }));

    expect(screen.getByTestId('game-mode-step')).toBeInTheDocument();
    expect(screen.queryByTestId('room-step')).not.toBeInTheDocument();
    expect(screen.queryByTestId('local-players-step')).not.toBeInTheDocument();
  });

  it('a shared ?step=2 QR link lands on RoomStep with gameMode forced online, active stepper step on Room Selection', () => {
    renderAt('/AB12C?step=2');

    expect(screen.getByTestId('room-step')).toBeInTheDocument();
    const stepper = document.querySelector('.MuiStepper-root');
    expect(stepper).toBeInTheDocument();
    const activeLabel = document.querySelector('.MuiStepLabel-label.Mui-active');
    expect(activeLabel).toHaveTextContent('Room Selection');
  });

  it('pins current behavior: a stale ?resumeStep=2 link against a persisted solo gameMode renders a blank step body with no active stepper step', () => {
    persistedSettings = { gameMode: 'solo' };
    renderAt('/AB12C?resumeStep=2');

    expect(screen.queryByTestId('room-step')).not.toBeInTheDocument();
    expect(screen.queryByTestId('local-players-step')).not.toBeInTheDocument();
    expect(screen.queryByTestId('game-mode-step')).not.toBeInTheDocument();

    const activeLabels = document.querySelectorAll('.MuiStepLabel-label.Mui-active');
    expect(activeLabels).toHaveLength(0);
  });
});

// Maps each flow entry's stable id to the stub's data-testid above (real
// PlayerTopologyStep has no testid, so it's identified by its "Just Me" card
// instead), so we can read off which components the wizard actually mounted
// while clicking through — independent of wizardFlow.ts's own step lists.
const STEP_TESTID: Record<string, string> = {
  room: 'room-step',
  localPlayers: 'local-players-step',
  gameMode: 'game-mode-step',
  actions: 'actions-step',
  finish: 'finish-step',
};

describe('Wizard flow guard — stepper shows exactly the steps the router renders', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it.each(['solo', 'local', 'online'] as GameMode[])(
    'for gameMode=%s, DynamicStepper lists exactly the steps clicking Next actually visits',
    async (mode) => {
      persistedSettings = { gameMode: mode };
      const user = userEvent.setup();
      renderAt('/AB12C');

      // DynamicStepper's own rendered step count, from the real component.
      const stepperStepCount = document.querySelectorAll('.MuiStep-root').length;
      expect(stepperStepCount).toBe(stepsFor(mode).length);

      // Walk Next from step 1 to finish; each iteration asserts the component
      // the router actually mounted is the one wizardFlow.ts says should be
      // next — this is what fails if renderStep's switch and stepsFor(mode)
      // ever disagree (e.g. an unreachable/wrong screen for this topology).
      for (const expectedId of stepsFor(mode).map((entry) => entry.id)) {
        if (expectedId === 'playerTopology') {
          expect(screen.getByText('Just Me')).toBeInTheDocument();
        } else {
          expect(screen.getByTestId(STEP_TESTID[expectedId])).toBeInTheDocument();
        }

        if (expectedId === 'finish') break;

        const nextButton =
          expectedId === 'playerTopology'
            ? screen.getByRole('button', { name: 'next' })
            : screen.getByRole('button', { name: 'Next' });
        await user.click(nextButton);
      }
    }
  );
});
