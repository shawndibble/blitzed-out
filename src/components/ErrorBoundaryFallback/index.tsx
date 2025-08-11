import { useTranslation } from 'react-i18next';

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError: () => void;
}

export default function ErrorBoundaryFallback({ error, resetError }: ErrorBoundaryFallbackProps) {
  const { t } = useTranslation();

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>{t('somethingWentWrong')}</h2>
      <p>{t('errorReportedToTeam')}</p>
      <details style={{ marginTop: '10px' }}>
        <summary>{t('errorDetails')}</summary>
        <pre
          style={{
            textAlign: 'left',
            background: '#f5f5f5',
            padding: '10px',
            margin: '10px 0',
          }}
        >
          {error.toString()}
        </pre>
      </details>
      <button onClick={resetError} style={{ padding: '10px 20px', marginTop: '10px' }}>
        {t('tryAgain')}
      </button>
    </div>
  );
}
