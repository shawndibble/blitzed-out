/**
 * Default-content penetrative classification.
 *
 * The female-dom strapon substitution should fire only when the dom's genital
 * penetrates. For the default groups that use the dom's {genital}, that is an
 * intensity-level property, and the intensity progression aligns by position
 * across all six locales (parallel translations, same ordering):
 *
 *   - buttPlay:       value 2 (fucking), 3 (stretch/large toys — "sits on/rides
 *                     {dom}'s {genital}"). Values 1 (finger/rim) and 4 (fist) use
 *                     no {genital}.
 *   - throatTraining: values 2-4 (genital in mouth → deepthroat). Value 1
 *                     (licking) is surface oral, where real anatomy is coherent.
 *
 * Keyed by group name and intensity `value` (1-based position assigned at import).
 * Tiles in these intensities are tagged `penetrative` at import so render-time
 * anatomy resolution can swap a strapon without per-locale keyword guessing.
 * Custom tiles are not covered here — they fall back to keyword detection or the
 * author's explicit penetrative tag.
 */
export const PENETRATIVE_INTENSITIES: Record<string, number[]> = {
  buttPlay: [2, 3],
  throatTraining: [2, 3, 4],
};

/** Whether a default tile (group + intensity value) should carry the penetrative tag. */
export function isPenetrativeDefaultTile(groupName: string, intensityValue: number): boolean {
  return PENETRATIVE_INTENSITIES[groupName]?.includes(intensityValue) ?? false;
}
