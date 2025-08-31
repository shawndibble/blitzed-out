/**
 * Lazy Firebase loader - loads Firebase services only when needed
 * This removes Firebase from the critical path for better initial page load performance
 */

let firebasePromise: Promise<typeof import('@/services/firebase')> | null = null;
let firebaseLoaded = false;

/**
 * Lazy load Firebase services
 * @returns Promise that resolves to Firebase service functions
 */
export const loadFirebase = async () => {
  if (firebaseLoaded) {
    return await import('@/services/firebase');
  }

  if (!firebasePromise) {
    firebasePromise = import('@/services/firebase');
  }

  const firebase = await firebasePromise;
  firebaseLoaded = true;
  return firebase;
};

/**
 * Check if Firebase is already loaded
 * @returns boolean indicating if Firebase is loaded
 */
export const isFirebaseLoaded = () => firebaseLoaded;

/**
 * Preload Firebase in the background (non-blocking)
 * Call this after initial render to warm up Firebase
 */
export const preloadFirebase = () => {
  if (!firebaseLoaded && !firebasePromise) {
    // Use requestIdleCallback for non-blocking background loading
    if ('requestIdleCallback' in window) {
      requestIdleCallback(
        () => {
          loadFirebase();
        },
        { timeout: 2000 }
      );
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        loadFirebase();
      }, 100);
    }
  }
};
