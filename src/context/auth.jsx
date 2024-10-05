import React, { useEffect, useMemo } from 'react';
import { getAuth } from 'firebase/auth';
import { loginAnonymously, updateDisplayName } from '@/services/firebase';

const AuthContext = React.createContext();

function AuthProvider(props) {
  const [user, setUser] = React.useState(null);

  async function login(displayName = '') {
    const loggedInUser = await loginAnonymously(displayName);
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function updateUser(displayName = '') {
    const updatedUser = await updateDisplayName(displayName);
    setUser(updatedUser);
    return updatedUser;
  }

  useEffect(() => {
    getAuth().onAuthStateChanged(async (userData) => setUser(userData || null));
  }, []);

  const value = useMemo(() => ({ user, login, updateUser }), [user]);

  return <AuthContext.Provider value={value} {...props} />;
}

export { AuthContext, AuthProvider };
