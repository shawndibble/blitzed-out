import UnauthenticatedApp from './components/UnauthenticatedApp';
import useAuth from './hooks/useAuth';
import './App.css';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Room from './components/Room';

const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
  });

function App() {
    const { user } = useAuth();

    const router = createBrowserRouter([
      { path: "/", Component: Room },
      { path: "/rooms/:id", Component: Room },
    ]);

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            {user ? <RouterProvider router={router} /> : <UnauthenticatedApp />}
        </ThemeProvider>
    );
}

export default App;