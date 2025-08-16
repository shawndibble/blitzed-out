import { useTranslation } from 'react-i18next';
import { Box, Button, ThemeProvider } from '@mui/material';
import { useMemo } from 'react';
import { getThemeByMode } from '@/theme';

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError: () => void;
}

function getErrorDetails(error: unknown): string {
  if (!error) {
    return 'Unknown error occurred';
  }

  // If it's an Error object, prefer stack trace, then message
  if (error instanceof Error) {
    return error.stack || error.message || error.toString();
  }

  // For non-Error objects, try to stringify them
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    // If JSON.stringify fails, fall back to string conversion
    return String(error);
  }
}

export default function ErrorBoundaryFallback({ error, resetError }: ErrorBoundaryFallbackProps) {
  const { t } = useTranslation();

  // Detect user's theme preference without relying on React context
  // This works because error boundaries render outside the normal component tree
  const theme = useMemo(() => {
    const isBrowser = typeof window !== 'undefined';
    // Fallback for SSR/tests
    if (!isBrowser) {
      return getThemeByMode('light');
    }
    try {
      // Try to get theme from localStorage (user's saved preference)
      const savedSettings = window.localStorage?.getItem('gameSettings');
      if (savedSettings) {
        const settingsData = JSON.parse(savedSettings);
        // Zustand persist stores data in a nested structure
        const settings = settingsData.state?.settings || settingsData.settings;
        if (settings?.themeMode) {
          return getThemeByMode(settings.themeMode);
        }
      }
    } catch {
      // Intentionally swallow errors to keep fallback working
    }

    // Fallback: detect system preference (if available)
    const prefersDark =
      !!window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return getThemeByMode(prefersDark ? 'dark' : 'light');
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>{t('somethingWentWrong')}</h2>
        <p>{t('errorReportedToTeam')}</p>
        <p>{t('errorPersistsCheckBack')}</p>
        <details style={{ marginTop: '10px' }}>
          <summary>{t('errorDetails')}</summary>
          <Box
            component="pre"
            sx={{
              textAlign: 'left',
              bgcolor: 'action.hover',
              p: 1.25,
              my: 1.25,
              borderRadius: 1,
              overflow: 'auto',
            }}
          >
            {getErrorDetails(error)}
          </Box>
        </details>
        <Button variant="contained" onClick={resetError} sx={{ mt: 1.25 }}>
          {t('tryAgain')}
        </Button>
      </div>
    </ThemeProvider>
  );
}
