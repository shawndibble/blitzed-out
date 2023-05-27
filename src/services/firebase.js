import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, signInAnonymously, signInWithPopup, getAuth, updateProfile } from 'firebase/auth';
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

async function loginWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        const auth = getAuth();

        const { user } = await signInWithPopup(auth, provider);

        return { uid: user.uid, displayName: user.displayName };
    } catch (error) {
        if (error.code !== 'auth/cancelled-popup-request') {
            console.error(error);
        }

        return null;
    }
}

async function loginAnonymously(displayName = '') {
    try {
        const auth = getAuth();
        await signInAnonymously(auth);

        await updateProfile(auth.currentUser, {
            displayName
        });
        console.log('user', auth.currentUser);
        return auth.currentUser; 
    } catch (error) {
         console.error(error);
    }
}

async function createRoom(roomId) {
    try {
        await setDoc(doc(db, 'chat-rooms', roomId), {}, {merge: true});
    } catch (error) {
        console.error(error);
    }
}

async function sendMessage(roomId, user, text) {
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

function getMessages(roomId, callback) {
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

function getRooms(callback) {
    const querySnapshot = getDocs(collection(db, 'chat-rooms'));
    const rooms = [];
    querySnapshot.then(data => {
        data.forEach((doc) => rooms.push(doc.id));
        callback(rooms)
    });
}

export { loginWithGoogle, loginAnonymously, createRoom, getRooms, sendMessage, getMessages };