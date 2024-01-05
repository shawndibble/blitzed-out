import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import {
  BrowserRouter as Router, Route, Routes, Navigate,
} from 'react-router-dom';
import UnauthenticatedApp from 'views/UnauthenticatedApp';
import useAuth from 'hooks/useAuth';
import Room from 'views/Room';
import './App.css';
import Cast from 'views/Cast';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

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
