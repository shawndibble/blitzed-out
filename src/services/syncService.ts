import {
  deleteAllIsCustomTiles,
  deleteCustomTile,
  getTiles,
  updateCustomTile,
} from '@/stores/customTiles';
import { deleteCustomGroup, getCustomGroups } from '@/stores/customGroups';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';

import { CustomGroupPull } from '@/types/customGroups';
import { CustomTilePull } from '@/types/customTiles';
import { getAuth } from 'firebase/auth';
import { getBoards } from '@/stores/gameBoard';
import { getFirestore } from 'firebase/firestore';
import { useSettingsStore } from '@/stores/settingsStore';
import { beginSyncApply, endSyncApply } from './syncMiddleware';

// Updated to use inline type instead of separate interface to avoid unused warning

const db = getFirestore();

// Export function for sync modules (avoid naming conflict with import)
export const deleteAllCustomTiles = deleteAllIsCustomTiles;

// Helper function to clean up ALL duplicate tiles created by sync bug
export async function cleanupDuplicateTiles(): Promise<boolean> {
  try {
    // Get all tiles to analyze duplicates
    const allTiles = await getTiles({});

    // Group tiles by composite key to find duplicates
    const tileGroups = new Map<string, typeof allTiles>();

    allTiles.forEach((tile) => {
      const key = `${tile.group_id}|${tile.intensity}|${tile.action}`;
      if (!tileGroups.has(key)) {
        tileGroups.set(key, []);
      }
      tileGroups.get(key)!.push(tile);
    });

    // For each group, keep only the original (lowest ID) and remove ALL duplicates
    for (const [, tiles] of tileGroups) {
      if (tiles.length > 1) {
        // Sort by ID to find original (lowest ID)
        tiles.sort((a, b) => (a.id || 0) - (b.id || 0));
        const original = tiles[0];
        const duplicates = tiles.slice(1);

        // Check if any duplicate was disabled (user's intent)
        const wasDisabled = duplicates.some((tile) => tile.isEnabled === 0);

        // Delete ALL duplicates regardless of enabled state
        for (const duplicate of duplicates) {
          if (duplicate.id) {
            await deleteCustomTile(duplicate.id);
          }
        }

        // If any duplicate was disabled, disable the original (preserve user intent)
        if (wasDisabled && original.isEnabled === 1) {
          await updateCustomTile(original.id!, { isEnabled: 0 });
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error cleaning up duplicate tiles:', error);
    return false;
  }
}

// Helper function to clear only user-created custom groups (preserve default groups)
export async function clearUserCustomGroups(): Promise<boolean> {
  try {
    const userGroups = await getCustomGroups({ isDefault: false });

    // Convert serial deleteCustomGroup calls to concurrent operations
    const deletePromises = userGroups.map((group) => deleteCustomGroup(group.id));
    await Promise.all(deletePromises);

    return true;
  } catch (error) {
    console.error('Error deleting user custom groups:', error);
    return false;
  }
}

// Old clients read a flat `disabledDefaults` array (no tombstones) and skip it
// entirely when it exceeds 100, so we best-effort cap the legacy field there.
const LEGACY_DISABLED_CAP = 100;
// The full record set (incl. tombstones) shares the single ~1 MiB `user-data`
// doc with tiles/groups/boards/settings, so it must stay bounded. Genuine usage
// is small; exceeding this signals corruption — drop loudly, never silently.
const DISABLED_V2_MAX = 1000;

// Sync custom tiles to Firebase (user-created content only).
export async function syncCustomTilesToFirebase(): Promise<boolean> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error('No user logged in');
    return false;
  }

  try {
    const customTiles = await getTiles({ isCustom: 1 });

    await setDoc(
      doc(db, 'user-data', user.uid),
      {
        customTiles,
        lastUpdated: new Date(),
      },
      { merge: true }
    );

    return true;
  } catch (error) {
    console.error('Error syncing custom tiles:', error);
    return false;
  }
}

// Sync disabled defaults to Firebase. Writes two fields into the shared user
// doc: `disabledDefaultsV2` (full per-record set with tombstones + updatedAt,
// the source of truth for new clients) and a legacy `disabledDefaults` array
// (active-only, capped) so pre-V2 clients still converge.
export async function syncDisabledDefaultsToFirebase(): Promise<boolean> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error('No user logged in');
    return false;
  }

  try {
    const { getAllDisabledRecords } = await import('@/stores/disabledDefaults');
    let records = await getAllDisabledRecords();

    if (records.length > DISABLED_V2_MAX) {
      const dropped = records.length - DISABLED_V2_MAX;
      console.warn(
        `⚠️ ${records.length} disabled-default records exceeds the ${DISABLED_V2_MAX} cap; ` +
          `dropping ${dropped} from sync. This likely indicates corrupted local data.`
      );
      records = records.slice(0, DISABLED_V2_MAX);
    }

    // Legacy array: active-only, in the shape old clients expect.
    const legacyActive = records
      .filter((r) => r.active)
      .map((r) => ({ group_id: r.group_id, intensity: r.intensity, action: r.action }));
    if (legacyActive.length > LEGACY_DISABLED_CAP) {
      legacyActive.splice(LEGACY_DISABLED_CAP);
    }

    await setDoc(
      doc(db, 'user-data', user.uid),
      {
        disabledDefaults: legacyActive,
        disabledDefaultsV2: records,
        lastUpdated: new Date(),
      },
      { merge: true }
    );

    return true;
  } catch (error) {
    console.error('Error syncing disabled defaults:', error);
    return false;
  }
}

// Sync only user-created custom groups to Firebase (NOT default groups)
export async function syncCustomGroupsToFirebase(): Promise<boolean> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error('No user logged in');
    return false;
  }

  try {
    // Get only user-created custom groups (not default groups)
    const customGroups = await getCustomGroups({ isDefault: false });

    // Create a document in Firebase with only user-created custom groups
    await setDoc(
      doc(db, 'user-data', user.uid),
      {
        customGroups,
        lastUpdated: new Date(),
      },
      { merge: true }
    );

    return true;
  } catch (error) {
    console.error('Error syncing custom groups:', error);
    return false;
  }
}

// Sync user-appended intensity levels on default groups (small deltas; default
// groups themselves never sync — each device seeds them locally).
export async function syncGroupExtensionsToFirebase(): Promise<boolean> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error('No user logged in');
    return false;
  }

  try {
    const { collectGroupExtensionRecords } = await import('./sync/customGroupExtensionsSync');
    const customGroupExtensions = await collectGroupExtensionRecords();

    await setDoc(
      doc(db, 'user-data', user.uid),
      {
        customGroupExtensions,
        lastUpdated: new Date(),
      },
      { merge: true }
    );

    return true;
  } catch (error) {
    console.error('Error syncing group extensions:', error);
    return false;
  }
}

// Sync game boards to Firebase
export async function syncGameBoardsToFirebase(): Promise<boolean> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error('No user logged in');
    return false;
  }

  try {
    // Get all game boards from Dexie
    const gameBoards = await getBoards();

    if (!gameBoards.length) {
      return true;
    }

    // Create a document in Firebase with all game boards
    await setDoc(
      doc(db, 'user-data', user.uid),
      {
        gameBoards,
        lastUpdated: new Date(),
      },
      { merge: true }
    );

    return true;
  } catch (error) {
    console.error('Error syncing game boards:', error);
    return false;
  }
}

// Sync user settings (including theme preferences) to Firebase
export async function syncSettingsToFirebase(): Promise<boolean> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error('No user logged in');
    return false;
  }

  try {
    // Get current settings from store
    const { settings } = useSettingsStore.getState();

    // Filter out local player settings and any undefined values - they should stay in React app only
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { localPlayers, ...settingsForFirebase } = settings;

    // Remove any undefined values from settings to prevent Firebase errors
    const cleanSettings = Object.fromEntries(
      Object.entries(settingsForFirebase).filter(([, value]) => value !== undefined)
    );

    // Create a document in Firebase with filtered user settings
    await setDoc(
      doc(db, 'user-data', user.uid),
      {
        settings: cleanSettings,
        lastUpdated: new Date(),
      },
      { merge: true }
    );

    return true;
  } catch (error) {
    console.error('Error syncing settings:', error);
    return false;
  }
}

// Sync all data to Firebase. Runs every step (so one failure doesn't block the
// rest) but returns false if any step failed, instead of masking partial failures.
export async function syncAllDataToFirebase(): Promise<boolean> {
  const results = [
    await syncCustomTilesToFirebase(),
    await syncDisabledDefaultsToFirebase(),
    await syncCustomGroupsToFirebase(),
    await syncGroupExtensionsToFirebase(),
    await syncGameBoardsToFirebase(),
    await syncSettingsToFirebase(),
  ];
  return results.every(Boolean);
}

// Intelligent sync that handles conflicts - meant for user-initiated sync
export async function intelligentSync(): Promise<{ success: boolean; conflicts?: string[] }> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    return { success: false, conflicts: ['No user logged in'] };
  }

  try {
    // Get both local and Firebase data
    const userDocRef = doc(db, 'user-data', user.uid);
    const userDoc = await getDoc(userDocRef);

    const localCustomTiles = await getTiles({ isCustom: 1 });
    const localCustomGroups = await getCustomGroups({ isDefault: false });

    const conflicts: string[] = [];

    if (!userDoc.exists()) {
      // No Firebase data - sync local to Firebase
      await syncAllDataToFirebase();
      return { success: true };
    }

    const userData = userDoc.data();
    const firebaseCustomTiles = (userData.customTiles as CustomTilePull[]) || [];
    const firebaseCustomGroups = (userData.customGroups as CustomGroupPull[]) || [];

    // Check for conflicts
    if (localCustomTiles.length > 0 && firebaseCustomTiles.length > 0) {
      conflicts.push(
        `Custom tiles: Local has ${localCustomTiles.length}, Firebase has ${firebaseCustomTiles.length}`
      );
    }

    if (localCustomGroups.length > 0 && firebaseCustomGroups.length > 0) {
      conflicts.push(
        `Custom groups: Local has ${localCustomGroups.length}, Firebase has ${firebaseCustomGroups.length}`
      );
    }

    if (conflicts.length > 0) {
      return { success: false, conflicts };
    }

    // No conflicts - proceed with normal sync
    const result = await syncDataFromFirebase();
    return { success: result };
  } catch (error) {
    console.error('Error in intelligent sync:', error);
    return { success: false, conflicts: ['Sync failed due to error'] };
  }
}

// Enhanced sync with conflict resolution - preserves local data when Firebase is empty
export async function syncDataFromFirebase(
  options: { forceSync?: boolean } = {}
): Promise<boolean> {
  // Use the new sync orchestrator for better maintainability
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

  // Convert minutes to milliseconds
  const intervalMs = intervalMinutes * 60 * 1000;

  // Set up the interval
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
