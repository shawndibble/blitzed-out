/** Compact human summary of a level selection: [1,2,3] → "1–3", [1,3] → "1,3". */
export function formatLevels(levels: number[]): string {
  if (!levels.length) return '';
  const sorted = [...levels].sort((a, b) => a - b);
  const isContiguous = sorted.every((lvl, i) => i === 0 || lvl === sorted[i - 1] + 1);
  if (sorted.length === 1) return String(sorted[0]);
  if (isContiguous) return `${sorted[0]}–${sorted[sorted.length - 1]}`;
  return sorted.join(',');
}
