import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  GoogleAuthProvider,
  linkWithCredential,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { getDatabase, onDisconnect, onValue, push, ref, remove, set } from 'firebase/database';
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { getDownloadURL, getStorage, ref as storageRef, uploadString } from 'firebase/storage';
import { sha256 } from 'js-sha256';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function loginAnonymously(displayName = '') {
  try {
    const auth = getAuth();
    await signInAnonymously(auth);
    await updateProfile(auth.currentUser, { displayName });
    return auth.currentUser;
  } catch (error) {
    // eslint-disable-next-line
    console.error(error);
    return null;
  }
}

export async function registerWithEmail(email, password, displayName = '') {
  try {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    return userCredential.user;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

export async function loginWithEmail(email, password) {
  try {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Email login error:', error);
    throw error;
  }
}

export async function loginWithGoogle() {
  try {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential.user;
  } catch (error) {
    console.error('Google login error:', error);
    throw error;
  }
}

export async function resetPassword(email) {
  try {
    const auth = getAuth();
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
}

// Function to convert anonymous account to permanent account
export async function convertAnonymousAccount(email, password) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user && user.isAnonymous) {
      const credential = EmailAuthProvider.credential(email, password);
      const result = await linkWithCredential(user, credential);
      return result.user;
    } else {
      throw new Error('User is not anonymous or not logged in');
    }
  } catch (error) {
    console.error('Account conversion error:', error);
    throw error;
  }
}

export async function logout() {
  try {
    const auth = getAuth();
    await signOut(auth);
  } catch (error) {
    // eslint-disable-next-line
    console.error(error);
  }
}

export function setMyPresence({
  newRoom,
  oldRoom,
  newDisplayName,
  oldDisplayName,
  removeOnDisconnect = true,
}) {
  const database = getDatabase();
  const auth = getAuth();
  const uid = auth.currentUser?.uid;
  const newRoomName = newRoom?.toUpperCase();
  const oldRoomName = oldRoom?.toUpperCase();
  const newRoomConnectionsRef = ref(database, `rooms/${newRoomName}/uids/${uid}`);
  const oldRoomConnectionsRef = ref(database, `rooms/${oldRoomName}/uids/${uid}`);
  const connectedRef = ref(database, '.info/connected');

  let newRef;
  let oldRef;

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

export function getUserList(roomId, callback, existingData = {}) {
  const database = getDatabase();
  const roomRef = ref(database, `rooms/${roomId?.toUpperCase()}/uids`);
  onValue(roomRef, (snap) => {
    const data = snap.val();

    if (!data) return;

    // to prevent an endless loop, see if our new data matches the existing stuff.
    // can't compare two arrays directly, but we can compare two strings.
    const dataString = Object.keys(data).sort().join(',');
    const existingString = existingData ? Object.keys(existingData).sort().join(',') : '';
    if (dataString !== existingString) callback(data);
  });
}

export async function updateDisplayName(displayName = '') {
  try {
    const auth = getAuth();
    await updateProfile(auth.currentUser, { displayName });
    return auth.currentUser;
  } catch (error) {
    // eslint-disable-next-line
    console.error(error);
    return null;
  }
}

export async function submitCustomAction(grouping, customAction) {
  try {
    await addDoc(collection(db, 'custom-actions'), {
      grouping,
      customAction,
      ttl: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
    });
  } catch (error) {
    // eslint-disable-next-line
    console.error(error);
  }
}

async function getBoardByContent(checksum) {
  const q = query(collection(db, 'game-boards'), where('checksum', '==', checksum));
  const snapshot = await getDocs(q);
  if (snapshot.size) {
    return snapshot.docs[0];
  }
  return null;
}

export async function getOrCreateBoard({ title, gameBoard, settings }) {
  if (!title) {
    return;
  }

  try {
    const checksum = sha256(gameBoard);
    const board = await getBoardByContent(checksum);
    if (board) {
      // update the ttl for another 30 days.
      updateDoc(board.ref, {
        ttl: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }); // 30 days

      return board;
    }
    return await storeBoard({ title, gameBoard, settings, checksum });
  } catch (error) {
    // eslint-disable-next-line
    console.error(error);
  }
}

async function storeBoard({ title, gameBoard, settings, checksum }) {
  try {
    return await addDoc(collection(db, 'game-boards'), {
      title,
      gameBoard,
      settings,
      checksum,
      ttl: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
  } catch (error) {
    // eslint-disable-next-line
    console.error(error);
  }
}

export async function getBoard(id) {
  try {
    const docRef = doc(db, 'game-boards', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (error) {
    // eslint-disable-next-line
    console.error(error);
  }
}

let lastMessage = {};

export async function sendMessage({ room, user, text = '', type = 'chat', ...rest }) {
  const allowedTypes = ['chat', 'actions', 'settings', 'room', 'media'];
  if (!allowedTypes.includes(type)) {
    let message = 'Invalid message type. Was expecting ';
    message += allowedTypes.join(', ');
    message += ` but got ${type}`;
    // eslint-disable-next-line
    return console.error(message);
  }

  const newMessage = { room, user: user.uid, text, type, ...rest };
  if (JSON.stringify(newMessage) === JSON.stringify(lastMessage)) {
    return; // Duplicate message detected. Not sending.
  }
  lastMessage = newMessage;

  const now = Date.now();

  try {
    return await addDoc(collection(db, 'chat-rooms', room?.toUpperCase(), 'messages'), {
      uid: user.uid,
      displayName: user.displayName,
      text: text.trim(),
      timestamp: serverTimestamp(),
      ttl: new Date(now + 24 * 60 * 60 * 1000), // 24 hours
      type,
      ...rest,
    });
  } catch (error) {
    // eslint-disable-next-line
    return console.error(error);
  }
}

export async function deleteMessage(room, messageId) {
  return deleteDoc(doc(db, `/chat-rooms/${room.toUpperCase()}/messages/${messageId}`));
}

export async function uploadImage({ image, room, user }) {
  const storage = getStorage();
  const imageUrl = image.base64String;
  const imageLoc = `/images/${Math.random()}.${image.format}`;
  const imageRef = storageRef(storage, imageLoc);
  const uploadTask = uploadString(imageRef, imageUrl, 'base64');

  // @ts-ignore
  uploadTask.on(
    'state_changed',
    () => {},
    // eslint-disable-next-line no-console
    (error) => console.error(error),
    () => {
      // @ts-ignore
      getDownloadURL(uploadTask.snapshot.ref).then(async (url) => {
        await sendMessage({
          room,
          user,
          text: url,
          type: 'media',
        });
      });
    }
  );
}

export function getMessages(roomId, callback) {
  if (!roomId) return undefined;
  const twoHoursBefore = new Date();
  twoHoursBefore.setHours(twoHoursBefore.getHours() - 2);
  return onSnapshot(
    query(
      collection(db, 'chat-rooms', roomId?.toUpperCase(), 'messages'),
      where('timestamp', '>', twoHoursBefore),
      orderBy('timestamp', 'asc')
    ),
    (querySnapshot) => {
      const messages = querySnapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));
      callback(messages);
    }
  );
}

export function getSchedule(callback) {
  return onSnapshot(
    query(
      collection(db, 'schedule'),
      // get all future events (minus 5 minutes for current games)
      where('dateTime', '>', new Date()),
      orderBy('dateTime', 'asc')
    ),
    (querySnapshot) => {
      const schedule = querySnapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));
      callback(schedule);
    }
  );
}

export async function addSchedule(dateTime, url, room = 'PUBLIC') {
  try {
    return await addDoc(collection(db, 'schedule'), {
      dateTime: Timestamp.fromDate(dateTime),
      url,
      room,
    });
  } catch (error) {
    // eslint-disable-next-line
    return console.error(error);
  }
}
