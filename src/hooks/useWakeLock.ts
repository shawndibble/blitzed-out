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
    // Check for browser support
    if (!enabled || !('wakeLock' in navigator)) {
      return;
    }

    const requestWakeLock = async (): Promise<void> => {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch {
        // Wake lock request can fail if:
        // - Page is not visible
        // - System denies the request (low battery, etc.)
        // This is expected behavior, so we fail silently.
      }
    };

    const handleVisibilityChange = (): void => {
      // Re-acquire wake lock when tab becomes visible
      if (document.visibilityState === 'visible' && enabled) {
        requestWakeLock();
      }
    };

    // Initial request
    requestWakeLock();

    // Re-acquire when tab becomes visible again
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Release wake lock on cleanup
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, [enabled]);
}

export default useWakeLock;
