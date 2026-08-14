import { Alert, Box, Button } from '@mui/material';

import { useTranslation } from 'react-i18next';

interface LazyLoadFallbackProps {
  onRetry: () => void;
}

/**
 * Shown in place of a section whose code chunk failed to load.
 *
 * Scoped to the section rather than the page: the app's single root boundary would otherwise
 * turn one failed dialog import into a full-page crash screen.
 */
export default function LazyLoadFallback({ onRetry }: LazyLoadFallbackProps) {
  const { t } = useTranslation();

  return (
    <Box sx={{ p: 2 }}>
      <Alert
        severity="warning"
        action={
          <Button color="inherit" size="small" onClick={onRetry}>
            {t('tryAgain')}
          </Button>
        }
      >
        {t('sectionFailedToLoad')}
      </Alert>
    </Box>
  );
}
