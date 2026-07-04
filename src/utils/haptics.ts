export type HapticPattern = 'short' | 'medium' | 'warning';

const VIBRATION_PATTERNS: Record<HapticPattern, number[]> = {
  short: [50],
  medium: [50, 70, 50],
  warning: [50, 70, 50, 70, 50],
};

export function isHapticSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  if ('vibrate' in navigator) return true;
  const userAgent = (navigator as Navigator).userAgent || '';
  if (/iPhone|iPad|iPod/.test(userAgent)) return true;
  return false;
}

// Safari 17.4–26.4 fires native haptic feedback when a switch-style checkbox
// toggles; Apple removed this in iOS 26.5, so this is best-effort only.
function triggerIosHaptic(): void {
  const label = document.createElement('label');
  label.ariaHidden = 'true';
  label.style.display = 'none';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  label.appendChild(input);
  document.head.appendChild(label);
  label.click();
  document.head.removeChild(label);
}

export function vibrate(pattern: HapticPattern): void {
  try {
    if (typeof navigator === 'undefined') return;
    const sequence = VIBRATION_PATTERNS[pattern];
    if (navigator.vibrate) {
      navigator.vibrate(sequence);
      return;
    }
    if (!isHapticSupported()) return;
    const pulses = Math.ceil(sequence.length / 2);
    for (let i = 0; i < pulses; i++) {
      setTimeout(triggerIosHaptic, i * 120);
    }
  } catch {
    // Haptic not supported or failed - silent fallback
  }
}
