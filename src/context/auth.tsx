import React, { useCallback, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { User } from '@/types';
import { getErrorMessage } from '@/types/errors';
import { registerSyncProvider } from '@/services/authBridge';
import { reportFirefoxMobileAuthError } from '@/utils/firefoxMobileReporting';
import { loadFirebase, preloadFirebase } from '@/utils/lazyFirebase';
import { useAuthSync } from '@/hooks/useAuthSync';
import type { SyncStatus } from '@/hooks/useAuthSync';

export type { SyncStatus };

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
  const [loading, setLoading] = useState<boolean>(false);
  const [initializing, setInitializing] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Track if initial auth check is complete
  const authInitializedRef = useRef<boolean>(false);

  const { syncStatus, syncData, intelligentSync: handleIntelligentSync } = useAuthSync(user);

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
        await syncData();
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
    [setLoading, setUser, syncData, setError]
  );

  async function updateUser(displayName = ''): Promise<User | null> {
    try {
      const firebase = await loadFirebase();
      const updatedUser = await firebase.updateDisplayName(displayName);
      if (updatedUser !== null) {
        setUser(updatedUser);
      }
      return updatedUser;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    }
  }

  const logoutUser = useCallback(async (): Promise<void> => {
    try {
      if (user && !user.isAnonymous) {
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 5000, false));
        await Promise.race([syncData(), timeoutPromise]);
      }

      const firebase = await loadFirebase();
      await firebase.logout();
      setUser(null);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    }
  }, [user, syncData, setUser, setError]);

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

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isSubscribed = true;

    const initializeAuth = async () => {
      try {
        await loadFirebase();
        const { getAuth } = await import('firebase/auth');

        if (!isSubscribed) return;

        const auth = getAuth();
        unsubscribe = auth.onAuthStateChanged((userData: User | null) => {
          if (!isSubscribed) return;

          setUser(userData || null);

          if (!authInitializedRef.current) {
            authInitializedRef.current = true;
            setInitializing(false);
          }
        });
      } catch (error) {
        console.error('Failed to initialize Firebase auth:', error);
        if (!authInitializedRef.current) {
          authInitializedRef.current = true;
          setInitializing(false);
        }
      }
    };

    initializeAuth();
    preloadFirebase();

    return () => {
      isSubscribed = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => registerSyncProvider({ user, syncData }), [user, syncData]);

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
