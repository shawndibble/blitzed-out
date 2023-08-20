import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
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

  const router = createBrowserRouter([
    { path: '/', Component: user ? Room : UnauthenticatedApp },
    { path: '/rooms/:id', Component: user ? Room : UnauthenticatedApp },
  ]);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
