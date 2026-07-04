import { describe, it, expect } from 'vitest';
import { spiceBand } from '../SpiceDial';
import { formatLevels } from '../GroupChips';

describe('spiceBand', () => {
  it('always selects at least the lowest level', () => {
    expect(spiceBand('mild', [1, 2, 3])).toEqual([1]);
    expect(spiceBand('mild', [1, 2, 3, 4])).toEqual([1]);
    expect(spiceBand('mild', [1, 2, 3, 4, 5])).toEqual([1]);
  });

  it('scales the band with the ladder size', () => {
    expect(spiceBand('medium', [1, 2, 3, 4])).toEqual([1, 2]);
    expect(spiceBand('medium', [1, 2, 3, 4, 5, 6])).toEqual([1, 2, 3]);
    expect(spiceBand('spicy', [1, 2, 3, 4])).toEqual([1, 2, 3]);
  });

  it('filthy selects the whole ladder', () => {
    expect(spiceBand('filthy', [1, 2, 3])).toEqual([1, 2, 3]);
    expect(spiceBand('filthy', [1, 2, 3, 4, 5, 6])).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('never exceeds the ladder', () => {
    expect(spiceBand('spicy', [1])).toEqual([1]);
    expect(spiceBand('filthy', [1])).toEqual([1]);
    expect(spiceBand('mild', [])).toEqual([]);
  });

  it('returns ACTUAL intensity values for sparse ladders, not 1..k positions', () => {
    // A ladder that skips values (e.g. custom levels 2,4,6,8) must yield real
    // values so downstream board building never selects a phantom level.
    expect(spiceBand('medium', [2, 4, 6, 8])).toEqual([2, 4]);
    expect(spiceBand('mild', [3, 7, 9])).toEqual([3]);
    expect(spiceBand('filthy', [5, 10])).toEqual([5, 10]);
    // Unsorted input is normalized.
    expect(spiceBand('medium', [8, 2, 6, 4])).toEqual([2, 4]);
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
