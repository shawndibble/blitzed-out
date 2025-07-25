import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { lazy, Suspense, useEffect, useContext, useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { CssBaseline, ThemeProvider, Box, CircularProgress, Typography } from '@mui/material';
import { AuthContext } from '@/context/auth';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import './App.css';
import { MessagesProvider } from '@/context/messages';
import { UserListProvider } from '@/context/userList';
import { ScheduleProvider } from '@/context/schedule';
import darkTheme from './theme';
import {
  runMigrationWithCurrentLocale,
  hasMultiLocaleData,
  resetAndMigrateCurrentLocaleOnly,
} from '@/services/migrationService';
import { WindowWithAuth, ProvidersProps } from '@/types/app';
import AppSkeleton from '@/components/AppSkeleton';

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
        // Check if we have multi-locale data from the old migration system
        const hasMultiLocale = await hasMultiLocaleData();

        let success: boolean;
        if (hasMultiLocale) {
          console.info(
            'Multi-locale data detected, performing clean migration for current locale only'
          );
          success = await resetAndMigrateCurrentLocaleOnly();
        } else {
          console.info('Running migration for current locale');
          success = await runMigrationWithCurrentLocale();
        }

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
