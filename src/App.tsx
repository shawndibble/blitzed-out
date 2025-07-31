import './App.css';

import { CssBaseline, ThemeProvider } from '@mui/material';
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
import { Suspense, lazy, useContext, useEffect } from 'react';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import AppSkeleton from '@/components/AppSkeleton';
import { AuthContext } from '@/context/auth';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { MessagesProvider } from '@/context/messages';
import { ScheduleProvider } from '@/context/schedule';
import { UserListProvider } from '@/context/userList';
import { MigrationProvider } from '@/context/migration';
import darkTheme from './theme';

// Lazy load main views
const UnauthenticatedApp = lazy(() => import('@/views/UnauthenticatedApp'));
const Cast = lazy(() => import('@/views/Cast'));
const Room = lazy(() => import('@/views/Room'));

// Smart preloading strategy - load most likely routes
const preloadChunks = () => {
  // Most users go to Room, so preload it with high priority
  Promise.all([import('@/views/Room'), import('@/views/UnauthenticatedApp')]).catch(() => {});

  // Preload secondary components after a delay
  setTimeout(() => {
    Promise.all([
      import('@/components/MessageList'),
      import('@/components/MessageInput'),
      import('@/views/Navigation'),
    ]).catch(() => {});
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
    <MigrationProvider>
      <UserListProvider>
        <ScheduleProvider>
          <MessagesProvider>{children}</MessagesProvider>
        </ScheduleProvider>
      </UserListProvider>
    </MigrationProvider>
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

  // Make auth context available to the middleware
  useEffect(() => {
    if (auth) {
      (window as unknown as WindowWithAuth).authContext = auth;
    }
    return () => {
      (window as unknown as WindowWithAuth).authContext = null;
    };
  }, [auth]);

  // Show skeleton during initial auth loading
  if (!auth || auth.initializing) {
    return <AppSkeleton />;
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
