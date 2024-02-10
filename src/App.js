import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  responsiveFontSizes,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import useAuth from 'context/hooks/useAuth';
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  useParams,
} from 'react-router-dom';
import Cast from 'views/Cast';
import Room from 'views/Room';
import UnauthenticatedApp from 'views/UnauthenticatedApp';
import './App.css';
import { MessagesProvider } from 'context/messages';
import { UserListProvider } from 'context/userList';
import { ScheduleProvider } from 'context/schedule';

let darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});
darkTheme = responsiveFontSizes(darkTheme);

function Providers({ children }) {
  return (
    <ScheduleProvider>
      <UserListProvider>
        <MessagesProvider>
          {children}
        </MessagesProvider>
      </UserListProvider>
    </ScheduleProvider>
  );
}

// Code to handle old room URLs. Delete after 04/01/2024.
function OldRedirect() {
  const { id } = useParams();
  return <Navigate replace to={`/${id}`} />;
}

function App() {
  const { user } = useAuth();

  const room = user ? <Room /> : <UnauthenticatedApp />;

  return (
    <ThemeProvider theme={darkTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route
              exact
              path='/'
              element={<Navigate replace to='/public' />}
            />
            <Route
              path='/:id/cast'
              element={
                <Providers>
                  <Cast />
                </Providers>
              }
            />
            <Route
              path='/:id'
              element={<Providers>{room}</Providers>}
            />
            <Route path='/rooms/:id' element={<OldRedirect />} />
          </Routes>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
