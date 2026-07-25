import type { GameMode } from '@/types/Settings';

export type WizardStepId =
  'playerTopology' | 'room' | 'localPlayers' | 'gameMode' | 'actions' | 'finish';

export interface WizardStepEntry {
  /** Stable id for this step, independent of its position in any topology's list. */
  id: WizardStepId;
  /**
   * The wizard's public step number. This is also an external URL contract —
   * shared QR codes encode `?step=2` for the room step (see
   * src/components/RoomQRCode/index.tsx) — so these numbers must never be
   * renumbered or reordered. New steps get appended, not inserted.
   */
  wizardStep: number;
  labelKey: string;
  labelFallback: string;
  /**
   * Frozen GA4 screen name. wizardStep 2 is one analytics screen
   * ('player_details') covering two different components (RoomStep for
   * online, LocalPlayersStep for local) — both entries intentionally share
   * this string so the flow module doesn't silently rename a live screen.
   */
  analyticsName: string;
}

const playerTopologyStep: WizardStepEntry = {
  id: 'playerTopology',
  wizardStep: 1,
  labelKey: 'playerTopology.stepLabel',
  labelFallback: 'Player Setup',
  analyticsName: 'player_topology',
};

// One GA4 screen ('player_details') covers both wizardStep-2 components
// (RoomStep for online, LocalPlayersStep for local) — written once here so
// roomStep/localPlayersStep can't drift apart into two different names.
const STEP_2_ANALYTICS_NAME = 'player_details';

const roomStep: WizardStepEntry = {
  id: 'room',
  wizardStep: 2,
  labelKey: 'roomSelection',
  labelFallback: 'Room Selection',
  analyticsName: STEP_2_ANALYTICS_NAME,
};

const localPlayersStep: WizardStepEntry = {
  id: 'localPlayers',
  wizardStep: 2,
  labelKey: 'localPlayersStep.title',
  labelFallback: 'Local Players',
  analyticsName: STEP_2_ANALYTICS_NAME,
};

const gameModeStep: WizardStepEntry = {
  id: 'gameMode',
  wizardStep: 3,
  labelKey: 'gameModeSelection',
  labelFallback: 'Game Mode Selection',
  analyticsName: 'game_mode',
};

const actionsStep: WizardStepEntry = {
  id: 'actions',
  wizardStep: 4,
  labelKey: 'actionsSelection',
  labelFallback: 'Actions Selection',
  analyticsName: 'actions',
};

const finishStep: WizardStepEntry = {
  id: 'finish',
  wizardStep: 5,
  labelKey: 'finishSetup',
  labelFallback: 'Finish Setup',
  analyticsName: 'finish',
};

/**
 * One ordered step list per Player Topology — the single source of truth for
 * "solo skips step 2". next/prev/analytics are all derived from these lists
 * instead of computed by adding or subtracting integers on a step counter.
 */
const WIZARD_FLOW: Record<GameMode, WizardStepEntry[]> = {
  solo: [playerTopologyStep, gameModeStep, actionsStep, finishStep],
  local: [playerTopologyStep, localPlayersStep, gameModeStep, actionsStep, finishStep],
  online: [playerTopologyStep, roomStep, gameModeStep, actionsStep, finishStep],
};

/**
 * Analytics screen names by wizard step number, independent of topology.
 * Derived from WIZARD_FLOW's step entries so `analyticsName` on each entry is
 * the only place a step's analytics name is defined — no second table to keep
 * in sync by hand. Step 0 is Advanced Settings — entered before the wizard
 * proper, so it has no step-list entry and is added explicitly.
 */
function buildAnalyticsNames(): Record<number, string> {
  const names: Record<number, string> = { 0: 'advanced_settings' };
  for (const steps of Object.values(WIZARD_FLOW)) {
    for (const entry of steps) {
      names[entry.wizardStep] = entry.analyticsName;
    }
  }
  return names;
}

const ANALYTICS_NAMES: Record<number, string> = buildAnalyticsNames();

/** The ordered step list for a topology. Unknown/empty gameMode falls back to solo's list. */
export function stepsFor(gameMode: GameMode | undefined): WizardStepEntry[] {
  return WIZARD_FLOW[gameMode as GameMode] ?? WIZARD_FLOW.solo;
}

/** Analytics screen name for a wizard step number, regardless of topology. */
export function stepAnalyticsName(wizardStep: number): string {
  return ANALYTICS_NAMES[wizardStep] ?? `step_${wizardStep}`;
}

/**
 * Next listed wizard step after `step` for this topology. If `step` isn't in
 * the list (the topology changed under it since `step` was set), advances to
 * the next larger listed step instead of doing arithmetic on a stale number.
 * Saturates at the last listed step — never returns undefined/NaN.
 */
export function nextStepAfter(gameMode: GameMode | undefined, step: number): number {
  const steps = stepsFor(gameMode).map((entry) => entry.wizardStep);
  const index = steps.indexOf(step);
  if (index >= 0) return steps[Math.min(index + 1, steps.length - 1)];
  const nextListed = steps.find((s) => s > step);
  return nextListed ?? steps[steps.length - 1];
}

/**
 * Previous listed wizard step before `step` for this topology. Mirrors
 * nextStepAfter's not-listed handling: falls back to the closest smaller
 * listed step, saturating at the first listed step.
 */
export function prevStepBefore(gameMode: GameMode | undefined, step: number): number {
  const steps = stepsFor(gameMode).map((entry) => entry.wizardStep);
  const index = steps.indexOf(step);
  if (index >= 0) return steps[Math.max(index - 1, 0)];
  const smallerListed = steps.filter((s) => s < step);
  return smallerListed.length ? smallerListed[smallerListed.length - 1] : steps[0];
}
