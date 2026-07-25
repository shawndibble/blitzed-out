/**
 * Account-scoped cloud sync: the public entry points the app calls.
 *
 * The `user-data/{uid}` document itself is owned by `sync/remoteUserData.ts` —
 * one read and one write per cycle. This file decides *when* a cycle runs (login
 * push, pull, periodic, real-time listener); the merge policy lives in
 * `sync/*Sync.ts` and the encoding in the owner.
 */
import { doc, getFirestore, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { beginSyncApply, endSyncApply } from './syncMiddleware';
import { collectLocalUserData, writeRemoteUserData } from './sync/remoteUserData';
import { cleanupDuplicateTiles, clearUserCustomGroups } from './sync/localCleanup';

const db = getFirestore();

export { cleanupDuplicateTiles, clearUserCustomGroups };
export { deleteAllCustomTiles } from './sync/localCleanup';

/**
 * Publish this device's whole snapshot in one write. Every push path funnels
 * here: there is no per-entity push, so a cycle can never leave the document
 * half-updated.
 */
export async function syncAllDataToFirebase(): Promise<boolean> {
  const user = getAuth().currentUser;

  if (!user) {
    console.error('No user logged in');
    return false;
  }

  try {
    await writeRemoteUserData(user.uid, await collectLocalUserData());
    return true;
  } catch (error) {
    console.error('Error syncing data to Firebase:', error);
    return false;
  }
}

// Enhanced sync with conflict resolution - preserves local data when Firebase is empty
export async function syncDataFromFirebase(
  options: { forceSync?: boolean } = {}
): Promise<boolean> {
  const { SyncOrchestrator } = await import('./sync/syncOrchestrator');
  // Suppress the sync middleware while applying remote changes so the writes
  // below don't schedule an echo push back to Firebase.
  beginSyncApply();
  try {
    return await SyncOrchestrator.syncFromFirebase(options);
  } finally {
    endSyncApply();
  }
}

// Real-time listener over the per-user Firestore document. Pulls remote changes
// into Dexie as they happen, instead of waiting for the periodic/debounced sync.
let userDataUnsubscribe: (() => void) | null = null;

export function stopUserDataSubscription(): void {
  if (userDataUnsubscribe) {
    userDataUnsubscribe();
    userDataUnsubscribe = null;
  }
}

export function subscribeToUserData(): () => void {
  const auth = getAuth();
  const user = auth.currentUser;

  // Anonymous users don't cloud-sync; nothing to subscribe to.
  if (!user || user.isAnonymous) {
    return () => undefined;
  }

  stopUserDataSubscription();

  const userDocRef = doc(db, 'user-data', user.uid);
  userDataUnsubscribe = onSnapshot(
    userDocRef,
    (snapshot) => {
      // Skip our own just-written changes — applying them would loop.
      if (snapshot.metadata.hasPendingWrites) return;
      if (!snapshot.exists()) return;
      // Re-read + merge through the orchestrator (served from local cache).
      void syncDataFromFirebase();
    },
    (error) => {
      console.error('Real-time user-data sync error:', error);
    }
  );

  return stopUserDataSubscription;
}

// Variable to store the interval ID for periodic syncing
let syncIntervalId: number | null = null;

// Start periodic syncing from Firebase (every 5 minutes)
export function startPeriodicSync(intervalMinutes = 5): boolean {
  // Clear any existing interval first
  stopPeriodicSync();

  const intervalMs = intervalMinutes * 60 * 1000;

  syncIntervalId = window.setInterval(async () => {
    const auth = getAuth();
    if (auth.currentUser && !auth.currentUser.isAnonymous) {
      await syncDataFromFirebase();
    }
  }, intervalMs);

  return true;
}

// Stop periodic syncing
export function stopPeriodicSync(): boolean {
  if (syncIntervalId) {
    window.clearInterval(syncIntervalId);
    syncIntervalId = null;
    return true;
  }
  return false;
}

// Check if periodic sync is active
export function isPeriodicSyncActive(): boolean {
  return syncIntervalId !== null;
}

// Manual cleanup function that can be called from console for immediate cleanup
(window as any).cleanupTiles = cleanupDuplicateTiles;
