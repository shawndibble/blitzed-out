export function formatDuration(ms: number): string {
  if (ms < 1000) return '0s';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

export function getMaxDistributionValue(distribution: Record<string | number, number>): number {
  const values = Object.values(distribution);
  return values.length > 0 ? Math.max(...values) : 1;
}

export function getSortedCategories(distribution: Record<string, number>): [string, number][] {
  return Object.entries(distribution).sort(([, a], [, b]) => b - a);
}

export function calculateAverageRoll(sum: number, count: number): string {
  return count > 0 ? (sum / count).toFixed(1) : '0.0';
}

export function calculateAverageGameTime(totalMs: number, gamesCompleted: number): string {
  return gamesCompleted > 0 ? formatDuration(totalMs / gamesCompleted) : '-';
}
