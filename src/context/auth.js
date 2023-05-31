import React, { useEffect } from 'react';
import { loginAnonymously, updateDisplayName } from '../services/firebase';
import { getAuth } from 'firebase/auth';

const AuthContext = React.createContext();

const AuthProvider = (props) => {
    const [user, setUser] = React.useState(null);

    const login = async (displayName = '') => {
        const user = await loginAnonymously(displayName);
        setUser(user);
    };

    const updateUser = async (displayName = '') => {
        const user = await updateDisplayName(displayName);
        setUser(user);
    }

    useEffect(() => {
        getAuth().onAuthStateChanged(async (userData) => setUser(userData || null))
    }, []);

    const value = { user, login, updateUser };

    return <AuthContext.Provider value={value} {...props} />;
};

export { AuthContext, AuthProvider };