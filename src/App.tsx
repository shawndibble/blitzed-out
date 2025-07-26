import './App.css';

import { Box, CircularProgress, CssBaseline, ThemeProvider, Typography } from '@mui/material';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { ProvidersProps, WindowWithAuth } from '@/types/app';
import { Suspense, lazy, useContext, useEffect, useState } from 'react';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import AppSkeleton from '@/components/AppSkeleton';
import { AuthContext } from '@/context/auth';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { MessagesProvider } from '@/context/messages';
import { ScheduleProvider } from '@/context/schedule';
import { UserListProvider } from '@/context/userList';
import darkTheme from './theme';
import { runMigrationIfNeeded } from '@/services/migrationService';

// Lazy load main views
const UnauthenticatedApp = lazy(() => import('@/views/UnauthenticatedApp'));
const Cast = lazy(() => import('@/views/Cast'));
const Room = lazy(() => import('@/views/Room'));

// Aggressive preloading to reduce subsequent requests
const preloadChunks = () => {
  // Preload all critical app chunks immediately after main load
  Promise.all([
    import('@/views/Room'),
    import('@/components/MessageList'),
    import('@/views/Room/GameBoard'),
    import('@/views/Navigation'),
    import('@/components/MessageInput'),
    import('@/components/PopupMessage'),
  ]).catch(console.warn); // Don't fail if preload fails
};

// Preload critical chunks immediately after initial render
if (typeof window !== 'undefined') {
  // Use requestIdleCallback for better performance
  const schedulePreload = () => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(preloadChunks, { timeout: 1000 });
    } else {
      setTimeout(preloadChunks, 100);
    }
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', schedulePreload);
  } else {
    schedulePreload();
  }
}

function Providers({ children }: ProvidersProps) {
  return (
    <UserListProvider>
      <ScheduleProvider>
        <MessagesProvider>{children}</MessagesProvider>
      </ScheduleProvider>
    </UserListProvider>
  );
}

// Component to ensure the room ID is always uppercase
function UppercaseRedirect({ children }: { children: React.ReactNode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (id && id !== id.toUpperCase()) {
      const newPath = location.pathname.replace(id, id.toUpperCase());
      navigate(newPath + location.search + location.hash, { replace: true });
    }
  }, [id, navigate, location]);

  return <>{children}</>;
}

function AppRoutes() {
  const auth = useContext(AuthContext);
  const [migrationStatus, setMigrationStatus] = useState<
    'pending' | 'running' | 'completed' | 'failed'
  >('pending');

  // Make auth context available to the middleware
  useEffect(() => {
    if (auth) {
      (window as unknown as WindowWithAuth).authContext = auth;
    }
    return () => {
      (window as unknown as WindowWithAuth).authContext = null;
    };
  }, [auth]);

  useEffect(() => {
    // Run migrations once at app startup with user feedback
    const runMigration = async () => {
      setMigrationStatus('running');
      try {
        const success = await runMigrationIfNeeded();
        setMigrationStatus(success ? 'completed' : 'failed');
      } catch (error) {
        console.error('Migration failed:', error);
        setMigrationStatus('failed');
      }
    };

    runMigration();
  }, []);

  // Show skeleton during initial auth loading
  if (!auth || auth.initializing) {
    return <AppSkeleton />;
  }

  // Show migration status while running
  if (migrationStatus === 'running') {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={40} />
        <Typography variant="h6" color="primary">
          Updating game data...
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          This may take a moment. Please don&apos;t close the app.
        </Typography>
      </Box>
    );
  }

  // Show error message if migration failed (but still allow app to continue)
  if (migrationStatus === 'failed') {
    console.warn('Migration failed, but continuing with app startup');
  }

  const room = auth.user ? <Room /> : <UnauthenticatedApp />;

  return (
    <Routes>
      <Route path="/" element={<Navigate replace to="/PUBLIC" />} />
      <Route
        path="/:id/cast"
        element={
          <UppercaseRedirect>
            <Providers>
              <Suspense fallback={<AppSkeleton />}>
                <Cast />
              </Suspense>
            </Providers>
          </UppercaseRedirect>
        }
      />
      <Route
        path="/:id"
        element={
          <UppercaseRedirect>
            <Providers>
              <Suspense fallback={<AppSkeleton />}>{room}</Suspense>
            </Providers>
          </UppercaseRedirect>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
