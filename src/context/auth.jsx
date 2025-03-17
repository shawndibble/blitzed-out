import React, { useEffect, useMemo, useState, useRef, ReactNode } from 'react';
import { getAuth, User } from 'firebase/auth';
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
import { syncDataFromFirebase, syncAllDataToFirebase } from '@/services/syncService';

export interface SyncStatus {
  syncing: boolean;
  lastSync: Date | null;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
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

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  [key: string]: any;
}

function AuthProvider(props: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ syncing: false, lastSync: null });

  // Debounce mechanism for sync operations
  const syncTimeoutRef = useRef<number | null>(null);

  // Function to safely perform sync operations with debouncing
  const performSync = async (syncFunction: () => Promise<boolean>): Promise<boolean> => {
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
    } catch (err) {
      console.error('Sync error:', err);
      setError(err.message);
      setSyncStatus({ syncing: false, lastSync: syncStatus.lastSync });
      return false;
    }
  };
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
      setError(err.message);
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
      setError(err.message);
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
      setError(err.message);
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
      setError(err.message);
      throw err;
    }
  }

  async function convertToRegistered(email: string, password: string): Promise<User> {
    try {
      setLoading(true);
      const convertedUser = await convertAnonymousAccount(email, password);
      setUser(convertedUser);

      // Sync local data to Firebase after conversion
      await performSync(syncAllDataToFirebase);

      return convertedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function updateUser(displayName = ''): Promise<User | null> {
    try {
      const updatedUser = await updateDisplayName(displayName);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function logoutUser(): Promise<void> {
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
      setError(err.message);
      throw err;
    }
  }

  async function syncData(): Promise<boolean> {
    return performSync(syncAllDataToFirebase);
  }

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((userData: User | null) => {
      setUser(userData || null);
      setLoading(false);

      // If user is logged in and not anonymous, sync data from Firebase
      if (userData && !userData.isAnonymous) {
        // Use debounced sync to prevent multiple rapid syncs
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }

        syncTimeoutRef.current = setTimeout(() => {
          setSyncStatus({ syncing: true, lastSync: null });
          syncDataFromFirebase()
            .then(() => {
              setSyncStatus({ syncing: false, lastSync: new Date() });
            })
            .catch((err) => {
              console.error('Error syncing from Firebase:', err);
              setSyncStatus({ syncing: false, lastSync: null });
            })
            .finally(() => {
              syncTimeoutRef.current = null;
            });
        }, 500); // 0.5 second debounce
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
    [user, loading, error, syncStatus]
  );

  return <AuthContext.Provider value={value} {...props} />;
}

export { AuthProvider };
