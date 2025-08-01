import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useTheme } from '../../context/theme';

interface MuiProvidersProps {
  children: React.ReactNode;
}

export default function MuiProviders({ children }: MuiProvidersProps) {
  const { theme } = useTheme();

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>{children}</LocalizationProvider>
    </MuiThemeProvider>
  );
}
