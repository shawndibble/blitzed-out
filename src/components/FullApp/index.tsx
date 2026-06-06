import { useContext } from 'react';
import AppSkeleton from '../AppSkeleton';
import { AuthContext, AuthProvider } from '../../context/auth';
import AllProviders from '../AllProviders';
import RouterSetup from '../RouterSetup';
import { useAmbientMusic } from '@/services/ambientMusic';
import useDocumentMeta from '@/hooks/useDocumentMeta';

function AppContent() {
  const auth = useContext(AuthContext);

  useDocumentMeta();
  useAmbientMusic();

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
