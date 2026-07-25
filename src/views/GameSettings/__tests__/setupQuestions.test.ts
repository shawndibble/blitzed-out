import { describe, expect, it } from 'vitest';

import { carrySelectedActions, deriveSetupAnswers, resolveSetupAnswers } from '../setupQuestions';

describe('deriveSetupAnswers', () => {
  it('reads Shared Device as several-of-us', () => {
    expect(deriveSetupAnswers('local', 'ABC12')).toEqual({
      device: 'several',
      company: 'friends',
    });
  });

  it('reads Solo in PUBLIC as just-me alongside strangers', () => {
    expect(deriveSetupAnswers('solo', 'PUBLIC')).toEqual({
      device: 'justMe',
      company: 'strangers',
    });
  });

  it('treats a lowercase public room as PUBLIC', () => {
    expect(deriveSetupAnswers('solo', 'public').company).toBe('strangers');
  });

  it('reads Solo in a private room as just-me with no one', () => {
    expect(deriveSetupAnswers('solo', 'ABC12')).toEqual({
      device: 'justMe',
      company: 'noOne',
    });
  });

  it('reads Individual Devices as just-me with friends', () => {
    expect(deriveSetupAnswers('online', 'ABC12')).toEqual({
      device: 'justMe',
      company: 'friends',
    });
  });

  it('defaults a missing gameMode to solo', () => {
    expect(deriveSetupAnswers(undefined, 'PUBLIC')).toEqual({
      device: 'justMe',
      company: 'strangers',
    });
  });
});

describe('resolveSetupAnswers', () => {
  const getPrivateRoom = () => 'NEW01';

  it('several-of-us derives local in a private room', () => {
    expect(
      resolveSetupAnswers({ device: 'several', company: 'friends' }, 'PUBLIC', getPrivateRoom)
    ).toEqual({ gameMode: 'local', room: 'NEW01' });
  });

  it('never puts several-of-us in PUBLIC, whatever the company answer', () => {
    expect(
      resolveSetupAnswers({ device: 'several', company: 'strangers' }, 'PUBLIC', getPrivateRoom)
        .room
    ).toBe('NEW01');
  });

  it('just-me + strangers derives solo in PUBLIC', () => {
    expect(
      resolveSetupAnswers({ device: 'justMe', company: 'strangers' }, 'ABC12', getPrivateRoom)
    ).toEqual({ gameMode: 'solo', room: 'PUBLIC' });
  });

  it('just-me + no one derives solo in a private room', () => {
    expect(
      resolveSetupAnswers({ device: 'justMe', company: 'noOne' }, 'PUBLIC', getPrivateRoom)
    ).toEqual({ gameMode: 'solo', room: 'NEW01' });
  });

  it('just-me + friends derives online in a private room', () => {
    expect(
      resolveSetupAnswers({ device: 'justMe', company: 'friends' }, 'PUBLIC', getPrivateRoom)
    ).toEqual({ gameMode: 'online', room: 'NEW01' });
  });

  it('keeps the current private room rather than minting a new code', () => {
    expect(
      resolveSetupAnswers({ device: 'justMe', company: 'friends' }, 'KEEP1', getPrivateRoom).room
    ).toBe('KEEP1');
  });

  it('never derives online in PUBLIC — the invariant PUBLIC is Solo-only', () => {
    const result = resolveSetupAnswers(
      { device: 'justMe', company: 'friends' },
      'PUBLIC',
      getPrivateRoom
    );
    expect(result.gameMode).toBe('online');
    expect(result.room).not.toBe('PUBLIC');
  });
});

describe('carrySelectedActions', () => {
  // Mirrors the real bundles: `bating` is a solo group online and a sex group
  // locally, same label. `kissing` exists only in the local (partnered) set.
  const soloCatalog = {
    bating: { type: 'solo', intensities: { 1: 'a', 2: 'b', 3: 'c' } },
    clitTraining: { type: 'solo', intensities: { 1: 'a', 2: 'b', 3: 'c', 4: 'd' } },
    poppers: { type: 'consumption', intensities: { 1: 'a', 2: 'b' } },
  };
  const partneredCatalog = {
    bating: { type: 'sex', intensities: { 1: 'a', 2: 'b', 3: 'c' } },
    clitTraining: { type: 'sex', intensities: { 1: 'a', 2: 'b', 3: 'c', 4: 'd', 5: 'e' } },
    poppers: { type: 'consumption', intensities: { 1: 'a', 2: 'b' } },
    kissing: { type: 'foreplay', intensities: { 1: 'a' } },
  };

  it('carries a group that exists in the target catalog', () => {
    const { kept, droppedKeys } = carrySelectedActions(
      { bating: { type: 'solo', levels: [2] } },
      partneredCatalog
    );
    expect(droppedKeys).toEqual([]);
    expect(kept.bating.levels).toEqual([2]);
  });

  it('retypes the carried group to the target catalog type', () => {
    const { kept } = carrySelectedActions(
      { bating: { type: 'solo', levels: [1] } },
      partneredCatalog
    );
    expect(kept.bating.type).toBe('sex');
  });

  it('drops a group with no counterpart in the target catalog', () => {
    const { kept, droppedKeys } = carrySelectedActions(
      { bating: { type: 'sex', levels: [1] }, kissing: { type: 'foreplay', levels: [1] } },
      soloCatalog
    );
    expect(droppedKeys).toEqual(['kissing']);
    expect(Object.keys(kept)).toEqual(['bating']);
  });

  it('clamps a level above the target group maximum', () => {
    const { kept } = carrySelectedActions(
      { clitTraining: { type: 'sex', levels: [5] } },
      soloCatalog
    );
    expect(kept.clitTraining.levels).toEqual([4]);
  });

  it('leaves levels alone when the target offers at least as many', () => {
    const { kept } = carrySelectedActions(
      { clitTraining: { type: 'solo', levels: [1, 4] } },
      partneredCatalog
    );
    expect(kept.clitTraining.levels).toEqual([1, 4]);
  });

  it('dedupes levels that collapse onto each other after clamping', () => {
    const { kept } = carrySelectedActions(
      { clitTraining: { type: 'sex', levels: [4, 5] } },
      soloCatalog
    );
    expect(kept.clitTraining.levels).toEqual([4]);
  });

  it('preserves unrelated entry fields such as role and variation', () => {
    const { kept } = carrySelectedActions(
      { bating: { type: 'solo', levels: [1], role: 'sub', variation: 'appendMost' } },
      partneredCatalog
    );
    expect(kept.bating.role).toBe('sub');
    expect(kept.bating.variation).toBe('appendMost');
  });

  it('returns nothing to drop for an empty selection', () => {
    expect(carrySelectedActions({}, partneredCatalog)).toEqual({ kept: {}, droppedKeys: [] });
  });

  it('drops everything when the target catalog has not loaded yet', () => {
    // Guards the async reload: an empty catalog must not be read as "nothing
    // matches" and silently wipe the user's picks — callers wait for the real
    // catalog, so this only documents the pure function's contract.
    const { droppedKeys } = carrySelectedActions({ bating: { type: 'solo' } }, {});
    expect(droppedKeys).toEqual(['bating']);
  });
});
