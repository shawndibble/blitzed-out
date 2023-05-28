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
      { path: "/", Component: user ? Room : UnauthenticatedApp },
      { path: "/rooms/:id", Component: user ? Room : UnauthenticatedApp },
    ]);

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <RouterProvider router={router} />
        </ThemeProvider>
    );
}

export default App;