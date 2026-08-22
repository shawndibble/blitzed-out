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
  persistentSingleTabManager,
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

// `persistentLocalCache` touches `localStorage` lazily, after this module's own
// try/catch below has returned, so probe with a real write here — Firestore's own
// fallback logic doesn't trust a raw `DOMException` from there.
function isStorageBlocked(): boolean {
  const probeKey = '__firestore_storage_probe__';
  try {
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
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
        // Single-tab, not multi-tab: `persistentMultipleTabManager` enables
        // Firestore's cross-tab target sync, whose `syncEngineApplyActiveTargetsChange`
        // feeds a cache miss (`null`) straight into `localStoreAllocateTarget`. That
        // throws inside the async queue and trips INTERNAL ASSERTION b815, which bricks
        // the client for the rest of the session. The null is manufactured inside the
        // SDK, so no app-side seam can catch it; dropping the tab manager removes the
        // code path. A second tab falls back to an in-memory cache (its persistence
        // start() rejects FAILED_PRECONDITION, which Firestore handles) — it still works,
        // it just re-reads from the server. See docs/adr/0001-pwa-offline-support.md.
        tabManager: persistentSingleTabManager({ forceOwnership: false }),
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
