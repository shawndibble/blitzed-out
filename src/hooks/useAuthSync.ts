import { useCallback, useEffect, useRef, useState } from 'react';

import type { User } from '@/types';

export interface SyncStatus {
  syncing: boolean;
  lastSync: Date | null;
}

export function useAuthSync(user: User | null) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ syncing: false, lastSync: null });
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deferTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSync = useCallback(
    async (syncFn: () => Promise<boolean>): Promise<boolean> => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
      if (!user || user.isAnonymous) return false;

      try {
        setSyncStatus((prev) => ({ syncing: true, lastSync: prev.lastSync }));
        await syncFn();
        setSyncStatus({ syncing: false, lastSync: new Date() });
        return true;
      } catch {
        setSyncStatus((prev) => ({ syncing: false, lastSync: prev.lastSync }));
        return false;
      }
    },
    [user]
  );

  const syncData = useCallback(async (): Promise<boolean> => {
    const { syncAllDataToFirebase } = await import('@/services/syncService');
    return performSync(syncAllDataToFirebase);
  }, [performSync]);

  const intelligentSync = useCallback(async (): Promise<{
    success: boolean;
    conflicts?: string[];
  }> => {
    if (!user || user.isAnonymous) {
      return { success: false, conflicts: ['User not logged in or is anonymous'] };
    }
    try {
      setSyncStatus((prev) => ({ syncing: true, lastSync: prev.lastSync }));
      const { intelligentSync: runIntelligentSync } = await import('@/services/syncService');
      const result = await runIntelligentSync();
      setSyncStatus({ syncing: false, lastSync: new Date() });
      return result;
    } catch {
      setSyncStatus((prev) => ({ syncing: false, lastSync: prev.lastSync }));
      return { success: false, conflicts: ['Sync failed due to error'] };
    }
  }, [user]);

  // Start or stop sync lifecycle when user changes
  useEffect(() => {
    if (!user || user.isAnonymous) {
      import('@/services/syncService')
        .then(({ stopPeriodicSync, stopUserDataSubscription }) => {
          stopPeriodicSync();
          stopUserDataSubscription();
        })
        .catch(() => undefined);
      return;
    }

    const deferSync = () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

      syncTimeoutRef.current = setTimeout(async () => {
        setSyncStatus({ syncing: true, lastSync: null });
        try {
          const {
            syncDataFromFirebase,
            syncAllDataToFirebase,
            startPeriodicSync,
            subscribeToUserData,
          } = await import('@/services/syncService');
          await syncDataFromFirebase();
          // One-shot push of the merged union after the initial pull. This uploads
          // local-only content that was never individually pushed (e.g. tiles
          // created while anonymous, before logging into this account). Loop-safe:
          // the entity merges only push back on change, so the resulting snapshot
          // pulls, finds nothing newer, and stops.
          await syncAllDataToFirebase();
          setSyncStatus({ syncing: false, lastSync: new Date() });
          startPeriodicSync();
          // Real-time pull: reflect changes from other devices as they happen.
          subscribeToUserData();
        } catch {
          setSyncStatus({ syncing: false, lastSync: null });
        } finally {
          syncTimeoutRef.current = null;
        }
      }, 3000);
    };

    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(deferSync, { timeout: 10000 });
    } else {
      deferTimeoutRef.current = setTimeout(deferSync, 5000);
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
      if (deferTimeoutRef.current) {
        clearTimeout(deferTimeoutRef.current);
        deferTimeoutRef.current = null;
      }
      import('@/services/syncService')
        .then(({ stopUserDataSubscription }) => stopUserDataSubscription())
        .catch(() => undefined);
    };
  }, [user]);

  return { syncStatus, syncData, intelligentSync };
}
