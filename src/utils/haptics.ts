export type HapticPattern = 'short' | 'medium' | 'warning';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  short: 50,
  medium: 100,
  warning: [100, 50, 100],
};

export function isHapticSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

export function vibrate(pattern: HapticPattern): boolean {
  if (!isHapticSupported()) return false;
  try {
    return navigator.vibrate(PATTERNS[pattern]);
  } catch {
    return false;
  }
}
