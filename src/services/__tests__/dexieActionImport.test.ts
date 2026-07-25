import { describe, expect, it } from 'vitest';

import { convertDexieGroupsToActions } from '@/services/dexieActionImport';
import type { CustomGroupPull } from '@/types/customGroups';

const group = (overrides: Partial<CustomGroupPull> = {}): CustomGroupPull =>
  ({
    id: 'g1',
    name: 'throatTraining',
    label: 'Throat Training',
    type: 'solo',
    locale: 'en',
    gameMode: 'online',
    isDefault: true,
    intensities: [
      { id: 'i1', label: 'Lick Toy', value: 1, isDefault: true },
      { id: 'i2', label: 'Suck Toy', value: 2, isDefault: true },
      { id: 'i3', label: 'Deepthroat', value: 3, isDefault: true },
    ],
    ...overrides,
  }) as CustomGroupPull;

describe('convertDexieGroupsToActions', () => {
  // A phantom "None" level used to be injected as the first action key. Every
  // consumer that maps a 1-based level to an action-key index then read one
  // label too low, and level 1 rendered as "None" — visible in the room's
  // settings message.
  it('does not inject a phantom None level', () => {
    const actions = convertDexieGroupsToActions([group()]);

    expect(Object.keys(actions.throatTraining.actions ?? {})).toEqual([
      'Lick Toy',
      'Suck Toy',
      'Deepthroat',
    ]);
  });

  it('exposes intensities keyed by level value so consumers never index by position', () => {
    const actions = convertDexieGroupsToActions([group()]);

    expect(actions.throatTraining.intensities).toEqual({
      1: 'Lick Toy',
      2: 'Suck Toy',
      3: 'Deepthroat',
    });
  });

  it('orders levels by value regardless of stored order', () => {
    const actions = convertDexieGroupsToActions([
      group({
        intensities: [
          { id: 'i3', label: 'Deepthroat', value: 3, isDefault: true },
          { id: 'i1', label: 'Lick Toy', value: 1, isDefault: true },
          { id: 'i2', label: 'Suck Toy', value: 2, isDefault: true },
        ],
      }),
    ]);

    expect(Object.keys(actions.throatTraining.actions ?? {})).toEqual([
      'Lick Toy',
      'Suck Toy',
      'Deepthroat',
    ]);
  });

  it('keeps the group label and type', () => {
    const actions = convertDexieGroupsToActions([group()]);

    expect(actions.throatTraining.label).toBe('Throat Training');
    expect(actions.throatTraining.type).toBe('solo');
  });
});
