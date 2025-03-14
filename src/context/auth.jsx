import React, { useEffect, useMemo, useState } from 'react';
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
import { syncDataFromFirebase, syncAllDataToFirebase } from '@/services/syncService';

const AuthContext = React.createContext();

function AuthProvider(props) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState({ syncing: false, lastSync: null });

  async function login(displayName = '') {
    try {
      const loggedInUser = await loginAnonymously(displayName);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function loginEmail(email, password) {
    try {
      setLoading(true);
      const loggedInUser = await loginWithEmail(email, password);
      setUser(loggedInUser);
      
      // Sync data from Firebase after login
      if (!loggedInUser.isAnonymous) {
        setSyncStatus({ syncing: true, lastSync: null });
        await syncDataFromFirebase();
        setSyncStatus({ syncing: false, lastSync: new Date() });
      }
      
      return loggedInUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function loginGoogle() {
    try {
      setLoading(true);
      const loggedInUser = await loginWithGoogle();
      setUser(loggedInUser);
      
      // Sync data from Firebase after login
      if (!loggedInUser.isAnonymous) {
        setSyncStatus({ syncing: true, lastSync: null });
        await syncDataFromFirebase();
        setSyncStatus({ syncing: false, lastSync: new Date() });
      }
      
      return loggedInUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function register(email, password, displayName) {
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

  async function forgotPassword(email) {
    try {
      await resetPassword(email);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function convertToRegistered(email, password) {
    try {
      setLoading(true);
      const convertedUser = await convertAnonymousAccount(email, password);
      setUser(convertedUser);
      
      // Sync local data to Firebase after conversion
      setSyncStatus({ syncing: true, lastSync: null });
      await syncAllDataToFirebase();
      setSyncStatus({ syncing: false, lastSync: new Date() });
      
      return convertedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }
  
  async function updateUser(displayName = '') {
    try {
      const updatedUser = await updateDisplayName(displayName);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }
  
  async function logoutUser() {
    try {
      // Sync data to Firebase before logout if user is not anonymous
      if (user && !user.isAnonymous) {
        setSyncStatus({ syncing: true, lastSync: syncStatus.lastSync });
        await syncAllDataToFirebase();
        setSyncStatus({ syncing: false, lastSync: new Date() });
      }
      
      await logout();
      setUser(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }
  
  async function syncData() {
    if (!user || user.isAnonymous) return false;
    
    try {
      setSyncStatus({ syncing: true, lastSync: syncStatus.lastSync });
      await syncAllDataToFirebase();
      setSyncStatus({ syncing: false, lastSync: new Date() });
      return true;
    } catch (err) {
      setError(err.message);
      setSyncStatus({ syncing: false, lastSync: syncStatus.lastSync });
      return false;
    }
  }

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((userData) => {
      setUser(userData || null);
      setLoading(false);
      
      // If user is logged in and not anonymous, sync data from Firebase
      if (userData && !userData.isAnonymous) {
        setSyncStatus({ syncing: true, lastSync: null });
        syncDataFromFirebase().then(() => {
          setSyncStatus({ syncing: false, lastSync: new Date() });
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Set up periodic sync for logged-in non-anonymous users
  useEffect(() => {
    if (!user || user.isAnonymous) return;
    
    const syncInterval = setInterval(() => {
      syncData();
    }, 5 * 60 * 1000); // Sync every 5 minutes
    
    return () => clearInterval(syncInterval);
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

export { AuthContext, AuthProvider };
