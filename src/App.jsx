import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { CssBaseline, ThemeProvider } from '@mui/material';
import useAuth from '@/context/hooks/useAuth';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import './App.css';
import { MessagesProvider } from '@/context/messages';
import { UserListProvider } from '@/context/userList';
import { ScheduleProvider } from '@/context/schedule';
import { AuthProvider } from '@/context/auth'; // Make sure this import is correct
import darkTheme from './theme';

const UnauthenticatedApp = lazy(() => import('@/views/UnauthenticatedApp'));
const Cast = lazy(() => import('@/views/Cast'));
const Room = lazy(() => import('@/views/Room'));

function Providers({ children }) {
  return (
    <AuthProvider>
      <UserListProvider>
        <ScheduleProvider>
          <MessagesProvider>{children}</MessagesProvider>
        </ScheduleProvider>
      </UserListProvider>
    </AuthProvider>
  );
}

// Rest of the file remains the same

function AppRoutes() {
  const { user } = useAuth();

  const room = user ? <Room /> : <UnauthenticatedApp />;

  return (
    <Routes future={{ v7_startTransition: true }}>
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
            <Suspense>
              {room}
            </Suspense>
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
