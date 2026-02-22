import { useEffect, useRef } from 'react';

/**
 * Auto-managing hook for the Screen Wake Lock API.
 * Prevents the device screen from sleeping during active gameplay.
 *
 * Features:
 * - Auto-acquires wake lock when enabled
 * - Auto-releases when disabled or component unmounts
 * - Re-acquires when tab becomes visible again
 * - Gracefully handles unsupported browsers
 *
 * @param enabled - Whether to enable wake lock (default: true)
 */
export function useWakeLock(enabled: boolean = true): void {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) {
      return;
    }

    let active = true;

    const requestWakeLock = async (): Promise<void> => {
      try {
        const sentinel = await navigator.wakeLock.request('screen');
        // Effect may have cleaned up while awaiting the API response
        if (!active) {
          sentinel.release();
          return;
        }
        wakeLockRef.current = sentinel;
      } catch {
        // Expected failures: page not visible, low battery, etc.
      }
    };

    // The Wake Lock API automatically releases locks when the tab loses visibility,
    // so we must re-acquire when the user returns to maintain uninterrupted behavior
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    requestWakeLock();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, [enabled]);
}

export default useWakeLock;
