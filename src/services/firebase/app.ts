/**
 * The only module that initializes Firebase and hands out SDK handles.
 *
 * Every other module reaches Firestore through the `db` exported here, so there
 * is no second route to the SDK and no second app instance.
 */
import { logger } from '@/utils/logger';
import { getDatabase } from 'firebase/database';
import { getFunctions } from 'firebase/functions';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

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
  logger.error('Missing Firebase environment variables', missingVars);
  logger.error('Please check your .env file and ensure all VITE_FIREBASE_* variables are set');
}

/**
 * `persistentMultipleTabManager` reaches for `window.localStorage` (cross-tab
 * coordination) the first time Firestore lazily opens IndexedDB persistence —
 * well after this module's synchronous `try`/`catch` below has returned. On
 * some iOS Safari configurations (Lockdown Mode, aggressive tracking
 * prevention) merely reading `localStorage` throws `SecurityError`, and
 * Firestore's own fallback-to-memory logic only trusts `FirebaseError`s or a
 * missing `indexedDB` global — a raw `DOMException` with `indexedDB` present
 * slips past it and surfaces as an unhandled rejection instead of degrading.
 * Probing here, before persistence is ever requested, catches that case too.
 */
function isStorageBlocked(): boolean {
  try {
    void window.localStorage;
    return false;
  } catch {
    return true;
  }
}

const app = initializeApp(firebaseConfig);

function initializeFirestoreWithFallback(): ReturnType<typeof initializeFirestore> {
  if (isStorageBlocked()) {
    if (import.meta.env.DEV) logger.error('Storage blocked, using in-memory Firestore cache');
    return initializeFirestore(app, {});
  }

  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch (e) {
    // IndexedDB unavailable (private browsing, quota exceeded, etc.) — fall back to in-memory
    if (import.meta.env.DEV)
      logger.error('Firestore persistence unavailable, using in-memory cache:', e);
    return initializeFirestore(app, {});
  }
}

export const db = initializeFirestoreWithFallback();

// Firestore database initialized

// Realtime Database accessor for modules (e.g. roomPresence.ts) that need it
// but don't have access to the module-private `app` instance.
export function getRealtimeDb(): ReturnType<typeof getDatabase> {
  return getDatabase(app);
}

// Callable-functions accessor. Bound to `app` rather than the default instance so
// callers never depend on this module having been imported for its side effects.
export function getFunctionsClient(): ReturnType<typeof getFunctions> {
  return getFunctions(app);
}
