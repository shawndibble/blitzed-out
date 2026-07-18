import { describe, expect, it } from 'vitest';

import {
  DEFAULT_HANDS_FREE_PRESET,
  HANDS_FREE_PRESETS,
  isHandsFreeAvailable,
  resolveHandsFreeRange,
} from '@/helpers/handsFree';

describe('HANDS_FREE_PRESETS', () => {
  it('defines quick, standard, and extended cadences in seconds', () => {
    expect(HANDS_FREE_PRESETS.quick).toEqual({ min: 30, max: 60 });
    expect(HANDS_FREE_PRESETS.standard).toEqual({ min: 60, max: 120 });
    expect(HANDS_FREE_PRESETS.extended).toEqual({ min: 120, max: 300 });
  });
});

describe('isHandsFreeAvailable', () => {
  it('is available for solo topology', () => {
    expect(isHandsFreeAvailable('solo')).toBe(true);
  });

  it('is available for shared device (local) topology', () => {
    expect(isHandsFreeAvailable('local')).toBe(true);
  });

  it('is not available for individual devices (online) topology', () => {
    expect(isHandsFreeAvailable('online')).toBe(false);
  });

  it('is not available when gameMode is missing', () => {
    expect(isHandsFreeAvailable(undefined)).toBe(false);
  });
});

describe('resolveHandsFreeRange', () => {
  it('returns the range for a known preset', () => {
    expect(resolveHandsFreeRange('extended')).toEqual({ min: 120, max: 300 });
  });

  it('falls back to the default preset for unknown values', () => {
    expect(resolveHandsFreeRange(undefined)).toEqual(HANDS_FREE_PRESETS[DEFAULT_HANDS_FREE_PRESET]);
    expect(resolveHandsFreeRange('bogus' as never)).toEqual(
      HANDS_FREE_PRESETS[DEFAULT_HANDS_FREE_PRESET]
    );
  });
});
