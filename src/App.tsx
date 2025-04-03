import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { CssBaseline, ThemeProvider, CircularProgress, Box } from '@mui/material';
import useAuth from '@/context/hooks/useAuth';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import './App.css';
import { MessagesProvider } from '@/context/messages';
import { UserListProvider } from '@/context/userList';
import { ScheduleProvider } from '@/context/schedule';
import darkTheme from './theme';
import { setupDefaultActionsImport } from '@/services/defaultActionsImport';
import i18next from 'i18next';
import { WindowWithAuth, ProvidersProps } from '@/types/app';

const UnauthenticatedApp = lazy(() => import('@/views/UnauthenticatedApp'));
const Cast = lazy(() => import('@/views/Cast'));
const Room = lazy(() => import('@/views/Room'));

// Custom loading component with animation
const LoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
      backgroundColor: 'background.default',
    }}
    className="fade-in"
  >
    <CircularProgress
      size={60}
      thickness={4}
      sx={{
        color: 'primary.main',
        animation: 'pulse 1.5s infinite ease-in-out',
      }}
    />
  </Box>
);

function Providers({ children }: ProvidersProps) {
  return (
    <UserListProvider>
      <ScheduleProvider>
        <MessagesProvider>{children}</MessagesProvider>
      </ScheduleProvider>
    </UserListProvider>
  );
}

function AppRoutes() {
  const auth = useAuth();

  // Make auth context available to the middleware
  useEffect(() => {
    (window as unknown as WindowWithAuth).authContext = auth;
    return () => {
      (window as unknown as WindowWithAuth).authContext = null;
    };
  }, [auth]);

  i18next.on('languageChanged', (lng: string) => {
    setupDefaultActionsImport(lng);
  });

  const room = auth.user ? <Room /> : <UnauthenticatedApp />;

  return (
    <Routes>
      <Route path="/" element={<Navigate replace to="/public" />} />
      <Route
        path="/:id/cast"
        element={
          <Providers>
            <Suspense>
                <Cast />
            </Suspense>
          </Providers>
        }
      />
      <Route
        path="/:id"
        element={
          <Providers>
            <Suspense>{room}</Suspense>
          </Providers>
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
