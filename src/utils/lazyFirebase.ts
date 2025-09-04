/**
 * Lazy Firebase loader - loads Firebase services only when needed
 * This removes Firebase from the critical path for better initial page load performance
 */

let firebasePromise: Promise<typeof import('@/services/firebase')> | null = null;
let firebaseLoaded = false;

/**
 * Retry dynamic import with exponential backoff
 */
const importWithRetry = async (retries = 3): Promise<typeof import('@/services/firebase')> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await import('@/services/firebase');
    } catch (error) {
      if (attempt === retries) throw error;

      // Wait before retry with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw new Error('All import attempts failed');
};

/**
 * Lazy load Firebase services
 * @returns Promise that resolves to Firebase service functions
 */
export const loadFirebase = async () => {
  if (!firebasePromise) {
    firebasePromise = importWithRetry();
  }

  if (firebaseLoaded) {
    return await firebasePromise;
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
          void loadFirebase();
        },
        { timeout: 2000 }
      );
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        void loadFirebase();
      }, 100);
    }
  }
};
