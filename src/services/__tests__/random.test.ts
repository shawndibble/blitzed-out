import { afterEach, describe, expect, it } from 'vitest';
import {
  chance,
  nextRandom,
  randomInt,
  randomOf,
  sequenceSource,
  setRandomSource,
} from '../random';

let restore: (() => void) | undefined;

afterEach(() => {
  restore?.();
  restore = undefined;
});

describe('random seam', () => {
  it('draws from the installed source, in order', () => {
    restore = setRandomSource(sequenceSource([0.1, 0.5, 0.9]));

    expect(nextRandom()).toBeCloseTo(0.1);
    expect(nextRandom()).toBeCloseTo(0.5);
    expect(nextRandom()).toBeCloseTo(0.9);
    // Exhausted sequences repeat their last value rather than returning undefined.
    expect(nextRandom()).toBeCloseTo(0.9);
  });

  it('restores the previous source', () => {
    const undo = setRandomSource(() => 0.42);
    expect(nextRandom()).toBe(0.42);
    undo();
    const value = nextRandom();
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
  });

  it('randomInt covers both ends of the range inclusively', () => {
    restore = setRandomSource(sequenceSource([0, 0.999999]));
    expect(randomInt(1, 6)).toBe(1);
    expect(randomInt(1, 6)).toBe(6);
  });

  it('randomOf picks by position and handles an empty list', () => {
    restore = setRandomSource(sequenceSource([0, 0.5, 0.999999]));
    const items = ['a', 'b', 'c'];
    expect(randomOf(items)).toBe('a');
    expect(randomOf(items)).toBe('b');
    expect(randomOf(items)).toBe('c');
    expect(randomOf([])).toBeUndefined();
  });

  it('chance is an even coin-flip by default, and honours a probability', () => {
    restore = setRandomSource(sequenceSource([0.49, 0.5, 0.09, 0.11]));
    expect(chance()).toBe(true);
    expect(chance()).toBe(false);
    expect(chance(0.1)).toBe(true);
    expect(chance(0.1)).toBe(false);
  });
});
