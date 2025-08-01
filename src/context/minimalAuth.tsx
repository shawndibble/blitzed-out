import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Minimal auth context for initial load - no Firebase imports
export interface MinimalAuthContextType {
  initializing: boolean;
  hasUser: boolean;
}

const MinimalAuthContext = createContext<MinimalAuthContextType>({
  initializing: true,
  hasUser: false,
});

export const useMinimalAuth = () => useContext(MinimalAuthContext);

interface MinimalAuthProviderProps {
  children: ReactNode;
}

export function MinimalAuthProvider({ children }: MinimalAuthProviderProps) {
  const [initializing, setInitializing] = useState(true);
  const [hasUser, setHasUser] = useState(false);

  useEffect(() => {
    // Quick check for existing auth without loading Firebase
    const checkAuth = () => {
      // Check if there's a stored user session or token
      const hasStoredAuth = !!(
        localStorage.getItem('firebase:authUser:') ||
        sessionStorage.getItem('firebase:authUser:') ||
        document.cookie.includes('firebase-auth')
      );

      setHasUser(hasStoredAuth);
      setInitializing(false);
    };

    // Small delay to allow instant loading screen to show
    setTimeout(checkAuth, 50);
  }, []);

  return (
    <MinimalAuthContext.Provider value={{ initializing, hasUser }}>
      {children}
    </MinimalAuthContext.Provider>
  );
}
