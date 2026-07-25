export type SpiceLevel = 'mild' | 'medium' | 'spicy' | 'filthy';

export const SPICE_LEVELS: SpiceLevel[] = ['mild', 'medium', 'spicy', 'filthy'];

/**
 * Map a spice level to a cumulative band of a group's ACTUAL intensity values.
 * Bands scale by percentile so 3-, 4-, 5- and 6-level ladders all get a
 * sensible default. Returns real intensity values (not 1..k positions) so
 * sparse ladders (e.g. [1, 2, 4, 5]) never select phantom levels downstream.
 */
export function spiceBand(spice: SpiceLevel, ladder: number[]): number[] {
  const fractions: Record<SpiceLevel, number> = {
    mild: 0.25,
    medium: 0.5,
    spicy: 0.75,
    filthy: 1,
  };
  const sorted = [...ladder].sort((a, b) => a - b);
  if (sorted.length === 0) return [];
  const top = Math.max(1, Math.round(sorted.length * fractions[spice]));
  return sorted.slice(0, Math.min(top, sorted.length));
}
