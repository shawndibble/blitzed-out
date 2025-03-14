import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getActiveTiles, addCustomTile, getCustomTiles } from '@/stores/customTiles';
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
    const customTiles = await getCustomTiles({ isCustom: 1 });
    
    if (!customTiles.length) {
      console.log('No custom tiles to sync');
      return true;
    }
    
    // Create a document in Firebase with all custom tiles
    await setDoc(doc(db, 'user-data', user.uid), {
      customTiles,
      lastUpdated: new Date()
    }, { merge: true });
    
    console.log('Custom tiles synced to Firebase');
    return true;
  } catch (error) {
    console.error('Error syncing custom tiles to Firebase:', error);
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
      console.log('No game boards to sync');
      return true;
    }
    
    // Create a document in Firebase with all game boards
    await setDoc(doc(db, 'user-data', user.uid), {
      gameBoards,
      lastUpdated: new Date()
    }, { merge: true });
    
    console.log('Game boards synced to Firebase');
    return true;
  } catch (error) {
    console.error('Error syncing game boards to Firebase:', error);
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
      console.log('No user data found in Firebase');
      return false;
    }
    
    const userData = userDoc.data();
    
    // Import custom tiles
    if (userData.customTiles && userData.customTiles.length > 0) {
      for (const tile of userData.customTiles) {
        // Check if tile already exists by matching action and group
        const existingTiles = await getCustomTiles({
          group: tile.group,
          action: tile.action
        });
        
        if (!existingTiles.length) {
          await addCustomTile(tile);
        }
      }
      console.log('Custom tiles imported from Firebase');
    }
    
    // Import game boards
    if (userData.gameBoards && userData.gameBoards.length > 0) {
      for (const board of userData.gameBoards) {
        await upsertBoard({
          title: board.title,
          tiles: board.tiles,
          tags: board.tags || [],
          gameMode: board.gameMode || 'online',
          isActive: 0 // Don't automatically activate imported boards
        });
      }
      console.log('Game boards imported from Firebase');
    }
    
    return true;
  } catch (error) {
    console.error('Error syncing data from Firebase:', error);
    return false;
  }
}
