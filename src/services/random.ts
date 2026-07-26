/**
 * The one seam for randomness in the domain.
 *
 * Every probabilistic rule the game has — the dice roll, the vers coin-flip, the
 * finish-tile lottery, picking who a tile targets — used to call `Math.random()`
 * inline, so the only way to test any of them was to patch a global. Rules route
 * through here instead, and tests replace the source.
 */
export type RandomSource = () => number;

/**
 * Drawn from the platform CSPRNG rather than `Math.random`. Gameplay does not
 * need cryptographic strength, but this file is the single source for every
 * random value in the app, and one of its consumers substitutes text the scanner
 * reads as a security context (`js/insecure-randomness`). A uniform draw from
 * `getRandomValues` costs nothing here and keeps the seam above suspicion.
 */
function platformRandom(): number {
  const buffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buffer);
  // 2**32 divisor keeps the result in [0, 1), matching Math.random's range.
  return buffer[0] / 4_294_967_296;
}

let source: RandomSource = platformRandom;

/** A float in [0, 1). */
export function nextRandom(): number {
  return source();
}

/** An integer in [min, max], inclusive. */
export function randomInt(min: number, max: number): number {
  return Math.floor(nextRandom() * (max - min + 1)) + min;
}

/** A uniformly chosen member, or `undefined` for an empty list. */
export function randomOf<T>(items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(nextRandom() * items.length)];
}

/** True with probability `p` (default an even coin-flip). */
export function chance(p = 0.5): boolean {
  return nextRandom() < p;
}

/** Test seam: install a deterministic source. Returns a restore function. */
export function setRandomSource(next: RandomSource): () => void {
  const previous = source;
  source = next;
  return () => {
    source = previous;
  };
}

/** Test seam: hand back the values in order, then repeat the last one. */
export function sequenceSource(values: readonly number[]): RandomSource {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)] ?? 0;
}
