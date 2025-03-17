import { useContext } from 'react';
import { AuthContext } from '@/context/auth';

interface User {
  uid: string;
  displayName: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User;
  updateUser: (user: Partial<User>) => Promise<User>;
  [key: string]: any;
}

function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export { useAuth };
export default useAuth;
