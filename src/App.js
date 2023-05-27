import AuthenticatedApp from './components/AuthenticatedApp';
import UnauthenticatedApp from './components/UnauthenticatedApp';
import { useAuth } from './hooks/useAuth';
import './App.css';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
  });

function App() {
    const { user } = useAuth();

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            {user ? <AuthenticatedApp /> : <UnauthenticatedApp />}
        </ThemeProvider>
    );
}

export default App;