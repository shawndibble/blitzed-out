import React from 'react';
import { loginAnonymously } from '../services/firebase';

const AuthContext = React.createContext();

const AuthProvider = (props) => {
    const [user, setUser] = React.useState(null);

    const login = async (displayName = '') => {
        const user = await loginAnonymously(displayName);
        setUser(user);
    };

    const value = { user, login };

    return <AuthContext.Provider value={value} {...props} />;
};

export { AuthContext, AuthProvider };