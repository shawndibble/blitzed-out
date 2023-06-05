import React, { useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { loginAnonymously, updateDisplayName } from '../services/firebase';

const AuthContext = React.createContext();

function AuthProvider(props) {
  const [user, setUser] = React.useState(null);

  async function login(displayName = '') {
    const loggedInUser = await loginAnonymously(displayName);
    setUser(loggedInUser);
  }

  async function updateUser(displayName = '') {
    const updatedUser = await updateDisplayName(displayName);
    setUser(updatedUser);
  }

  useEffect(() => {
    getAuth().onAuthStateChanged(async (userData) => setUser(userData || null));
  }, []);

  const value = { user, login, updateUser };

  return <AuthContext.Provider value={value} {...props} />;
}

export { AuthContext, AuthProvider };
