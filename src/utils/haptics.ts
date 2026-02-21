import { haptic } from 'ios-haptics';

export type HapticPattern = 'short' | 'medium' | 'warning';

export function isHapticSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  if ('vibrate' in navigator) return true;
  const userAgent = (navigator as Navigator).userAgent || '';
  if (/iPhone|iPad|iPod/.test(userAgent)) return true;
  return false;
}

export function vibrate(pattern: HapticPattern): void {
  try {
    switch (pattern) {
      case 'short':
        haptic();
        break;
      case 'medium':
        haptic();
        haptic();
        break;
      case 'warning':
        haptic.error();
        break;
    }
  } catch {
    // Haptic not supported or failed - silent fallback
  }
}
