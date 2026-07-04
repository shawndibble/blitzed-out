import { AuthError, createStandardError, getFirebaseErrorMessage } from '@/types/errors';
import {
  DataSnapshot,
  ThenableReference,
  getDatabase,
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  set,
} from 'firebase/database';
import {
  DocumentData,
  DocumentReference,
  QuerySnapshot,
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  initializeFirestore,
  limit,
  onSnapshot,
  orderBy,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  getAuth,
  linkWithCredential,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { getDownloadURL, getStorage, ref as storageRef, uploadString } from 'firebase/storage';

import { MessageType } from '@/types/Message';
import { stripImageMetadata } from '@/services/imageProcessing';
import { User as UserType } from '@/types';
import { initializeApp } from 'firebase/app';
import { sha256 } from 'js-sha256';
import { reportFirefoxMobileAuthError } from '@/utils/firefoxMobileReporting';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Check for missing environment variables
const missingVars = Object.entries(firebaseConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('Missing Firebase environment variables', missingVars);
  console.error('Please check your .env file and ensure all VITE_FIREBASE_* variables are set');
}

const app = initializeApp(firebaseConfig);
let _db: ReturnType<typeof initializeFirestore>;
try {
  _db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch (e) {
  // IndexedDB unavailable (private browsing, quota exceeded, etc.) — fall back to in-memory
  if (import.meta.env.DEV)
    console.error('Firestore persistence unavailable, using in-memory cache:', e);
  _db = initializeFirestore(app, {});
}
export const db = _db;

// Firestore database initialized

export async function loginAnonymously(displayName = ''): Promise<User | null> {
  try {
    const auth = getAuth();

    await signInAnonymously(auth);

    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName });
      return auth.currentUser;
    } else {
      const error = new Error('No current user after anonymous sign in');
      reportFirefoxMobileAuthError('anonymous_login_no_user', error, {
        authentication: {
          step: 'anonymous_login_no_user',
          displayName,
        },
      });
      return null;
    }
  } catch (error) {
    const authError = error as Error;
    reportFirefoxMobileAuthError('anonymous_login_failed', authError, {
      authentication: {
        step: 'anonymous_login_failed',
        displayName,
      },
    });

    throw new AuthError(
      getFirebaseErrorMessage(error),
      'ANONYMOUS_LOGIN_FAILED',
      createStandardError(error)
    );
  }
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName = ''
): Promise<User> {
  try {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    return userCredential.user;
  } catch (error) {
    console.error('Registration error', error);
    throw new AuthError(
      getFirebaseErrorMessage(error),
      'REGISTRATION_FAILED',
      createStandardError(error)
    );
  }
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  try {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Email login error', error);
    throw new AuthError(
      getFirebaseErrorMessage(error),
      'EMAIL_LOGIN_FAILED',
      createStandardError(error)
    );
  }
}

export async function loginWithGoogle(): Promise<User> {
  try {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential.user;
  } catch (error) {
    console.error('Google login error', error);
    throw new AuthError(
      getFirebaseErrorMessage(error),
      'GOOGLE_LOGIN_FAILED',
      createStandardError(error)
    );
  }
}

export async function resetPassword(email: string): Promise<boolean> {
  try {
    const auth = getAuth();
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error('Password reset error', error);
    throw new AuthError(
      getFirebaseErrorMessage(error),
      'PASSWORD_RESET_FAILED',
      createStandardError(error)
    );
  }
}

// Function to convert anonymous account to permanent account
export async function convertAnonymousAccount(email: string, password: string): Promise<User> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user?.isAnonymous) {
      const credential = EmailAuthProvider.credential(email, password);
      const result = await linkWithCredential(user, credential);
      return result.user;
    } else {
      throw new Error('User is not anonymous or not logged in');
    }
  } catch (error) {
    console.error('Account conversion error', error);
    throw new AuthError(
      getFirebaseErrorMessage(error),
      'ACCOUNT_CONVERSION_FAILED',
      createStandardError(error)
    );
  }
}

export async function logout(): Promise<boolean> {
  try {
    const auth = getAuth();
    await signOut(auth);
    return true;
  } catch (error) {
    console.error('Firebase operation failed', error);
    throw error;
  }
}

/**
 * Completely wipe all app data including localStorage, IndexedDB, sessionStorage, and cookies
 * This provides a complete reset for users who want to start fresh
 */
export async function wipeAllAppData(): Promise<void> {
  try {
    // First sign out from Firebase
    const auth = getAuth();
    await signOut(auth);

    // Clear all localStorage keys
    const keysToRemove = [
      'gameSettings',
      'messages-storage',
      'local-player-store',
      'i18nextLng',
      // Migration keys
      'blitzed-out-action-groups-migration',
      'blitzed-out-background-migration',
      'blitzed-out-migration-in-progress',
      'blitzed-out-current-language-migration',
      'blitzed-out-background-migration-in-progress',
      'blitzed-out-migration-health',
    ];

    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove localStorage key: ${key}`, error);
      }
    });

    // Clear any remaining localStorage keys that start with our app prefixes
    const appPrefixes = ['gameSettings', 'messages-storage', 'local-player-store', 'blitzed-out-'];
    const localStorageKeys = Object.keys(localStorage);
    localStorageKeys.forEach((key) => {
      if (appPrefixes.some((prefix) => key.startsWith(prefix))) {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to remove localStorage key: ${key}`, error);
        }
      }
    });

    // Clear sessionStorage (Firebase auth data)
    try {
      sessionStorage.clear();
    } catch (error) {
      console.warn('Failed to clear sessionStorage', error);
    }

    // Clear IndexedDB via Dexie
    try {
      const { default: db } = await import('@/stores/store');
      // Close the database first to prevent blocked delete operations
      db.close();
      await db.delete();
    } catch (error) {
      console.warn('Failed to clear IndexedDB', error);
    }

    // Clear cookies comprehensively by trying multiple path and domain combinations
    const cookiesToClear = ['i18next'];
    const currentHostname = window.location.hostname;

    // Generate possible domains (current domain and its parent domains)
    const domains = [currentHostname];
    if (currentHostname.includes('.')) {
      const parts = currentHostname.split('.');
      // Add parent domains (e.g., for app.example.com, try .example.com)
      for (let i = 1; i < parts.length - 1; i++) {
        domains.push(`.${parts.slice(i).join('.')}`);
      }
    }

    // Common paths where cookies might be set
    const paths = ['/', '/app', '/auth', '/login'];

    cookiesToClear.forEach((cookieName) => {
      // Try clearing with all combinations of domains and paths
      domains.forEach((domain) => {
        paths.forEach((path) => {
          try {
            // Clear regular cookie
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
            // Clear secure cookie (if applicable)
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; secure;`;
            // Clear httpOnly-accessible cookie (won't work from JS but attempt anyway)
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; httpOnly;`;
            // Clear SameSite variants
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; SameSite=Strict;`;
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; SameSite=Lax;`;
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; SameSite=None; secure;`;
          } catch {
            // Silently continue - many of these attempts will fail, which is expected
          }
        });
      });

      // Also try without specifying domain (for cookies set without explicit domain)
      paths.forEach((path) => {
        try {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; secure;`;
        } catch {
          // Silently continue
        }
      });
    });
  } catch (error) {
    console.error('Error wiping app data:', error);
    throw error;
  }
}

interface PresenceOptions {
  newRoom: string | null;
  oldRoom: string | null;
  newDisplayName: string;
  oldDisplayName: string;
  removeOnDisconnect?: boolean;
}

export function setMyPresence({
  newRoom,
  oldRoom,
  newDisplayName,
  oldDisplayName,
  removeOnDisconnect = true,
}: PresenceOptions): void {
  const database = getDatabase(app);
  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  // Default to 'PUBLIC' if room is null/undefined
  const newRoomName = newRoom?.toUpperCase() || 'PUBLIC';
  const oldRoomName = oldRoom?.toUpperCase() || 'PUBLIC';

  // Only proceed if we have a valid uid
  if (!uid) {
    console.warn('Cannot set presence: User not authenticated');
    return;
  }

  const newRoomConnectionsRef = ref(database, `rooms/${newRoomName}/uids/${uid}`);
  const oldRoomConnectionsRef = ref(database, `rooms/${oldRoomName}/uids/${uid}`);
  const connectedRef = ref(database, '.info/connected');

  let newRef: ThenableReference;
  let oldRef: ThenableReference;

  onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      // We're connected (or reconnected)!
      newRef = push(newRoomConnectionsRef);
      oldRef = push(oldRoomConnectionsRef);

      if (oldRoomName !== newRoomName || oldDisplayName !== newDisplayName) {
        remove(oldRoomConnectionsRef);
      }

      // When I disconnect, remove this device
      if (removeOnDisconnect) {
        onDisconnect(oldRef).remove();
        onDisconnect(newRef).remove();
      }

      // Add this device to my connections list
      // this value could contain info about the device or a timestamp too
      set(newRef, { displayName: newDisplayName, lastActive: Date.now() });
    }
  });

  document.addEventListener('beforeunload', () => {
    // Browser is about to be closed, manually trigger disconnect
    if (oldRef) remove(oldRef);
    if (newRef) remove(newRef);
  });
}

/**
 * Subscribe to the presence list for a room. Returns the RTDB unsubscribe
 * function, or undefined when no room is given.
 */
export function getUserList(
  roomId: string | null | undefined,
  callback: (data: Record<string, unknown>) => void,
  existingData: Record<string, unknown> = {}
): (() => void) | undefined {
  if (!roomId) return undefined;

  const roomUpper = roomId.toUpperCase();
  const database = getDatabase(app);
  const usersRef = ref(database, 'users');

  return onValue(
    usersRef,
    (snap: DataSnapshot) => {
      const allUsers = snap.val() as Record<string, any> | null;

      if (!allUsers) {
        callback({});
        return;
      }

      // Filter users by room and convert to expected format
      const roomUsers: Record<string, unknown> = {};
      Object.entries(allUsers).forEach(([uid, userData]) => {
        if (userData.room === roomUpper) {
          roomUsers[uid] = {
            displayName: userData.displayName,
            uid: uid,
            lastSeen: userData.lastSeen ? new Date(userData.lastSeen) : new Date(),
            isAnonymous: userData.isAnonymous,
            joinedAt: userData.joinedAt ? new Date(userData.joinedAt) : new Date(),
            room: userData.room,
          };
        }
      });

      // to prevent an endless loop, see if our new data matches the existing stuff.
      // can't compare two arrays directly, but we can compare two strings.
      const dataString = Object.keys(roomUsers).sort().join(',');
      const existingString = existingData ? Object.keys(existingData).sort().join(',') : '';
      if (dataString !== existingString) callback(roomUsers);
    },
    (error) => {
      console.error('getUserList error', error);
    }
  );
}

export async function updateDisplayName(displayName = ''): Promise<User | null> {
  try {
    const auth = getAuth();
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName });
      return auth.currentUser;
    }
    return null;
  } catch (error) {
    console.error('Firebase operation failed', error);
    return getAuth().currentUser;
  }
}

export async function submitCustomAction(grouping: string, customAction: string): Promise<void> {
  try {
    await addDoc(collection(db, 'custom-actions'), {
      grouping,
      customAction,
      ttl: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
    });
  } catch (error) {
    console.error('Firebase operation failed', error);
  }
}

async function getBoardByContent(checksum: string): Promise<DocumentData | null> {
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
}: BoardData): Promise<DocumentData | undefined> {
  if (!title) {
    return;
  }

  try {
    const checksum = sha256(gameBoard);
    const board = await getBoardByContent(checksum);
    if (board) {
      // update the ttl for another 30 days.
      await updateDoc(board.ref, {
        ttl: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }); // 30 days

      return board;
    }
    return await storeBoard({ title, gameBoard, settings, checksum });
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

let lastMessage: Record<string, unknown> = {};

const DEFAULT_LIMIT = 50;

interface SendMessageOptions {
  room?: string | null;
  user: UserType;
  text?: string;
  type: MessageType;
  [key: string]: unknown;
}

export async function sendMessage({
  room,
  user,
  text = '',
  type = 'chat',
  ...rest
}: SendMessageOptions): Promise<DocumentReference<DocumentData> | void> {
  const allowedTypes = ['chat', 'actions', 'settings', 'room', 'media'];
  if (!allowedTypes.includes(type)) {
    let message = 'Invalid message type. Was expecting ';
    message += allowedTypes.join(', ');
    message += ` but got ${type}`;

    console.error('Type validation error', message);
    return;
  }

  if (!user?.uid) {
    return;
  }

  const newMessage = { room, user: user.uid, text, type, ...rest };
  if (JSON.stringify(newMessage) === JSON.stringify(lastMessage)) {
    return; // Duplicate message detected. Not sending.
  }
  lastMessage = newMessage;

  const now = Date.now();
  const roomName = room?.toUpperCase() || 'PUBLIC';

  try {
    const docRef = await addDoc(collection(db, 'chat-rooms', roomName, 'messages'), {
      text: text.trim(),
      ttl: new Date(now + 24 * 60 * 60 * 1000), // 24 hours
      type,
      ...rest,
      uid: user.uid,
      displayName: user.displayName,
      timestamp: serverTimestamp(),
    });

    return docRef;
  } catch (error) {
    console.error('Failed to send message', error);
    return;
  }
}

export async function deleteMessage(room: string, messageId: string): Promise<void> {
  return deleteDoc(doc(db, 'chat-rooms', room.toUpperCase(), 'messages', messageId));
}

interface ImageData {
  base64String: string;
  format: string;
}

interface UploadImageData {
  image: ImageData;
  room: string | null | undefined;
  user: UserType;
}

export async function uploadImage({ image, room, user }: UploadImageData): Promise<void> {
  const storage = getStorage();
  const imageUrl = await stripImageMetadata(image.base64String, image.format);
  const imageLoc = `/images/${Math.random()}.${image.format}`;
  const imageRef = storageRef(storage, imageLoc);

  try {
    const uploadResult = await uploadString(imageRef, imageUrl, 'base64');
    const downloadURL = await getDownloadURL(uploadResult.ref);

    await sendMessage({
      room,
      user,
      text: '',
      type: 'media',
      image: downloadURL,
    });
  } catch (error) {
    console.error('Error uploading image', error);
  }
}

export function getMessages(
  roomId: string | null | undefined,
  callback: (messages: Array<Record<string, unknown>>) => void
): (() => void) | undefined {
  if (!roomId) return undefined;

  const auth = getAuth();

  // Firestore rules require an authenticated user, so defer the query until sign-in completes
  if (!auth.currentUser) {
    let unsubscribeAuth: (() => void) | undefined;
    let unsubscribeQuery: (() => void) | undefined;

    unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        unsubscribeQuery = executeGetMessages(roomId, callback);
        if (unsubscribeAuth) {
          unsubscribeAuth();
          unsubscribeAuth = undefined;
        }
      }
    });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeQuery) unsubscribeQuery();
    };
  }

  return executeGetMessages(roomId, callback);
}

function executeGetMessages(
  roomId: string,
  callback: (messages: Array<Record<string, unknown>>) => void
): () => void {
  const roomUpper = roomId.toUpperCase();

  // 3-hour window balances chat history depth against Firestore read volume
  const timeWindow = new Date();
  timeWindow.setHours(timeWindow.getHours() - 3);

  const messagesQuery = query(
    collection(db, 'chat-rooms', roomUpper, 'messages'),
    where('timestamp', '>', timeWindow),
    orderBy('timestamp', 'desc'),
    limit(DEFAULT_LIMIT)
  );

  return onSnapshot(
    messagesQuery,
    (querySnapshot: QuerySnapshot<DocumentData>) => {
      const messages = querySnapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));
      callback(messages);
    },
    (error) => {
      console.error('getMessages error', error);
    }
  );
}

export function getSchedule(
  callback: (schedule: Array<Record<string, unknown>>) => void
): () => void {
  // 5-minute lookback keeps games that just started visible as "current"
  const currentTime = new Date();
  currentTime.setMinutes(currentTime.getMinutes() - 5);

  const scheduleQuery = query(
    collection(db, 'schedule'),
    where('dateTime', '>', currentTime),
    orderBy('dateTime', 'asc'),
    limit(DEFAULT_LIMIT)
  );

  return onSnapshot(
    scheduleQuery,
    (querySnapshot: QuerySnapshot<DocumentData>) => {
      const schedule = querySnapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));
      callback(schedule);
    },
    (error) => {
      console.error('getSchedule error', error);
    }
  );
}

export async function addSchedule(
  dateTime: Date,
  url: string,
  room = 'PUBLIC',
  createdBy?: string
): Promise<DocumentReference<DocumentData>> {
  try {
    return await addDoc(collection(db, 'schedule'), {
      dateTime: Timestamp.fromDate(dateTime),
      url,
      room,
      createdBy: createdBy || '',
    });
  } catch (error) {
    console.error('Schedule operation failed', error);
    throw error;
  }
}

export async function updateSchedule(
  scheduleId: string,
  updates: { dateTime: Date; url: string }
): Promise<void> {
  try {
    await updateDoc(doc(db, 'schedule', scheduleId), {
      dateTime: Timestamp.fromDate(updates.dateTime),
      url: updates.url,
    });
  } catch (error) {
    console.error('Schedule update failed', error);
    throw error;
  }
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'schedule', scheduleId));
  } catch (error) {
    console.error('Schedule delete failed', error);
    throw error;
  }
}
