import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';

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

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>{t('somethingWentWrong')}</h2>
      <p>{t('errorReportedToTeam')}</p>
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
      <button
        type="button"
        onClick={resetError}
        style={{ padding: '10px 20px', marginTop: '10px' }}
      >
        {t('tryAgain')}
      </button>
    </div>
  );
}
