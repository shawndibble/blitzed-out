import { describe, expect, it } from 'vitest';
import { nextStepAfter, prevStepBefore, stepAnalyticsName, stepsFor } from './wizardFlow';

describe('wizardFlow — stepsFor', () => {
  it('solo topology skips wizard step 2 (the room/local-players screen)', () => {
    const wizardSteps = stepsFor('solo').map((s) => s.wizardStep);
    expect(wizardSteps).toEqual([1, 3, 4, 5]);
  });

  it('local topology includes the LocalPlayers screen at wizard step 2', () => {
    const steps = stepsFor('local');
    expect(steps.map((s) => s.wizardStep)).toEqual([1, 2, 3, 4, 5]);
    const step2 = steps.find((s) => s.wizardStep === 2);
    expect(step2?.id).toBe('localPlayers');
    expect(step2?.labelKey).toBe('localPlayersStep.title');
    expect(step2?.labelFallback).toBe('Local Players');
  });

  it('online topology includes the Room screen at wizard step 2 (the QR-code contract)', () => {
    const steps = stepsFor('online');
    expect(steps.map((s) => s.wizardStep)).toEqual([1, 2, 3, 4, 5]);
    const step2 = steps.find((s) => s.wizardStep === 2);
    expect(step2?.id).toBe('room');
    expect(step2?.labelKey).toBe('roomSelection');
    expect(step2?.labelFallback).toBe('Room Selection');
  });

  it('falls back to the solo list for an undefined/unrecognized gameMode', () => {
    expect(stepsFor(undefined)).toEqual(stepsFor('solo'));
    expect(stepsFor('' as any)).toEqual(stepsFor('solo'));
  });

  it('has no duplicate wizardStep within any single topology', () => {
    (['solo', 'local', 'online'] as const).forEach((mode) => {
      const wizardSteps = stepsFor(mode).map((s) => s.wizardStep);
      expect(new Set(wizardSteps).size).toBe(wizardSteps.length);
    });
  });

  it('room and localPlayers share the same analytics name (one GA4 screen, two components)', () => {
    const roomEntry = stepsFor('online').find((s) => s.wizardStep === 2);
    const localPlayersEntry = stepsFor('local').find((s) => s.wizardStep === 2);
    expect(roomEntry?.analyticsName).toBe('player_details');
    expect(localPlayersEntry?.analyticsName).toBe('player_details');
  });

  it('player topology / game mode / actions / finish labels are byte-identical to the pre-refactor labels', () => {
    const solo = stepsFor('solo');
    expect(solo[0]).toMatchObject({
      labelKey: 'playerTopology.stepLabel',
      labelFallback: 'Player Setup',
    });
    expect(solo[1]).toMatchObject({
      labelKey: 'gameModeSelection',
      labelFallback: 'Game Mode Selection',
    });
    expect(solo[2]).toMatchObject({
      labelKey: 'actionsSelection',
      labelFallback: 'Actions Selection',
    });
    expect(solo[3]).toMatchObject({
      labelKey: 'finishSetup',
      labelFallback: 'Finish Setup',
    });
  });
});

describe('wizardFlow — stepAnalyticsName', () => {
  it.each([
    [0, 'advanced_settings'],
    [1, 'player_topology'],
    [2, 'player_details'],
    [3, 'game_mode'],
    [4, 'actions'],
    [5, 'finish'],
    [6, 'step_6'],
  ])('step %i -> %s (byte-identical to the old stepConfig.ts table)', (step, expected) => {
    expect(stepAnalyticsName(step)).toBe(expected);
  });
});

describe('wizardFlow — nextStepAfter / prevStepBefore', () => {
  it('reproduces the old "solo skips step 2" arithmetic: nextStepAfter(solo, 1) === 3', () => {
    expect(nextStepAfter('solo', 1)).toBe(3);
  });

  it('reproduces the old GameModeStep back-button arithmetic: prevStepBefore(solo, 3) === 1', () => {
    expect(prevStepBefore('solo', 3)).toBe(1);
  });

  it('advances by one listed step for local/online topologies', () => {
    expect(nextStepAfter('local', 1)).toBe(2);
    expect(nextStepAfter('online', 1)).toBe(2);
    expect(prevStepBefore('local', 3)).toBe(2);
    expect(prevStepBefore('online', 3)).toBe(2);
  });

  it('advances through the shared tail of the flow the same way regardless of topology', () => {
    (['solo', 'local', 'online'] as const).forEach((mode) => {
      expect(nextStepAfter(mode, 3)).toBe(4);
      expect(nextStepAfter(mode, 4)).toBe(5);
      expect(prevStepBefore(mode, 5)).toBe(4);
      expect(prevStepBefore(mode, 4)).toBe(3);
    });
  });

  it('contract: a step not listed for this topology advances to the next larger listed step, never NaN/undefined', () => {
    // wizardStep 2 is not in solo's list
    expect(nextStepAfter('solo', 2)).toBe(3);
    expect(prevStepBefore('solo', 2)).toBe(1);
  });

  it('saturates at the boundary steps instead of running off the list', () => {
    (['solo', 'local', 'online'] as const).forEach((mode) => {
      const steps = stepsFor(mode).map((s) => s.wizardStep);
      const last = steps[steps.length - 1];
      const first = steps[0];
      expect(nextStepAfter(mode, last)).toBe(last);
      expect(prevStepBefore(mode, first)).toBe(first);
    });
  });
});
