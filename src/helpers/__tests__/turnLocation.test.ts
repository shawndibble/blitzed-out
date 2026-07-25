import { describe, expect, it } from 'vitest';
import { isUsableRoll, resolveLocation } from '../turnLocation';

const LAST = 39;

describe('resolveLocation', () => {
  it('advances by the roll', () => {
    expect(resolveLocation({ rollNumber: 4, currentLocation: 10, lastTile: LAST })).toEqual({
      newLocation: 14,
      kind: 'normal',
    });
  });

  it('lands on finish rather than past it', () => {
    expect(resolveLocation({ rollNumber: 6, currentLocation: LAST - 2, lastTile: LAST })).toEqual({
      newLocation: LAST,
      kind: 'normal',
    });
  });

  it('reaches finish exactly', () => {
    expect(resolveLocation({ rollNumber: 2, currentLocation: LAST - 2, lastTile: LAST })).toEqual({
      newLocation: LAST,
      kind: 'normal',
    });
  });

  it('stays on finish once finished, whatever the roll', () => {
    for (const rollNumber of [1, 3, 6, 40]) {
      expect(resolveLocation({ rollNumber, currentLocation: LAST, lastTile: LAST })).toEqual({
        newLocation: LAST,
        kind: 'alreadyFinished',
      });
    }
  });

  it('restarts on -1, even from the finish tile', () => {
    expect(resolveLocation({ rollNumber: -1, currentLocation: LAST, lastTile: LAST })).toEqual({
      newLocation: 0,
      kind: 'restart',
    });
    expect(resolveLocation({ rollNumber: -1, currentLocation: 5, lastTile: LAST })).toEqual({
      newLocation: 0,
      kind: 'restart',
    });
  });

  it('treats an unusable roll as no movement', () => {
    expect(resolveLocation({ rollNumber: NaN, currentLocation: 7, lastTile: LAST })).toEqual({
      newLocation: 0,
      kind: 'normal',
    });
    expect(
      resolveLocation({ rollNumber: 'x' as unknown as number, currentLocation: 7, lastTile: LAST })
    ).toEqual({ newLocation: 0, kind: 'normal' });
  });

  it('treats an unusable current location as the start', () => {
    expect(resolveLocation({ rollNumber: 3, currentLocation: NaN, lastTile: LAST })).toEqual({
      newLocation: 3,
      kind: 'normal',
    });
  });

  it('recognises usable rolls', () => {
    expect(isUsableRoll(0)).toBe(true);
    expect(isUsableRoll(-1)).toBe(true);
    expect(isUsableRoll(NaN)).toBe(false);
    expect(isUsableRoll(undefined)).toBe(false);
    expect(isUsableRoll('3')).toBe(false);
  });
});
