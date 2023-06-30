import { initializeApp } from 'firebase/app';
import { signInAnonymously, getAuth, updateProfile } from 'firebase/auth';
import {
  getDatabase, onDisconnect, onValue, push, ref, set, remove,
} from 'firebase/database';
import {
  getFirestore,
  getDocs,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  where,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCKS7tWQRYRWHsawNfN42uAmISdUbJHJJw',
  authDomain: 'blitzout-49b39.firebaseapp.com',
  projectId: 'blitzout-49b39',
  storageBucket: 'blitzout-49b39.appspot.com',
  messagingSenderId: '852428606926',
  appId: '1:852428606926:web:17444e6f8dbc2f95f0ef9f',
  measurementId: 'G-93YN1YMTQ7',
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

export function setMyPresence({
  newRoom, oldRoom, newDisplayName, oldDisplayName,
}) {
  const database = getDatabase();
  const auth = getAuth();
  const uid = auth.currentUser?.uid;
  const newRoomConnectionsRef = ref(database, `rooms/${newRoom}/uids/${uid}`);
  const oldRoomConnectionsRef = ref(database, `rooms/${oldRoom}/uids/${uid}`);
  const connectedRef = ref(database, '.info/connected');

  onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      // We're connected (or reconnected)!
      const newRef = push(newRoomConnectionsRef);

      if (oldRoom !== newRoom || oldDisplayName !== newDisplayName) {
        remove(oldRoomConnectionsRef);
      }

      // When I disconnect, remove this device
      onDisconnect(newRef).remove();

      // Add this device to my connections list
      // this value could contain info about the device or a timestamp too
      set(newRef, newDisplayName);
    }
  });
}

export function getUserList(roomId, callback, existingData) {
  const database = getDatabase();
  const roomRef = ref(database, `rooms/${roomId}/uids`);
  onValue(roomRef, (snap) => {
    const data = snap.val();

    if (!data) return;

    // to prevent an endless loop, see if our new data matches the existing stuff.
    // can't compare two arrays directly, but we can compare two strings.
    const dataString = Object.keys(data).sort().join(',');
    const existingString = Object.keys(existingData).sort().join(',');
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

export async function submitSuggestion(grouping, suggestion) {
  try {
    await addDoc(collection(db, 'suggestions'), {
      grouping,
      suggestion,
      ttl: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
    });
  } catch (error) {
    // eslint-disable-next-line
    console.error(error);
  }
}

export async function sendMessage({
  room, user, text, type = 'chat', ...rest
}) {
  const allowedTypes = ['chat', 'actions', 'settings'];
  if (!allowedTypes.includes(type)) {
    let message = 'Invalid message type. Was expecting';
    message += allowedTypes.join(', ');
    message += ` but got ${type}`;
    // eslint-disable-next-line
    console.error(message);
  }

  const now = Date.now();

  try {
    await addDoc(collection(db, 'chat-rooms', room, 'messages'), {
      uid: user.uid,
      displayName: user.displayName,
      text: text.trim(),
      timestamp: serverTimestamp(),
      ttl: new Date(now + 2 * 60 * 60 * 1000), // 2 hours
      type,
      ...rest,
    });
  } catch (error) {
    // eslint-disable-next-line
    console.error(error);
  }
}

export function getMessages(roomId, callback) {
  const twoHoursBefore = new Date();
  twoHoursBefore.setHours(twoHoursBefore.getHours() - 2);
  return onSnapshot(
    query(
      collection(db, 'chat-rooms', roomId, 'messages'),
      where('timestamp', '>', twoHoursBefore),
      orderBy('timestamp', 'asc'),
    ),
    (querySnapshot) => {
      const messages = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(messages);
    },
  );
}

export function getRooms(callback) {
  const querySnapshot = getDocs(collection(db, 'chat-rooms'));
  const rooms = [];
  querySnapshot.then((data) => {
    data.forEach((doc) => rooms.push(doc.id));
    callback(rooms);
  });
}
