/**
 * The finish tile's lottery.
 *
 * A finish tile's description is percent-weighted lines ("Label 42%"), and the
 * turn picks one line by weight. Pure but for the injected `pick`, so the
 * weighting is testable without patching a global.
 */
import { randomOf } from '@/services/random';

// Lines look like "Label 42%" (buildGame.ts joins label + percent with a space,
// not a colon) so pull the trailing non-negative number off each line instead of
// splitting on ': '.
const FINISH_LINE_MATCH = /^(.*?)[\s:]+(\d+)$/;

/** Parse "Label 42" lines into [label, weight] pairs, in order. */
export function parseFinishLines(textArray: string[]): Array<[string, string]> {
  return textArray
    .filter((n) => n)
    .map((line) => {
      const match = line.trim().match(FINISH_LINE_MATCH);
      return match
        ? ([match[1], match[2]] as [string, string])
        : ([line.trim(), '0'] as [string, string]);
    });
}

/**
 * Choose one line's label, each line weighted by its percentage. Lines weighted
 * 0 (or unparseable) never win; an all-zero tile yields ''.
 */
export function pickFinishResult(
  textArray: string[],
  pick: <T>(items: readonly T[]) => T | undefined = randomOf
): string {
  const finishValues = parseFinishLines(textArray);

  const weightedIndexes: number[] = [];
  finishValues.forEach(([, percent], index) => {
    const weight = Number(percent);
    if (!weight) return;
    weightedIndexes.push(...Array(weight).fill(index));
  });

  const winner = pick(weightedIndexes);
  return winner === undefined ? '' : finishValues[winner]?.[0] || '';
}
