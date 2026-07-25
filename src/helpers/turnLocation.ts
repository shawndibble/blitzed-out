/**
 * Where a roll lands, as a pure rule.
 *
 * No React, no i18n, no I/O: given the roll, where the player stands and where
 * the board ends, this decides the turn's destination and its kind. The caller
 * owns the wording for each kind.
 */
import type { TurnFields } from '@/types/Message';

export interface RollResolution {
  newLocation: number;
  kind: TurnFields['kind'];
}

export interface RollInput {
  /** The dice value; -1 restarts the game. */
  rollNumber: number;
  /** Where the player stands before this roll. */
  currentLocation: number;
  /** Index of the final tile. */
  lastTile: number;
}

/** A roll the board cannot interpret leaves the player where they are. */
export function isUsableRoll(rollNumber: unknown): rollNumber is number {
  return typeof rollNumber === 'number' && !Number.isNaN(rollNumber);
}

export function resolveLocation({
  rollNumber,
  currentLocation,
  lastTile,
}: RollInput): RollResolution {
  if (!isUsableRoll(rollNumber)) {
    return { newLocation: 0, kind: 'normal' };
  }

  if (rollNumber === -1) {
    return { newLocation: 0, kind: 'restart' };
  }

  const from = isUsableRoll(currentLocation) ? currentLocation : 0;

  // Already home: stay put whatever the roll says (restart with -1 instead), so
  // a later roll can neither move backwards nor re-trigger the finish.
  if (from === lastTile) {
    return { newLocation: lastTile, kind: 'alreadyFinished' };
  }

  const newLocation = from + rollNumber;
  // Overshooting finish lands on finish rather than off the board.
  return { newLocation: newLocation >= lastTile ? lastTile : newLocation, kind: 'normal' };
}
