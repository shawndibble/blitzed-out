import { useEffect, useMemo, useState, useRef, ReactNode, createContext, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import {
  loginAnonymously,
  updateDisplayName,
  loginWithEmail,
  loginWithGoogle,
  registerWithEmail,
  resetPassword,
  convertAnonymousAccount,
  logout,
} from '@/services/firebase';
import {
  syncDataFromFirebase,
  syncAllDataToFirebase,
  startPeriodicSync,
  stopPeriodicSync,
} from '@/services/syncService';
import { User } from '@/types';

export interface SyncStatus {
  syncing: boolean;
  lastSync: Date | null;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  initializing: boolean;
  error: string | null;
  syncStatus: SyncStatus;
  login: (displayName?: string) => Promise<User | null>;
  loginEmail: (email: string, password: string) => Promise<User>;
  loginGoogle: () => Promise<User>;
  register: (email: string, password: string, displayName: string) => Promise<User>;
  updateUser: (displayName?: string) => Promise<User | null>;
  forgotPassword: (email: string) => Promise<boolean>;
  convertToRegistered: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  syncData: () => Promise<boolean>;
  isAnonymous: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  [key: string]: any;
}

function AuthProvider(props: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // Changed: false by default for immediate UI
  const [initializing, setInitializing] = useState<boolean>(true); // New: tracks initial auth check
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ syncing: false, lastSync: null });

  // Debounce mechanism for sync operations
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track if initial auth check is complete
  const authInitializedRef = useRef<boolean>(false);

  // Function to safely perform sync operations with debouncing
  const performSync = useCallback(
    async (syncFunction: () => Promise<boolean>): Promise<boolean> => {
      // Clear any pending sync timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }

      // Return early if user is not logged in or is anonymous
      if (!user || user.isAnonymous) return false;

      try {
        setSyncStatus({ syncing: true, lastSync: syncStatus.lastSync });
        await syncFunction();
        setSyncStatus({ syncing: false, lastSync: new Date() });
        return true;
      } catch (err: unknown) {
        console.error('Sync error:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
        setSyncStatus({ syncing: false, lastSync: syncStatus.lastSync });
        return false;
      }
    },
    [user, syncTimeoutRef, setSyncStatus, syncStatus.lastSync, setError]
  );
  async function login(displayName = ''): Promise<User | null> {
    try {
      const loggedInUser = await loginAnonymously(displayName);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }

  async function loginEmail(email: string, password: string): Promise<User> {
    try {
      setLoading(true);
      const loggedInUser = await loginWithEmail(email, password);
      setUser(loggedInUser);

      // Sync will happen via onAuthStateChanged
      return loggedInUser;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function loginGoogle(): Promise<User> {
    try {
      setLoading(true);
      const loggedInUser = await loginWithGoogle();
      setUser(loggedInUser);

      // Sync will happen via onAuthStateChanged
      return loggedInUser;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function register(email: string, password: string, displayName: string): Promise<User> {
    try {
      setLoading(true);
      const registeredUser = await registerWithEmail(email, password, displayName);
      setUser(registeredUser);
      return registeredUser;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function forgotPassword(email: string): Promise<boolean> {
    try {
      await resetPassword(email);
      return true;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
      throw err;
    }
  }

  const convertToRegistered = useCallback(
    async (email: string, password: string): Promise<User> => {
      try {
        setLoading(true);
        const convertedUser = await convertAnonymousAccount(email, password);
        setUser(convertedUser);

        // Sync local data to Firebase after conversion
        await performSync(syncAllDataToFirebase);

        return convertedUser;
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setUser, performSync, setError]
  );

  async function updateUser(displayName = ''): Promise<User | null> {
    try {
      const updatedUser = await updateDisplayName(displayName);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
      throw err;
    }
  }

  const logoutUser = useCallback(async (): Promise<void> => {
    try {
      // Sync data to Firebase before logout if user is not anonymous
      if (user && !user.isAnonymous) {
        // Add timeout to make sure logout doesn't hang
        const syncPromise = performSync(syncAllDataToFirebase);
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 5000, false));
        await Promise.race([syncPromise, timeoutPromise]);
      }

      await logout();
      setUser(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
      throw err;
    }
  }, [user, performSync, setUser, setError]);

  const syncData = useCallback(async (): Promise<boolean> => {
    return performSync(syncAllDataToFirebase);
  }, [performSync]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((userData: User | null) => {
      setUser(userData || null);

      // Mark initial auth check as complete
      if (!authInitializedRef.current) {
        authInitializedRef.current = true;
        setInitializing(false);
      }

      // If user is logged in and not anonymous, defer sync operations
      if (userData && !userData.isAnonymous) {
        // Defer sync to not block UI rendering - use requestIdleCallback or fallback
        const deferSync = () => {
          // Use debounced sync to prevent multiple rapid syncs
          if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
          }

          syncTimeoutRef.current = setTimeout(() => {
            setSyncStatus({ syncing: true, lastSync: null });

            // Handle case where syncDataFromFirebase might not be defined (e.g., in tests)
            const syncPromise = syncDataFromFirebase
              ? syncDataFromFirebase()
              : Promise.resolve(false);

            syncPromise
              .then(() => {
                setSyncStatus({ syncing: false, lastSync: new Date() });
                // Start periodic sync after initial sync completes
                if (startPeriodicSync) {
                  startPeriodicSync();
                }
              })
              .catch((err) => {
                console.error('Error syncing from Firebase:', err);
                setSyncStatus({ syncing: false, lastSync: null });
              })
              .finally(() => {
                syncTimeoutRef.current = null;
              });
          }, 1000); // Increased debounce to allow UI to render first
        };

        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          (window as any).requestIdleCallback(deferSync, { timeout: 5000 });
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(deferSync, 100);
        }
      } else {
        // User is logged out or anonymous, stop periodic sync
        if (stopPeriodicSync) {
          stopPeriodicSync();
        }
      }
    });

    // Make auth context available globally for middleware
    (window as any).authContext = { user: null };

    // Clean up function
    return () => {
      unsubscribe();
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      // Make sure to stop periodic sync when component unmounts
      if (stopPeriodicSync) {
        stopPeriodicSync();
      }
      (window as any).authContext = undefined;
    };
  }, []);

  // Update global auth context when user changes
  useEffect(() => {
    if ((window as any).authContext) {
      (window as any).authContext.user = user;
    }
  }, [user]);
  const value = useMemo(
    () => ({
      user,
      loading,
      initializing,
      error,
      syncStatus,
      login,
      loginEmail,
      loginGoogle,
      register,
      updateUser,
      forgotPassword,
      convertToRegistered,
      logout: logoutUser,
      syncData,
      isAnonymous: user?.isAnonymous || false,
    }),
    [user, loading, initializing, error, syncStatus, convertToRegistered, logoutUser, syncData]
  );

  return <AuthContext.Provider value={value} {...props} />;
}

export { AuthProvider };
