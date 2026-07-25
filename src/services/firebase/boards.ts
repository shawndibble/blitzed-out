/**
 * Shared game boards: published by content hash (identical boards share one
 * document), kept alive 30 days, and fetched by id for `?importBoard=`.
 *
 * Owns both directions, and returns domain values — never a Firestore class.
 */
import {
  DocumentData,
  DocumentReference,
  QueryDocumentSnapshot,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { sha256 } from 'js-sha256';
import { db } from './app';

/** A stored shared board, identified the only way callers ever use it. */
export interface StoredBoard {
  id: string;
}

async function getBoardByContent(
  checksum: string
): Promise<QueryDocumentSnapshot<DocumentData> | null> {
  const q = query(collection(db, 'game-boards'), where('checksum', '==', checksum));
  const snapshot = await getDocs(q);
  if (snapshot.size) {
    return snapshot.docs[0];
  }
  return null;
}

interface BoardData {
  title: string;
  gameBoard: string;
  settings: string;
}

export async function getOrCreateBoard({
  title,
  gameBoard,
  settings,
}: BoardData): Promise<StoredBoard | undefined> {
  if (!title) {
    return;
  }

  try {
    const checksum = sha256(gameBoard);
    const board = await getBoardByContent(checksum);
    if (board) {
      // Content already published — keep it alive another 30 days.
      await updateDoc(board.ref, {
        ttl: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      return { id: board.id };
    }
    const created = await storeBoard({ title, gameBoard, settings, checksum });
    // Both branches now return the same thing. They used to hand back a
    // QueryDocumentSnapshot and a DocumentReference under one declared type,
    // which only survived because `.id` happens to exist on both.
    return created ? { id: created.id } : undefined;
  } catch (error) {
    console.error('Firebase operation failed', error);
  }
}

interface StoreBoardData extends BoardData {
  checksum: string;
}

async function storeBoard({
  title,
  gameBoard,
  settings,
  checksum,
}: StoreBoardData): Promise<DocumentReference<DocumentData> | undefined> {
  try {
    return await addDoc(collection(db, 'game-boards'), {
      title,
      gameBoard,
      settings,
      checksum,
      ttl: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
  } catch (error) {
    console.error('Firebase operation failed', error);
    return undefined;
  }
}

export async function getBoard(id: string): Promise<DocumentData | undefined> {
  try {
    const docRef = doc(db, 'game-boards', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return undefined;
  } catch (error) {
    console.error('Firebase operation failed', error);
    return undefined;
  }
}
