import { describe, expect, it } from 'vitest';
import { deriveParticipationContentMode, usesSoloActions } from '../strings';

describe('usesSoloActions', () => {
  it('is always true for solo topology', () => {
    expect(usesSoloActions('solo', false)).toBe(true);
    expect(usesSoloActions('solo', true)).toBe(true);
    expect(usesSoloActions('solo', undefined)).toBe(true);
  });

  it('for online topology, follows soloPlay (default true when unset)', () => {
    expect(usesSoloActions('online', undefined)).toBe(true);
    expect(usesSoloActions('online', true)).toBe(true);
    expect(usesSoloActions('online', false)).toBe(false);
  });

  it('is always false for local (Shared Device) topology', () => {
    expect(usesSoloActions('local', true)).toBe(false);
    expect(usesSoloActions('local', false)).toBe(false);
  });
});

describe('deriveParticipationContentMode', () => {
  it('resolves to online for solo topology', () => {
    expect(deriveParticipationContentMode('solo', undefined)).toBe('online');
  });

  it('resolves to online for online topology with soloPlay unset or true', () => {
    expect(deriveParticipationContentMode('online', undefined)).toBe('online');
    expect(deriveParticipationContentMode('online', true)).toBe('online');
  });

  it('resolves to local for "With Others" (online + soloPlay:false)', () => {
    expect(deriveParticipationContentMode('online', false)).toBe('local');
  });

  it('resolves to local for Shared Device topology regardless of soloPlay', () => {
    expect(deriveParticipationContentMode('local', true)).toBe('local');
    expect(deriveParticipationContentMode('local', false)).toBe('local');
  });
});
