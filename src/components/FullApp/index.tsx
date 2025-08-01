import { Suspense, lazy, useContext } from 'react';
import { ProvidersProps } from '../../types/app';
import AppSkeleton from '../AppSkeleton';
import { AuthContext, AuthProvider } from '../../context/auth';

// Lazy load ALL heavy dependencies
const MuiProviders = lazy(() => import('../MuiProviders'));
const RouterSetup = lazy(() => import('../RouterSetup'));
const ThemeProvider = lazy(() =>
  import('../../context/theme').then((m) => ({ default: m.ThemeProvider }))
);
const MigrationProvider = lazy(() =>
  import('../../context/migration').then((m) => ({ default: m.MigrationProvider }))
);
// UserListProvider moved to RouterSetup to access route params
const ScheduleProvider = lazy(() =>
  import('../../context/schedule').then((m) => ({ default: m.ScheduleProvider }))
);

function Providers({ children }: ProvidersProps) {
  return (
    <Suspense fallback={<AppSkeleton />}>
      <MigrationProvider>
        <ScheduleProvider>{children}</ScheduleProvider>
      </MigrationProvider>
    </Suspense>
  );
}

function AppContent() {
  const auth = useContext(AuthContext);

  // Show skeleton during auth loading
  if (!auth || auth.initializing) {
    return <AppSkeleton />;
  }

  return (
    <Suspense fallback={<AppSkeleton />}>
      <ThemeProvider>
        <Providers>
          <MuiProviders>
            <RouterSetup />
          </MuiProviders>
        </Providers>
      </ThemeProvider>
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
