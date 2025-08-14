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

// eslint-disable-next-line react-refresh/only-export-components
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
      let hasStoredAuth = false;

      try {
        // Check if there's a stored user session or token
        hasStoredAuth = !!(
          localStorage.getItem('firebase:authUser:') ||
          sessionStorage.getItem('firebase:authUser:') ||
          document.cookie.includes('firebase-auth')
        );
      } catch (error) {
        // Handle SecurityError in iOS Safari private browsing or restricted contexts
        console.warn(
          'Authentication check failed due to storage restrictions (e.g., private browsing mode):',
          error && error.message ? error.message : error
        );
        hasStoredAuth = false;
      }

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
