import { describe, expect, it } from 'vitest';

import { importActionFile } from '../importOperations';
import { isPenetrativeDefaultTile, PENETRATIVE_INTENSITIES } from '../penetrativeIntensities';

describe('penetrative intensity manifest', () => {
  it('classifies buttPlay fucking/stretch (values 2,3) as penetrative', () => {
    expect(isPenetrativeDefaultTile('buttPlay', 2)).toBe(true);
    expect(isPenetrativeDefaultTile('buttPlay', 3)).toBe(true);
    expect(isPenetrativeDefaultTile('buttPlay', 1)).toBe(false);
    expect(isPenetrativeDefaultTile('buttPlay', 4)).toBe(false);
  });

  it('classifies throatTraining values 2-4 as penetrative, licking (1) as not', () => {
    expect(isPenetrativeDefaultTile('throatTraining', 1)).toBe(false);
    [2, 3, 4].forEach((v) => expect(isPenetrativeDefaultTile('throatTraining', v)).toBe(true));
  });

  it('treats unlisted groups (e.g. bating, clitTraining) as never penetrative', () => {
    expect(isPenetrativeDefaultTile('bating', 2)).toBe(false);
    expect(isPenetrativeDefaultTile('clitTraining', 3)).toBe(false);
    expect(PENETRATIVE_INTENSITIES.bating).toBeUndefined();
  });
});

describe('importActionFile penetrative tagging (real en/local bundle)', () => {
  it('tags buttPlay penetrative-intensity tiles and leaves finger/rim untagged', async () => {
    const result = await importActionFile('buttPlay', 'en', 'local');
    expect(result).not.toBeNull();
    const tiles = result!.customTiles;

    const penetrativeTiles = tiles.filter((t) => t.tags.includes('penetrative'));
    expect(penetrativeTiles.length).toBeGreaterThan(0);
    // Every penetrative-tagged tile must be in a manifest intensity (2 or 3).
    penetrativeTiles.forEach((t) => expect([2, 3]).toContain(t.intensity));
    // Intensity 1 (finger/rim) tiles must never be tagged penetrative.
    tiles
      .filter((t) => t.intensity === 1)
      .forEach((t) => expect(t.tags).not.toContain('penetrative'));
  });

  it('never tags bating tiles penetrative', async () => {
    const result = await importActionFile('bating', 'en', 'local');
    expect(result).not.toBeNull();
    result!.customTiles.forEach((t) => expect(t.tags).not.toContain('penetrative'));
  });
});
