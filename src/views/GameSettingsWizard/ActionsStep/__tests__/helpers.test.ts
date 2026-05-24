import { describe, expect, it } from 'vitest';
import { purgedFormData } from '../helpers';
import { FormData } from '@/types';

const makeFormData = (overrides: Partial<FormData>): FormData =>
  ({
    gameMode: 'online',
    room: 'TEST',
    boardUpdated: false,
    selectedActions: {},
    ...overrides,
  }) as FormData;

describe('purgedFormData - solo modes', () => {
  it('purges foreplay/sex entries for gameMode=solo', () => {
    const formData = makeFormData({
      gameMode: 'solo',
      soloPlay: true,
      selectedActions: {
        bating: { type: 'solo', levels: [1] },
        kissing: { type: 'foreplay', levels: [1] },
        spanking: { type: 'sex', levels: [1] },
        alcohol: { type: 'consumption', levels: [1] },
      },
    });

    const result = purgedFormData(formData);

    expect(result.selectedActions).toHaveProperty('bating');
    expect(result.selectedActions).toHaveProperty('alcohol');
    expect(result.selectedActions).not.toHaveProperty('kissing');
    expect(result.selectedActions).not.toHaveProperty('spanking');
  });

  it('purges foreplay/sex entries for online soloPlay=true', () => {
    const formData = makeFormData({
      gameMode: 'online',
      soloPlay: true,
      selectedActions: {
        bating: { type: 'solo', levels: [1] },
        kissing: { type: 'foreplay', levels: [1] },
        alcohol: { type: 'consumption', levels: [1] },
      },
    });

    const result = purgedFormData(formData);

    expect(result.selectedActions).toHaveProperty('bating');
    expect(result.selectedActions).toHaveProperty('alcohol');
    expect(result.selectedActions).not.toHaveProperty('kissing');
  });
});

describe('purgedFormData - online group-play (soloPlay=false)', () => {
  it('purges solo/sex entries when clothed (isNaked=false)', () => {
    const formData = makeFormData({
      gameMode: 'online',
      soloPlay: false,
      isNaked: false,
      selectedActions: {
        bating: { type: 'solo', levels: [1] },
        kissing: { type: 'foreplay', levels: [1] },
        spanking: { type: 'sex', levels: [1] },
        alcohol: { type: 'consumption', levels: [1] },
      },
    });

    const result = purgedFormData(formData);

    expect(result.selectedActions).not.toHaveProperty('bating');
    expect(result.selectedActions).not.toHaveProperty('spanking');
    expect(result.selectedActions).toHaveProperty('kissing');
    expect(result.selectedActions).toHaveProperty('alcohol');
  });

  it('purges solo/foreplay entries when naked (isNaked=true)', () => {
    const formData = makeFormData({
      gameMode: 'online',
      soloPlay: false,
      isNaked: true,
      selectedActions: {
        bating: { type: 'solo', levels: [1] },
        kissing: { type: 'foreplay', levels: [1] },
        spanking: { type: 'sex', levels: [1] },
        alcohol: { type: 'consumption', levels: [1] },
      },
    });

    const result = purgedFormData(formData);

    expect(result.selectedActions).not.toHaveProperty('bating');
    expect(result.selectedActions).not.toHaveProperty('kissing');
    expect(result.selectedActions).toHaveProperty('spanking');
    expect(result.selectedActions).toHaveProperty('alcohol');
  });
});

describe('purgedFormData - local modes', () => {
  it('purges solo/sex entries in local clothed mode', () => {
    const formData = makeFormData({
      gameMode: 'local',
      soloPlay: false,
      isNaked: false,
      selectedActions: {
        bating: { type: 'solo', levels: [1] },
        kissing: { type: 'foreplay', levels: [1] },
        spanking: { type: 'sex', levels: [1] },
        alcohol: { type: 'consumption', levels: [1] },
      },
    });

    const result = purgedFormData(formData);

    expect(result.selectedActions).not.toHaveProperty('bating');
    expect(result.selectedActions).not.toHaveProperty('spanking');
    expect(result.selectedActions).toHaveProperty('kissing');
    expect(result.selectedActions).toHaveProperty('alcohol');
  });

  it('purges solo/foreplay entries in local naked mode', () => {
    const formData = makeFormData({
      gameMode: 'local',
      soloPlay: false,
      isNaked: true,
      selectedActions: {
        bating: { type: 'solo', levels: [1] },
        kissing: { type: 'foreplay', levels: [1] },
        spanking: { type: 'sex', levels: [1] },
        alcohol: { type: 'consumption', levels: [1] },
      },
    });

    const result = purgedFormData(formData);

    expect(result.selectedActions).not.toHaveProperty('bating');
    expect(result.selectedActions).not.toHaveProperty('kissing');
    expect(result.selectedActions).toHaveProperty('spanking');
    expect(result.selectedActions).toHaveProperty('alcohol');
  });
});
