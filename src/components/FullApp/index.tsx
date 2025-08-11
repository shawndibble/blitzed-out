import { Suspense, lazy, useContext } from 'react';
import AppSkeleton from '../AppSkeleton';
import { AuthContext, AuthProvider } from '../../context/auth';

// Reduce nesting by consolidating providers and lazy loading only the router
const AllProviders = lazy(() => import('../AllProviders'));
const RouterSetup = lazy(() => import('../RouterSetup'));

function AppContent() {
  const auth = useContext(AuthContext);

  // Show skeleton during auth loading
  if (!auth || auth.initializing) {
    return <AppSkeleton />;
  }

  return (
    <Suspense fallback={<AppSkeleton />}>
      <AllProviders>
        <RouterSetup />
      </AllProviders>
    </Suspense>
  );
}

export default function FullApp() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
