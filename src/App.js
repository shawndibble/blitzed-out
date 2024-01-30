import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  responsiveFontSizes,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import useAuth from 'hooks/useAuth';
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from 'react-router-dom';
import Cast from 'views/Cast';
import Room from 'views/Room';
import UnauthenticatedApp from 'views/UnauthenticatedApp';
import './App.css';
import { MessagesProvider } from 'context/messages';

let darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});
darkTheme = responsiveFontSizes(darkTheme);

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
              element={<Navigate replace to='/rooms/public' />}
            />
            <Route
              path='/rooms/:id/cast'
              element={
                <MessagesProvider>
                  <Cast />
                </MessagesProvider>
              }
            />
            <Route
              path='/rooms/:id'
              element={<MessagesProvider>{room}</MessagesProvider>}
            />
          </Routes>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
