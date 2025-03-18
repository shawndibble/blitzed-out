import { useContext } from 'react';
import { AuthContext, AuthContextType } from '@/context/auth';

export default function useAuth(): Omit<AuthContextType, 'user'> & {
  user: NonNullable<AuthContextType['user']>;
} {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context as Omit<AuthContextType, 'user'> & { user: NonNullable<AuthContextType['user']> };
}
