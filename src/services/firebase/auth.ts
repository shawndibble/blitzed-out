/**
 * Account lifecycle: sign-in, registration, anonymous upgrade, sign-out, and the
 * full local-data wipe that accompanies a reset.
 */
import { AuthError, createStandardError, getFirebaseErrorMessage } from '@/types/errors';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  getAuth,
  linkWithCredential,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { reportFirefoxMobileAuthError } from '@/utils/firefoxMobileReporting';

export async function loginAnonymously(displayName = ''): Promise<User | null> {
  try {
    const auth = getAuth();

    await signInAnonymously(auth);

    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName });
      return auth.currentUser;
    } else {
      const error = new Error('No current user after anonymous sign in');
      reportFirefoxMobileAuthError('anonymous_login_no_user', error, {
        authentication: {
          step: 'anonymous_login_no_user',
          displayName,
        },
      });
      return null;
    }
  } catch (error) {
    const authError = error as Error;
    reportFirefoxMobileAuthError('anonymous_login_failed', authError, {
      authentication: {
        step: 'anonymous_login_failed',
        displayName,
      },
    });

    throw new AuthError(
      getFirebaseErrorMessage(error),
      'ANONYMOUS_LOGIN_FAILED',
      createStandardError(error)
    );
  }
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName = ''
): Promise<User> {
  try {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    return userCredential.user;
  } catch (error) {
    console.error('Registration error', error);
    throw new AuthError(
      getFirebaseErrorMessage(error),
      'REGISTRATION_FAILED',
      createStandardError(error)
    );
  }
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  try {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Email login error', error);
    throw new AuthError(
      getFirebaseErrorMessage(error),
      'EMAIL_LOGIN_FAILED',
      createStandardError(error)
    );
  }
}

export async function loginWithGoogle(): Promise<User> {
  try {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential.user;
  } catch (error) {
    console.error('Google login error', error);
    throw new AuthError(
      getFirebaseErrorMessage(error),
      'GOOGLE_LOGIN_FAILED',
      createStandardError(error)
    );
  }
}

export async function resetPassword(email: string): Promise<boolean> {
  try {
    const auth = getAuth();
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error('Password reset error', error);
    throw new AuthError(
      getFirebaseErrorMessage(error),
      'PASSWORD_RESET_FAILED',
      createStandardError(error)
    );
  }
}

// Function to convert anonymous account to permanent account
export async function convertAnonymousAccount(email: string, password: string): Promise<User> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user?.isAnonymous) {
      const credential = EmailAuthProvider.credential(email, password);
      const result = await linkWithCredential(user, credential);
      return result.user;
    } else {
      throw new Error('User is not anonymous or not logged in');
    }
  } catch (error) {
    console.error('Account conversion error', error);
    throw new AuthError(
      getFirebaseErrorMessage(error),
      'ACCOUNT_CONVERSION_FAILED',
      createStandardError(error)
    );
  }
}

export async function logout(): Promise<boolean> {
  try {
    const auth = getAuth();
    await signOut(auth);
    return true;
  } catch (error) {
    console.error('Firebase operation failed', error);
    throw error;
  }
}

/**
 * Completely wipe all app data including localStorage, IndexedDB, sessionStorage, and cookies
 * This provides a complete reset for users who want to start fresh
 */
export async function wipeAllAppData(): Promise<void> {
  try {
    // First sign out from Firebase
    const auth = getAuth();
    await signOut(auth);

    // Clear all localStorage keys
    const keysToRemove = [
      'gameSettings',
      'messages-storage',
      'local-player-store',
      'i18nextLng',
      // Migration keys
      'blitzed-out-action-groups-migration',
      'blitzed-out-background-migration',
      'blitzed-out-migration-in-progress',
      'blitzed-out-current-language-migration',
      'blitzed-out-background-migration-in-progress',
      'blitzed-out-migration-health',
    ];

    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove localStorage key: ${key}`, error);
      }
    });

    // Clear any remaining localStorage keys that start with our app prefixes
    const appPrefixes = ['gameSettings', 'messages-storage', 'local-player-store', 'blitzed-out-'];
    const localStorageKeys = Object.keys(localStorage);
    localStorageKeys.forEach((key) => {
      if (appPrefixes.some((prefix) => key.startsWith(prefix))) {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to remove localStorage key: ${key}`, error);
        }
      }
    });

    // Clear sessionStorage (Firebase auth data)
    try {
      sessionStorage.clear();
    } catch (error) {
      console.warn('Failed to clear sessionStorage', error);
    }

    // Clear IndexedDB via Dexie
    try {
      const { default: db } = await import('@/stores/store');
      // Close the database first to prevent blocked delete operations
      db.close();
      await db.delete();
    } catch (error) {
      console.warn('Failed to clear IndexedDB', error);
    }

    // Clear cookies comprehensively by trying multiple path and domain combinations
    const cookiesToClear = ['i18next'];
    const currentHostname = window.location.hostname;

    // Generate possible domains (current domain and its parent domains)
    const domains = [currentHostname];
    if (currentHostname.includes('.')) {
      const parts = currentHostname.split('.');
      // Add parent domains (e.g., for app.example.com, try .example.com)
      for (let i = 1; i < parts.length - 1; i++) {
        domains.push(`.${parts.slice(i).join('.')}`);
      }
    }

    // Common paths where cookies might be set
    const paths = ['/', '/app', '/auth', '/login'];

    cookiesToClear.forEach((cookieName) => {
      // Try clearing with all combinations of domains and paths
      domains.forEach((domain) => {
        paths.forEach((path) => {
          try {
            // Clear regular cookie
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
            // Clear secure cookie (if applicable)
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; secure;`;
            // Clear httpOnly-accessible cookie (won't work from JS but attempt anyway)
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; httpOnly;`;
            // Clear SameSite variants
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; SameSite=Strict;`;
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; SameSite=Lax;`;
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; SameSite=None; secure;`;
          } catch {
            // Silently continue - many of these attempts will fail, which is expected
          }
        });
      });

      // Also try without specifying domain (for cookies set without explicit domain)
      paths.forEach((path) => {
        try {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; secure;`;
        } catch {
          // Silently continue
        }
      });
    });
  } catch (error) {
    console.error('Error wiping app data:', error);
    throw error;
  }
}

export async function updateDisplayName(displayName = ''): Promise<User | null> {
  try {
    const auth = getAuth();
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName });
      return auth.currentUser;
    }
    return null;
  } catch (error) {
    console.error('Firebase operation failed', error);
    return getAuth().currentUser;
  }
}
