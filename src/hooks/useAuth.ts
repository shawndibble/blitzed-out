import { useContext } from 'react';
import { AuthContext, AuthContextType as ContextAuthType } from '@/context/auth';

function useAuth(): ContextAuthType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export { useAuth };
export default useAuth;
