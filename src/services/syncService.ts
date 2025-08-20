import {
  addCustomTile,
  deleteAllIsCustomTiles as deleteAllCustomTiles,
  getTiles,
  updateCustomTile,
} from '@/stores/customTiles';
import { deleteCustomGroup, getCustomGroups, importCustomGroups } from '@/stores/customGroups';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getBoards, upsertBoard } from '@/stores/gameBoard';

import { CustomGroupPull } from '@/types/customGroups';
import { CustomTilePull } from '@/types/customTiles';
import { SYNC_DELAY_MS } from '@/constants/actionConstants';
import { Settings } from '@/types/Settings';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { useSettingsStore } from '@/stores/settingsStore';

interface GameBoard {
  title: string;
  tiles: any[];
  tags?: string[];
  gameMode?: string;
  isActive?: number;
}

// Updated to use inline type instead of separate interface to avoid unused warning

const db = getFirestore();

// Helper function to clear only user-created custom groups (preserve default groups)
async function clearUserCustomGroups(): Promise<boolean> {
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
async function resetDisabledDefaults(): Promise<boolean> {
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
async function applyDisabledDefaults(disabledDefaults: CustomTilePull[]): Promise<boolean> {
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

    // Filter out local player settings - they should stay in React app only
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { localPlayers, ...settingsForFirebase } = settings;

    // Create a document in Firebase with filtered user settings
    await setDoc(
      doc(db, 'user-data', user.uid),
      {
        settings: settingsForFirebase,
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

// Sync data from Firebase to Dexie (SURGICAL APPROACH - preserves default content)
export async function syncDataFromFirebase(): Promise<boolean> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error('No user logged in');
    return false;
  }

  try {
    // Get user data from Firebase
    const userDocRef = doc(db, 'user-data', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return false;
    }

    const userData = userDoc.data();

    // SURGICAL APPROACH: Only clear user-created content, preserve defaults

    // 1. Only clear custom tiles (preserve default tiles)
    if (userData.customTiles !== undefined) {
      await deleteAllCustomTiles();

      // Add a delay after clearing custom tiles before syncing with remote server
      await new Promise((resolve) => setTimeout(resolve, SYNC_DELAY_MS));

      // Only import if there are tiles to import
      if (userData.customTiles && userData.customTiles.length > 0) {
        for (const tile of userData.customTiles as CustomTilePull[]) {
          try {
            const existingTile = await getTiles({
              gameMode: tile.gameMode,
              group: tile.group,
              intensity: tile.intensity,
              action: tile.action,
            });

            if (existingTile.length === 0) {
              await addCustomTile(tile);
            }
          } catch (error) {
            console.error('Error importing custom tile:', tile, error);
          }
        }
        // Successfully processed and imported custom tiles from Firebase into local Dexie database
      } else {
        // Firebase data contains empty custom tiles array - local database cleared but no new tiles to import
      }
    }

    // 2. Only clear user-created custom groups (preserve default groups)
    if (userData.customGroups !== undefined) {
      // Use surgical delete - only removes user-created groups, NOT default groups
      await clearUserCustomGroups();

      // Add a delay after clearing custom groups before syncing with remote server
      await new Promise((resolve) => setTimeout(resolve, SYNC_DELAY_MS));

      // Only import if there are groups to import
      if (userData.customGroups && userData.customGroups.length > 0) {
        try {
          await importCustomGroups(userData.customGroups as CustomGroupPull[]);
          // Successfully bulk imported custom groups from Firebase with validation and error handling
        } catch (error) {
          console.error('Error importing custom groups:', error);
        }
      } else {
        // Firebase data contains empty custom groups array - local database cleared but no new groups to import
      }
    }

    // 3. Handle disabled defaults - restore user's disabled state preferences
    if (userData.disabledDefaults !== undefined) {
      // First reset all disabled defaults back to enabled
      await resetDisabledDefaults();

      // Add a delay before applying disabled state
      await new Promise((resolve) => setTimeout(resolve, SYNC_DELAY_MS));

      // Then apply the disabled state from Firebase
      if (userData.disabledDefaults && userData.disabledDefaults.length > 0) {
        try {
          await applyDisabledDefaults(userData.disabledDefaults as CustomTilePull[]);
          // Successfully restored user's disabled default action preferences from Firebase
        } catch (error) {
          console.error('Error applying disabled defaults:', error);
        }
      }
    }

    // Import game boards
    if (userData.gameBoards && userData.gameBoards.length > 0) {
      for (const board of userData.gameBoards as GameBoard[]) {
        await upsertBoard({
          title: board.title,
          tiles: board.tiles,
          tags: board.tags || [],
          gameMode: board.gameMode || 'online',
          isActive: board.isActive || 0,
        });
      }
      // Successfully imported all game boards from Firebase, upserting each board with proper defaults for missing fields
    }

    // Import user settings (including theme preferences)
    if (userData.settings) {
      try {
        const { updateSettings } = useSettingsStore.getState();

        // Merge Firebase settings with local settings
        // Only update if the Firebase data is newer or has different values
        const firebaseSettings = userData.settings as Partial<Settings>;
        updateSettings(firebaseSettings);

        // Successfully imported user settings from Firebase including theme preferences
      } catch (error) {
        console.error('Error importing settings:', error);
      }
    }

    return true;
  } catch (error) {
    console.error('Error syncing data:', error);
    return false;
  }
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
