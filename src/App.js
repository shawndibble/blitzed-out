import {
  CssBaseline, ThemeProvider, createTheme, responsiveFontSizes,
} from '@mui/material';
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
      <CssBaseline />
      <Router>
        <Routes>
          <Route exact path="/" element={<Navigate replace to="/rooms/public" />} />
          <Route path="/rooms/:id/cast" element={<Cast />} />
          <Route path="/rooms/:id" element={room} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
