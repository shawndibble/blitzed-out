import './App.css';
import { Suspense, lazy } from 'react';
import AppSkeleton from '@/components/AppSkeleton';
import { useMinimalAuth } from '@/context/minimalAuth';

// Lazy load the ENTIRE app to reduce initial bundle to absolute minimum
const FullApp = lazy(() => import('@/components/FullApp'));

function App() {
  const { initializing } = useMinimalAuth();

  // Show skeleton during initial auth check
  if (initializing) {
    return <AppSkeleton />;
  }

  // Load the full app only after initial auth check
  return (
    <Suspense fallback={<AppSkeleton />}>
      <FullApp />
    </Suspense>
  );
}

export default App;
