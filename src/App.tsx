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
import { runMigrationIfNeeded, cleanupDuplicatesIfNeeded } from '@/services/migrationService';
import { useTranslation } from 'react-i18next';

// Lazy load main views
const UnauthenticatedApp = lazy(() => import('@/views/UnauthenticatedApp'));
const Cast = lazy(() => import('@/views/Cast'));
const Room = lazy(() => import('@/views/Room'));

// Smart preloading strategy - load most likely routes
const preloadChunks = () => {
  // Most users go to Room, so preload it with high priority
  Promise.all([import('@/views/Room'), import('@/views/UnauthenticatedApp')]).catch(console.warn);

  // Preload secondary components after a delay
  setTimeout(() => {
    Promise.all([
      import('@/components/MessageList'),
      import('@/components/MessageInput'),
      import('@/views/Navigation'),
    ]).catch(console.warn);
  }, 500);
};

// Intelligent preloading timing
if (typeof window !== 'undefined') {
  const schedulePreload = () => {
    if ('requestIdleCallback' in window) {
      // Use shorter timeout for faster preloading
      (window as any).requestIdleCallback(preloadChunks, { timeout: 500 });
    } else {
      // Start preloading sooner
      setTimeout(preloadChunks, 50);
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
  const { t } = useTranslation();
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
    // Run optimized migration with current language first
    const runMigration = async () => {
      setMigrationStatus('running');
      try {
        const success = await runMigrationIfNeeded();

        // Clean up any duplicates that may have been created in previous sessions
        if (success) {
          await cleanupDuplicatesIfNeeded();
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
        className="gradient-background-vibrant"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          width: '100vw',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 9999,
        }}
      >
        <Box
          className="glass-light"
          sx={{
            padding: '3rem 2rem',
            borderRadius: '16px',
            textAlign: 'center',
            maxWidth: '400px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <CircularProgress
            size={60}
            thickness={4}
            sx={{
              mb: 3,
              display: 'block',
              margin: '0 auto 1.5rem auto',
              '& .MuiCircularProgress-circle': {
                stroke: 'url(#flame-gradient)',
              },
            }}
          />
          <svg width="0" height="0">
            <defs>
              <linearGradient id="flame-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="50%" stopColor="#0891b2" />
                <stop offset="100%" stopColor="#0e7490" />
              </linearGradient>
            </defs>
          </svg>

          <Typography
            variant="h5"
            className="gradient-text-flame"
            sx={{
              mb: 2,
              fontWeight: 600,
              letterSpacing: '-0.025em',
            }}
          >
            {t('loadingLanguage')}
          </Typography>

          <Typography
            variant="body1"
            sx={{
              mb: 1.5,
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: 1.6,
            }}
          >
            {t('preparingGameData')}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontStyle: 'italic',
            }}
          >
            {t('otherLanguagesBackground')}
          </Typography>
        </Box>
      </Box>
    );
  }

  // Show error message if migration failed (but still allow app to continue)
  if (migrationStatus === 'failed') {
    console.warn('Initial language migration failed, but continuing with app startup');
    // The app can still function with default data or previously migrated data
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
