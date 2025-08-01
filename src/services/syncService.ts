import {
  addCustomTile,
  deleteAllIsCustomTiles as deleteAllCustomTiles,
  getTiles,
} from '@/stores/customTiles';
import { deleteAllCustomGroups, getCustomGroups, importCustomGroups } from '@/stores/customGroups';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getBoards, upsertBoard } from '@/stores/gameBoard';
import { useSettingsStore } from '@/stores/settingsStore';

import { CustomGroupPull } from '@/types/customGroups';
import { CustomTilePull } from '@/types/customTiles';
import { Settings } from '@/types/Settings';
import { SYNC_DELAY_MS } from '@/constants/actionConstants';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

interface GameBoard {
  title: string;
  tiles: any[];
  tags?: string[];
  gameMode?: string;
  isActive?: number;
}

// Updated to use inline type instead of separate interface to avoid unused warning

const db = getFirestore();

// Sync custom tiles to Firebase
export async function syncCustomTilesToFirebase(): Promise<boolean> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error('No user logged in');
    return false;
  }

  try {
    // Get all custom tiles from Dexie
    const customTiles = await getTiles({ isCustom: 1 });

    // Create a document in Firebase with all custom tiles
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

// Sync custom groups to Firebase
export async function syncCustomGroupsToFirebase(): Promise<boolean> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error('No user logged in');
    return false;
  }

  try {
    // Get all custom groups from Dexie
    const customGroups = await getCustomGroups();

    // Create a document in Firebase with all custom groups
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

    // Create a document in Firebase with user settings
    await setDoc(
      doc(db, 'user-data', user.uid),
      {
        settings,
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

// Sync data from Firebase to Dexie
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

    // Import custom tiles
    if (userData.customTiles !== undefined) {
      // Clear existing custom tiles before importing
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

    // Import custom groups
    if (userData.customGroups !== undefined) {
      // Clear existing custom groups before importing
      await deleteAllCustomGroups();

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
