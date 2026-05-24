import type { User } from '@/types';

interface SyncProvider {
  user: User | null;
  syncData: () => Promise<boolean>;
}

let activeProvider: SyncProvider | null = null;

/**
 * Called by AuthProvider. Returns cleanup fn suitable as useEffect return value.
 * Requires user AND syncData together to prevent partial registration.
 */
export function registerSyncProvider(provider: SyncProvider): () => void {
  activeProvider = provider;
  return () => {
    activeProvider = null;
  };
}

/**
 * Called by syncMiddleware. No-op when no provider or user is anonymous/null.
 * Never throws.
 */
export function requestSync(): void {
  if (!activeProvider?.user || activeProvider.user.isAnonymous) return;

  try {
    void activeProvider.syncData().catch(() => undefined);
  } catch {
    // Keep Dexie middleware independent from sync failures.
  }
}

// Test escape hatch - never call in production code.
export function __resetForTesting(): void {
  activeProvider = null;
}
