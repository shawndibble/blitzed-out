import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { CssBaseline, ThemeProvider } from '@mui/material';
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
      <Route path="/" element={<Navigate replace to="/PUBLIC" />} />
      <Route
        path="/:id/cast"
        element={
          <UppercaseRedirect>
            <Providers>
              <Suspense>
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
              <Suspense>{room}</Suspense>
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
