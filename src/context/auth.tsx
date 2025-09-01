import React, { useEffect, useMemo, useState, useRef, ReactNode, useCallback } from 'react';
import { User } from '@/types';
import { getErrorMessage } from '@/types/errors';
import { reportFirefoxMobileAuthError } from '@/utils/firefoxMobileReporting';
import { loadFirebase, preloadFirebase } from '@/utils/lazyFirebase';

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
  wipeAllData: () => Promise<void>;
  syncData: () => Promise<boolean>;
  intelligentSync: () => Promise<{ success: boolean; conflicts?: string[] }>;
  isAnonymous: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  [key: string]: unknown;
}

function AuthProvider(props: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // Changed: false by default for immediate UI
  const [initializing, setInitializing] = useState<boolean>(true); // New: tracks initial auth check
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ syncing: false, lastSync: null });

  // Debounce mechanism for sync operations
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setError(null); // Clear any previous errors
      const firebase = await loadFirebase();
      const loggedInUser = await firebase.loginAnonymously(displayName);

      if (!loggedInUser) {
        const error = new Error('Login failed: No user returned from Firebase');
        reportFirefoxMobileAuthError('auth_context_no_user', error, {
          authentication: {
            step: 'auth_context_no_user',
            displayName,
          },
        });
        setError(error.message);
        return null;
      }

      setUser(loggedInUser);
      return loggedInUser;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);

      // Normalize the error to ensure it's an Error object
      const normalizedError =
        err instanceof Error ? err : new Error(String(err || 'Unknown error'));

      reportFirefoxMobileAuthError('auth_context_login_failed', normalizedError, {
        authentication: {
          step: 'auth_context_login_failed',
          displayName,
        },
      });

      setError(errorMessage);
      throw err;
    }
  }

  async function loginEmail(email: string, password: string): Promise<User> {
    try {
      setLoading(true);
      const firebase = await loadFirebase();
      const loggedInUser = await firebase.loginWithEmail(email, password);
      setUser(loggedInUser);

      // Sync will happen via onAuthStateChanged
      return loggedInUser;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function loginGoogle(): Promise<User> {
    try {
      setLoading(true);
      const firebase = await loadFirebase();
      const loggedInUser = await firebase.loginWithGoogle();
      setUser(loggedInUser);

      // Sync will happen via onAuthStateChanged
      return loggedInUser;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function register(email: string, password: string, displayName: string): Promise<User> {
    try {
      setLoading(true);
      const firebase = await loadFirebase();
      const registeredUser = await firebase.registerWithEmail(email, password, displayName);
      setUser(registeredUser);
      return registeredUser;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function forgotPassword(email: string): Promise<boolean> {
    try {
      const firebase = await loadFirebase();
      await firebase.resetPassword(email);
      return true;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    }
  }

  const convertToRegistered = useCallback(
    async (email: string, password: string): Promise<User> => {
      try {
        setLoading(true);
        const firebase = await loadFirebase();
        const convertedUser = await firebase.convertAnonymousAccount(email, password);
        setUser(convertedUser);

        // Sync local data to Firebase after conversion
        const { syncAllDataToFirebase } = await import('@/services/syncService');
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
      const firebase = await loadFirebase();
      const updatedUser = await firebase.updateDisplayName(displayName);
      setUser(updatedUser);
      return updatedUser;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    }
  }

  const logoutUser = useCallback(async (): Promise<void> => {
    try {
      // Sync data to Firebase before logout if user is not anonymous
      if (user && !user.isAnonymous) {
        // Add timeout to make sure logout doesn't hang
        const { syncAllDataToFirebase } = await import('@/services/syncService');
        const syncPromise = performSync(syncAllDataToFirebase);
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 5000, false));
        await Promise.race([syncPromise, timeoutPromise]);
      }

      const firebase = await loadFirebase();
      await firebase.logout();
      setUser(null);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    }
  }, [user, performSync, setUser, setError]);

  const wipeAllAppDataAndReload = useCallback(async (): Promise<void> => {
    try {
      // Use the comprehensive wipe function from firebase service
      const firebase = await loadFirebase();
      await firebase.wipeAllAppData();

      // Clear user state
      setUser(null);

      // Reload the page to ensure all React state is reset
      window.location.reload();
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    }
  }, [setUser, setError]);

  const syncData = useCallback(async (): Promise<boolean> => {
    const { syncAllDataToFirebase } = await import('@/services/syncService');
    return performSync(syncAllDataToFirebase);
  }, [performSync]);

  const handleIntelligentSync = useCallback(async (): Promise<{
    success: boolean;
    conflicts?: string[];
  }> => {
    // Don't use performSync wrapper for intelligent sync as it needs custom return type
    if (!user || user.isAnonymous) {
      return { success: false, conflicts: ['User not logged in or is anonymous'] };
    }

    try {
      setSyncStatus({ syncing: true, lastSync: syncStatus.lastSync });
      const { intelligentSync } = await import('@/services/syncService');
      const result = await intelligentSync();
      setSyncStatus({ syncing: false, lastSync: new Date() });
      return result;
    } catch (err: unknown) {
      console.error('Intelligent sync error:', err);
      setSyncStatus({ syncing: false, lastSync: syncStatus.lastSync });
      if (err instanceof Error) {
        setError(err.message);
      }
      return { success: false, conflicts: ['Sync failed due to error'] };
    }
  }, [user, syncStatus.lastSync]);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isSubscribed = true;

    const initializeAuth = async () => {
      try {
        // Load Firebase lazily to initialize it
        await loadFirebase();
        const { getAuth } = await import('firebase/auth');

        if (!isSubscribed) return; // Component unmounted

        const auth = getAuth();
        unsubscribe = auth.onAuthStateChanged(async (userData: User | null) => {
          if (!isSubscribed) return; // Component unmounted

          setUser(userData || null);

          // Mark initial auth check as complete
          if (!authInitializedRef.current) {
            authInitializedRef.current = true;
            setInitializing(false);
          }

          // If user is logged in and not anonymous, defer sync operations
          if (userData && !userData.isAnonymous) {
            // Defer sync to not block UI rendering - use requestIdleCallback or fallback
            const deferSync = async () => {
              // Use debounced sync to prevent multiple rapid syncs
              if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
              }

              syncTimeoutRef.current = setTimeout(async () => {
                setSyncStatus({ syncing: true, lastSync: null });

                try {
                  // Load sync services lazily
                  const { syncDataFromFirebase, startPeriodicSync } = await import(
                    '@/services/syncService'
                  );

                  await syncDataFromFirebase();
                  setSyncStatus({ syncing: false, lastSync: new Date() });

                  // Start periodic sync after initial sync completes
                  startPeriodicSync();
                } catch (err) {
                  console.error('Error syncing from Firebase:', err);
                  setSyncStatus({ syncing: false, lastSync: null });
                } finally {
                  syncTimeoutRef.current = null;
                }
              }, 3000); // Increased delay to 3 seconds to ensure UI is fully loaded first
            };

            if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
              (
                window as Window & {
                  requestIdleCallback: (
                    callback: () => void,
                    options?: { timeout: number }
                  ) => void;
                }
              ).requestIdleCallback(deferSync, { timeout: 10000 });
            } else {
              // Fallback for browsers without requestIdleCallback - wait longer to allow UI to fully load
              setTimeout(deferSync, 5000);
            }
          } else {
            // User is logged out or anonymous, stop periodic sync
            try {
              const { stopPeriodicSync } = await import('@/services/syncService');
              stopPeriodicSync();
            } catch (err) {
              console.warn('Could not load sync service to stop periodic sync:', err);
            }
          }
        });

        // Make auth context available globally for middleware
        (window as Window & { authContext?: { user: User | null } }).authContext = { user: null };
      } catch (error) {
        console.error('Failed to initialize Firebase auth:', error);
        // Mark as initialized even on error to prevent infinite loading
        if (!authInitializedRef.current) {
          authInitializedRef.current = true;
          setInitializing(false);
        }
      }
    };

    // Start Firebase initialization
    initializeAuth();

    // Start preloading Firebase in the background for faster subsequent operations
    preloadFirebase();

    // Clean up function
    return () => {
      isSubscribed = false;
      if (unsubscribe) {
        unsubscribe();
      }
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      (window as Window & { authContext?: { user: User | null } }).authContext = undefined;
    };
  }, []);

  // Update global auth context when user changes
  useEffect(() => {
    const globalWindow = window as Window & { authContext?: { user: User | null } };
    if (globalWindow.authContext) {
      globalWindow.authContext.user = user;
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
      wipeAllData: wipeAllAppDataAndReload,
      syncData,
      intelligentSync: handleIntelligentSync,
      isAnonymous: user?.isAnonymous || false,
    }),
    [
      user,
      loading,
      initializing,
      error,
      syncStatus,
      convertToRegistered,
      logoutUser,
      wipeAllAppDataAndReload,
      syncData,
      handleIntelligentSync,
    ]
  );

  return <AuthContext.Provider value={value} {...props} />;
}

export { AuthProvider };
