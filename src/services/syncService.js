import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { addCustomTile, getTiles } from '@/stores/customTiles';
import { getBoards, upsertBoard } from '@/stores/gameBoard';

const db = getFirestore();

// Sync custom tiles to Firebase
export async function syncCustomTilesToFirebase() {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error('No user logged in');
    return false;
  }

  try {
    // Get all custom tiles from Dexie
    const customTiles = await getTiles({ isCustom: 1 });

    if (!customTiles.length) {
      return true;
    }

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

// Sync game boards to Firebase
export async function syncGameBoardsToFirebase() {
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

// Sync all data to Firebase
export async function syncAllDataToFirebase() {
  await syncCustomTilesToFirebase();
  await syncGameBoardsToFirebase();
  return true;
}

// Sync data from Firebase to Dexie
export async function syncDataFromFirebase() {
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
    if (userData.customTiles && userData.customTiles.length > 0) {
      for (const tile of userData.customTiles) {
        // Check if tile already exists by matching action and group
        const existingTiles = await getTiles({
          group: tile.group,
          action: tile.action,
        });

        if (!existingTiles.length) {
          await addCustomTile(tile);
        }
      }
      console.log(userData.customTiles.length + ' custom tiles imported');
    }

    // Import game boards
    if (userData.gameBoards && userData.gameBoards.length > 0) {
      for (const board of userData.gameBoards) {
        await upsertBoard({
          title: board.title,
          tiles: board.tiles,
          tags: board.tags || [],
          gameMode: board.gameMode || 'online',
          isActive: board.isActive || 0,
        });
      }
      console.log(userData.gameBoards?.length + ' game boards imported');
    }

    return true;
  } catch (error) {
    console.error('Error syncing data:', error);
    return false;
  }
}
