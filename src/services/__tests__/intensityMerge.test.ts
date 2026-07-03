import { describe, it, expect } from 'vitest';
import {
  appendIntensities,
  mergeSeedIntensities,
  extensionIntensityId,
} from '@/services/intensityMerge';
import type { CustomGroupIntensity } from '@/types/customGroups';

const ladder = (values: number[], isDefault = true): CustomGroupIntensity[] =>
  values.map((value) => ({
    id: `g-${value}`,
    label: `Level ${value}`,
    value,
    isDefault,
  }));

describe('appendIntensities', () => {
  it('appends new levels with isDefault false and deterministic ids', () => {
    const result = appendIntensities(ladder([1, 2, 3, 4]), [{ value: 5, label: 'Extreme' }], 'ballBusting');

    expect(result.added).toEqual([
      { id: 'ballBusting-ext-5', label: 'Extreme', value: 5, isDefault: false },
    ]);
    expect(result.merged).toHaveLength(5);
    expect(result.skipped).toEqual([]);
  });

  it('never mutates or removes existing entries', () => {
    const existing = ladder([1, 2]);
    const snapshot = JSON.parse(JSON.stringify(existing));
    const result = appendIntensities(existing, [{ value: 3, label: 'New' }], 'g');

    expect(existing).toEqual(snapshot);
    expect(result.merged.slice(0, 2)).toEqual(snapshot);
  });

  it('skips duplicate values (idempotent re-import)', () => {
    const existing = [...ladder([1, 2]), ...ladder([3], false)];
    const result = appendIntensities(existing, [{ value: 3, label: 'Again' }], 'g');

    expect(result.added).toEqual([]);
    expect(result.skipped).toEqual([{ value: 3, reason: 'duplicate' }]);
    expect(result.merged).toEqual([...existing].sort((a, b) => a.value - b.value));
  });

  it('skips out-of-range and non-integer values', () => {
    const result = appendIntensities(ladder([1]), [
      { value: 0, label: 'Zero' },
      { value: 11, label: 'Eleven' },
      { value: 2.5, label: 'Half' },
    ], 'g');

    expect(result.added).toEqual([]);
    expect(result.skipped.map((s) => s.reason)).toEqual(['outOfRange', 'outOfRange', 'outOfRange']);
  });

  it('enforces the 10-level cap, keeping lowest additions first', () => {
    const result = appendIntensities(ladder([1, 2, 3, 4, 5, 6, 7, 8]), [
      { value: 10, label: 'Ten' },
      { value: 9, label: 'Nine' },
    ], 'g');

    expect(result.added.map((i) => i.value)).toEqual([9, 10]);

    const overCap = appendIntensities(ladder([1, 2, 3, 4, 5, 6, 7, 8, 9]), [
      { value: 10, label: 'Ten' },
    ], 'g');
    expect(overCap.added.map((i) => i.value)).toEqual([10]);

    const full = appendIntensities(ladder([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].slice(0, 10)), [
      { value: 10, label: 'Ten' },
    ], 'g');
    expect(full.added).toEqual([]);
    expect(full.skipped[0].reason).toBe('duplicate');
  });

  it('returns merged ladder sorted by value', () => {
    const result = appendIntensities(ladder([2, 4]), [
      { value: 1, label: 'One' },
      { value: 3, label: 'Three' },
    ], 'g');
    expect(result.merged.map((i) => i.value)).toEqual([1, 2, 3, 4]);
  });
});

describe('mergeSeedIntensities', () => {
  it('returns bundle ladder when nothing exists', () => {
    const bundle = ladder([1, 2, 3]);
    expect(mergeSeedIntensities(bundle, undefined)).toBe(bundle);
    expect(mergeSeedIntensities(bundle, [])).toBe(bundle);
  });

  it('preserves user-appended (non-default) intensities across re-seed', () => {
    const bundle = ladder([1, 2, 3, 4]);
    const existing = [...ladder([1, 2, 3, 4]), ...ladder([5], false)];

    const merged = mergeSeedIntensities(bundle, existing);
    expect(merged.map((i) => i.value)).toEqual([1, 2, 3, 4, 5]);
    expect(merged.find((i) => i.value === 5)?.isDefault).toBe(false);
  });

  it('drops custom entry when bundle claims its value (bundle wins)', () => {
    const bundle = ladder([1, 2, 3, 4, 5]);
    const existing = [...ladder([1, 2, 3, 4]), ...ladder([5], false)];

    const merged = mergeSeedIntensities(bundle, existing);
    expect(merged).toHaveLength(5);
    expect(merged.find((i) => i.value === 5)?.isDefault).toBe(true);
  });

  it('discards stale default entries not in the new bundle', () => {
    const bundle = ladder([1, 2, 3]);
    const existing = ladder([1, 2, 3, 4]);

    const merged = mergeSeedIntensities(bundle, existing);
    expect(merged.map((i) => i.value)).toEqual([1, 2, 3]);
  });
});

describe('extensionIntensityId', () => {
  it('is deterministic per group/value', () => {
    expect(extensionIntensityId('ballBusting', 5)).toBe('ballBusting-ext-5');
  });
});
