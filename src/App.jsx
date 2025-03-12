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
import darkTheme from './theme';

function Providers({ children }) {
  return (
    <ScheduleProvider>
      <UserListProvider>
        <MessagesProvider>{children}</MessagesProvider>
      </UserListProvider>
    </ScheduleProvider>
  );
}

const UnauthenticatedApp = lazy(() => import('@/views/UnauthenticatedApp'));
const Cast = lazy(() => import('@/views/Cast'));
const Room = lazy(() => import('@/views/Room'));

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
            <Suspense fallback={<div>Loading...</div>}>
              <Cast />
            </Suspense>
          </Providers>
        }
      />
      <Route
        path="/:id"
        element={
          <Providers>
            <Suspense fallback={<div>Loading...</div>}>
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
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;