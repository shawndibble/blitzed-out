import { useContext } from 'react';
import AppSkeleton from '../AppSkeleton';
import { AuthContext, AuthProvider } from '../../context/auth';
import AllProviders from '../AllProviders';
import RouterSetup from '../RouterSetup';

function AppContent() {
  const auth = useContext(AuthContext);

  // Show skeleton during auth loading
  if (!auth || auth.initializing) {
    return <AppSkeleton />;
  }

  return (
    <AllProviders>
      <RouterSetup />
    </AllProviders>
  );
}

export default function FullApp() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
