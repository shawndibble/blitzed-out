/**
 * The only module that initializes Firebase and hands out SDK handles.
 *
 * Every other module reaches Firestore through the `db` exported here, so there
 * is no second route to the SDK and no second app instance.
 */
import { logger } from '@/utils/logger';
import { getDatabase } from 'firebase/database';
import { getFunctions } from 'firebase/functions';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';
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

const app = initializeApp(firebaseConfig);

// Memory, not IndexedDB: both tab managers can wedge Firestore's queue (b815) for the session.
// Dexie holds gameplay data, so a disk cache buys little. See docs/adr/0001-pwa-offline-support.md.
export const db = initializeFirestore(app, { localCache: memoryLocalCache() });

// Old builds left chat/user data in this DB; nothing reads it and the data wipe misses it. Raw
// deleteDatabase, not clearIndexedDbPersistence: that runs on Firestore's queue and stalls every
// query while an old-build tab holds the DB open. Drop once old builds age out (~2027).
function deleteLegacyFirestoreCache(): void {
  if (!firebaseConfig.projectId) return;
  try {
    window.indexedDB?.deleteDatabase(`firestore/${app.name}/${firebaseConfig.projectId}/main`);
  } catch (error) {
    logger.warn('Could not delete legacy Firestore cache', error);
  }
}

deleteLegacyFirestoreCache();

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
