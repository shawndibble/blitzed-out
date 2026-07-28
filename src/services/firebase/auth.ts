/**
 * Account lifecycle: sign-in, registration, anonymous upgrade, sign-out, and the
 * full local-data wipe that accompanies a reset.
 */
import { logger } from '@/utils/logger';
import {
  ACCOUNT_EXISTS,
  ACCOUNT_LINKED_NEEDS_SIGNIN,
  AuthError,
  createStandardError,
  getFirebaseErrorMessage,
  isIdentityTakenError,
} from '@/types/errors';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  getAuth,
  linkWithCredential,
  linkWithPopup,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithCredential,
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
    logger.error('Registration error', error);
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
    logger.error('Email login error', error);
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
    logger.error('Google login error', error);
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
    logger.error('Password reset error', error);
    throw new AuthError(
      getFirebaseErrorMessage(error),
      'PASSWORD_RESET_FAILED',
      createStandardError(error)
    );
  }
}

function requireAnonymousUser(): User {
  const user = getAuth().currentUser;
  if (!user?.isAnonymous) {
    throw new AuthError('User is not anonymous or not logged in', 'ACCOUNT_CONVERSION_FAILED');
  }
  return user;
}

function conversionError(error: unknown): AuthError {
  logger.error('Account conversion error', error);
  return new AuthError(
    getFirebaseErrorMessage(error),
    isIdentityTakenError(error) ? ACCOUNT_EXISTS : 'ACCOUNT_CONVERSION_FAILED',
    createStandardError(error)
  );
}

/**
 * The link landed but the re-auth did not. Reported separately because the
 * account now exists: retrying the link would fail, and the fix is a sign-in.
 * Left unresolved, `user.isAnonymous` reads false while the token still says
 * 'anonymous', which is exactly the mismatch that makes a public publish look
 * available and then get rejected.
 */
function postLinkSignInError(error: unknown): AuthError {
  logger.error('Post-link sign-in error', error);
  return new AuthError(
    getFirebaseErrorMessage(error),
    ACCOUNT_LINKED_NEEDS_SIGNIN,
    createStandardError(error)
  );
}

/**
 * Upgrade the anonymous account in place, preserving its uid so content it
 * already published stays reachable.
 *
 * Linking alone is not enough: the session's `sign_in_provider` claim stays
 * 'anonymous', and Firestore rules gate public pack publishing on that claim.
 * Signing in with the credential we just linked re-mints the token as
 * 'password' on the same uid — and because we never sign out, `user` never goes
 * null, so a caller mid-flow (the pack creator) is not unmounted.
 */
export async function convertAnonymousAccount(
  email: string,
  password: string,
  displayName = ''
): Promise<User> {
  const user = requireAnonymousUser();
  const auth = getAuth();
  try {
    const credential = EmailAuthProvider.credential(email, password);
    await linkWithCredential(user, credential);
  } catch (error) {
    throw conversionError(error);
  }
  try {
    const reauthenticated = await signInWithEmailAndPassword(auth, email, password);
    if (displayName && displayName !== reauthenticated.user.displayName) {
      await updateProfile(reauthenticated.user, { displayName });
    }
    return reauthenticated.user;
  } catch (error) {
    throw postLinkSignInError(error);
  }
}

/**
 * Google equivalent of {@link convertAnonymousAccount}. The popup's own OAuth
 * credential is reused for the re-auth, so the user is never prompted twice.
 */
export async function linkGoogleAccount(): Promise<User> {
  const user = requireAnonymousUser();
  const auth = getAuth();
  let result: Awaited<ReturnType<typeof linkWithPopup>>;
  try {
    result = await linkWithPopup(user, new GoogleAuthProvider());
  } catch (error) {
    throw conversionError(error);
  }
  try {
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential) {
      throw new Error('Google link returned no credential to re-authenticate with');
    }
    const reauthenticated = await signInWithCredential(auth, credential);
    return reauthenticated.user;
  } catch (error) {
    throw postLinkSignInError(error);
  }
}

export async function logout(): Promise<boolean> {
  try {
    const auth = getAuth();
    await signOut(auth);
    return true;
  } catch (error) {
    logger.error('Firebase operation failed', error);
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
        logger.warn(`Failed to remove localStorage key: ${key}`, error);
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
          logger.warn(`Failed to remove localStorage key: ${key}`, error);
        }
      }
    });

    // Clear sessionStorage (Firebase auth data)
    try {
      sessionStorage.clear();
    } catch (error) {
      logger.warn('Failed to clear sessionStorage', error);
    }

    // Clear IndexedDB via Dexie
    try {
      const { default: db } = await import('@/stores/store');
      // Close the database first to prevent blocked delete operations
      db.close();
      await db.delete();
    } catch (error) {
      logger.warn('Failed to clear IndexedDB', error);
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
    logger.error('Error wiping app data:', error);
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
    logger.error('Firebase operation failed', error);
    return getAuth().currentUser;
  }
}
