import './App.css';

import AppSkeleton from '@/components/AppSkeleton';
import FullApp from '@/components/FullApp';
import { useMinimalAuth } from '@/context/minimalAuth';

function App() {
  const { initializing } = useMinimalAuth();

  // Show skeleton during initial auth check
  if (initializing) {
    return <AppSkeleton />;
  }

  // Load the full app only after initial auth check
  return <FullApp />;
}

export default App;
