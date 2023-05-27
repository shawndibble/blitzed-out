import React from 'react';
import { AuthContext } from '../context/auth';

function useAuth() {
    const value = React.useContext(AuthContext);

    const authUser = localStorage.getItem('authUser');

    if (authUser && JSON.parse(authUser).user) {
        const user = JSON.parse(authUser);
        return { ...user, login: value.login }
    } 

    if (!value) {
        throw new Error("AuthContext's value is undefined.");
    }

    localStorage.setItem('authUser', JSON.stringify(value));

    return value;
}

export { useAuth };