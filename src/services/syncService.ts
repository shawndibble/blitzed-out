import {
  deleteAllIsCustomTiles,
  deleteCustomTile,
  getTiles,
  updateCustomTile,
} from '@/stores/customTiles';
import { deleteCustomGroup, getCustomGroups } from '@/stores/customGroups';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { CustomGroupPull } from '@/types/customGroups';
import { CustomTilePull } from '@/types/customTiles';
import { getAuth } from 'firebase/auth';
import { getBoards } from '@/stores/gameBoard';
import { getFirestore } from 'firebase/firestore';
import { useSettingsStore } from '@/stores/settingsStore';

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
      const key = `${tile.gameMode || ''}|${tile.group}|${tile.intensity}|${tile.action}`;
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

// Helper function to reset disabled defaults back to enabled state before restoring from Firebase
export async function resetDisabledDefaults(): Promise<boolean> {
  try {
    const disabledDefaults = await getTiles({ isCustom: 0, isEnabled: 0 });

    // Filter out tiles without IDs and batch updateCustomTile operations concurrently
    const validTiles = disabledDefaults.filter((tile) => tile.id);
    const updatePromises = validTiles.map(
      (tile) => updateCustomTile(tile.id!, { isEnabled: 1 }) // Reset to enabled state - Firebase will restore the correct disabled state
    );
    await Promise.all(updatePromises);

    return true;
  } catch (error) {
    console.error('Error resetting disabled default tiles:', error);
    return false;
  }
}

// Helper function to apply disabled defaults from Firebase to existing default tiles
export async function applyDisabledDefaults(disabledDefaults: CustomTilePull[]): Promise<boolean> {
  try {
    // Prefetch all existing default tiles in a single query
    const allDefaultTiles = await getTiles({ isCustom: 0 });

    // Build an in-memory map keyed by composite key (gameMode|group|intensity|action) for O(1) lookups
    const defaultTilesMap = new Map<string, number>();
    allDefaultTiles.forEach((tile) => {
      const key = `${tile.gameMode || ''}|${tile.group}|${tile.intensity}|${tile.action}`;
      defaultTilesMap.set(key, tile.id);
    });

    // Iterate disabledDefaults and collect update calls only for matched IDs
    const updatePromises: Promise<number>[] = [];
    disabledDefaults.forEach((disabledTile) => {
      const key = `${disabledTile.gameMode || ''}|${disabledTile.group}|${disabledTile.intensity}|${disabledTile.action}`;
      const matchedId = defaultTilesMap.get(key);

      if (matchedId) {
        updatePromises.push(updateCustomTile(matchedId, { isEnabled: 0 }));
      }
    });

    // Run updates in a single batch using Promise.all
    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error('Error applying disabled defaults:', error);
    return false;
  }
}

// Sync custom tiles and disabled defaults to Firebase
export async function syncCustomTilesToFirebase(): Promise<boolean> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error('No user logged in');
    return false;
  }

  try {
    // Get custom tiles (user-created content)
    const customTiles = await getTiles({ isCustom: 1 });

    // Get disabled default tiles (user disabled these defaults)
    const disabledDefaults = await getTiles({ isCustom: 0, isEnabled: 0 });

    // Add validation to prevent uploading excessive disabled defaults
    const MAX_REASONABLE_DISABLED_DEFAULTS = 100;
    if (disabledDefaults.length > MAX_REASONABLE_DISABLED_DEFAULTS) {
      console.warn(
        `⚠️  Attempting to sync ${disabledDefaults.length} disabled defaults, which seems excessive.`
      );
      console.warn(
        'This may indicate corrupted local data. Limiting to first 100 disabled defaults.'
      );

      // Limit to first 100 to prevent Firebase corruption
      disabledDefaults.splice(MAX_REASONABLE_DISABLED_DEFAULTS);
    }

    // Create a document in Firebase with both custom tiles and disabled defaults
    await setDoc(
      doc(db, 'user-data', user.uid),
      {
        customTiles,
        disabledDefaults,
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

// Utility function to clean up corrupted disabled defaults in Firebase
export async function cleanupCorruptedDisabledDefaults(): Promise<boolean> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error('No user logged in');
    return false;
  }

  try {
    // Get only genuinely user-disabled tiles (reasonable count)
    const disabledDefaults = await getTiles({ isCustom: 0, isEnabled: 0 });

    // If still excessive, something is wrong locally too
    if (disabledDefaults.length > 100) {
      console.warn(
        '⚠️  Local disabled defaults count is also excessive. This suggests system-wide data corruption.'
      );
      console.warn('Consider using the reset disabled defaults function in the app settings.');
      return false;
    }

    // Get current Firebase data to preserve other fields
    const userDocRef = doc(db, 'user-data', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return true;
    }

    const userData = userDoc.data();

    // Update only the disabledDefaults field with the cleaned data
    await setDoc(userDocRef, {
      ...userData,
      disabledDefaults,
      lastUpdated: new Date(),
    });

    return true;
  } catch (error) {
    console.error('❌ Error cleaning up corrupted disabled defaults:', error);
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

// Sync all data to Firebase
export async function syncAllDataToFirebase(): Promise<boolean> {
  await syncCustomTilesToFirebase();
  await syncCustomGroupsToFirebase();
  await syncGameBoardsToFirebase();
  await syncSettingsToFirebase();
  return true;
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
  return await SyncOrchestrator.syncFromFirebase(options);
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
