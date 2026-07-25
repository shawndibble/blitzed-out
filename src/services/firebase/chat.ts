/**
 * Chat rooms: sending, deleting, and subscribing to a room's recent messages.
 *
 * Owns both directions of a room's messages, including the send-duplicate guard
 * and the read window (3 hours, newest 50).
 */
import {
  DocumentData,
  DocumentReference,
  QuerySnapshot,
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { MessageType } from '@/types/Message';
import { User as UserType } from '@/types';
import { db } from './app';

// Guards against a double submit (double-click, re-fired effect), NOT against a
// user genuinely repeating themselves — so it expires. It used to be an
// uncleared module global compared without any timestamp, which silently and
// permanently dropped every later copy of a message text in a room.
const DUPLICATE_WINDOW_MS = 3000;
let lastSend: { fingerprint: string; at: number } | null = null;

/** Newest messages a room subscription carries. */
const MESSAGE_LIMIT = 50;

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

  const now = Date.now();
  const fingerprint = JSON.stringify({ room, user: user.uid, text, type, ...rest });
  if (lastSend?.fingerprint === fingerprint && now - lastSend.at < DUPLICATE_WINDOW_MS) {
    return; // Same message twice in a moment — a double submit.
  }
  lastSend = { fingerprint, at: now };

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
    limit(MESSAGE_LIMIT)
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
