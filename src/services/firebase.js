import { initializeApp } from "firebase/app";
import { signInAnonymously, getAuth, updateProfile } from 'firebase/auth';
import {
    getFirestore,
    getDocs,
    collection,
    addDoc,
    serverTimestamp,
    onSnapshot,
    query,
    orderBy,
    setDoc,
    doc,
} from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCKS7tWQRYRWHsawNfN42uAmISdUbJHJJw",
    authDomain: "blitzout-49b39.firebaseapp.com",
    projectId: "blitzout-49b39",
    storageBucket: "blitzout-49b39.appspot.com",
    messagingSenderId: "852428606926",
    appId: "1:852428606926:web:17444e6f8dbc2f95f0ef9f", 
    measurementId: "G-93YN1YMTQ7"
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
         console.error(error);
    }
}

export async function updateDisplayName(displayName = '') {
    try {
        const auth = getAuth();
        await updateProfile(auth.currentUser, { displayName });
        return auth.currentUser;
    } catch(error) {
        console.error(error);
    }
}

export async function createRoom(roomId) {
    try {
        await setDoc(doc(db, 'chat-rooms', roomId), {}, {merge: true});
    } catch (error) {
        console.error(error);
    }
}

export async function sendMessage(roomId, user, text) {
    try {
        await addDoc(collection(db, 'chat-rooms', roomId, 'messages'), {
            uid: user.uid,
            displayName: user.displayName,
            text: text.trim(),
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error(error);
    }
}

export function getMessages(roomId, callback) {
    return onSnapshot(
        query(
            collection(db, 'chat-rooms', roomId, 'messages'),
            orderBy('timestamp', 'asc')
        ),
        (querySnapshot) => {
            const messages = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            callback(messages);
        }
    );
}

export function getRooms(callback) {
    const querySnapshot = getDocs(collection(db, 'chat-rooms'));
    const rooms = [];
    querySnapshot.then(data => {
        data.forEach((doc) => rooms.push(doc.id));
        callback(rooms)
    });
}