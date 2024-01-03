import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import {
  BrowserRouter as Router, Route, Routes,
} from 'react-router-dom';
import UnauthenticatedApp from 'views/UnauthenticatedApp';
import useAuth from 'hooks/useAuth';
import Room from 'views/Room';
import './App.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  const { user } = useAuth();

  const component = user ? <Room /> : <UnauthenticatedApp />;

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route exact path="/" element={component} />
          <Route path="/rooms/:id" element={component} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
