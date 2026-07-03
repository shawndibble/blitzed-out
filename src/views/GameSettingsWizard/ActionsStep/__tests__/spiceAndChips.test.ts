import { describe, it, expect } from 'vitest';
import { spiceBand } from '../SpiceDial';
import { formatLevels } from '../GroupChips';

describe('spiceBand', () => {
  it('always selects at least level 1', () => {
    expect(spiceBand('mild', 3)).toEqual([1]);
    expect(spiceBand('mild', 4)).toEqual([1]);
    expect(spiceBand('mild', 5)).toEqual([1]);
  });

  it('scales the band with the ladder size', () => {
    expect(spiceBand('medium', 4)).toEqual([1, 2]);
    expect(spiceBand('medium', 6)).toEqual([1, 2, 3]);
    expect(spiceBand('spicy', 4)).toEqual([1, 2, 3]);
  });

  it('filthy selects the whole ladder', () => {
    expect(spiceBand('filthy', 3)).toEqual([1, 2, 3]);
    expect(spiceBand('filthy', 6)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('never exceeds the ladder', () => {
    expect(spiceBand('spicy', 1)).toEqual([1]);
    expect(spiceBand('filthy', 1)).toEqual([1]);
  });
});

describe('formatLevels', () => {
  it('formats single, contiguous, and sparse selections', () => {
    expect(formatLevels([2])).toBe('2');
    expect(formatLevels([1, 2, 3])).toBe('1–3');
    expect(formatLevels([1, 3])).toBe('1,3');
    expect(formatLevels([3, 1, 2])).toBe('1–3');
    expect(formatLevels([])).toBe('');
  });
});
