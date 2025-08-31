import { useState } from 'react';
import { Alert, AlertTitle, Box, Button, CircularProgress, Typography } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { Trans, useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import ButtonRow from '@/components/ButtonRow';

interface BrokenActionsStateProps {
  /** Optional custom title for the error alert */
  title?: string;
  /** Optional custom description for the error */
  description?: string;
  /** Whether to show navigation buttons (default: true) */
  showNavigation?: boolean;
}

/**
 * Component to display when actions list is in a broken state (empty after loading completes).
 * Provides a reset option to wipe all app data and start fresh.
 */
export default function BrokenActionsState({
  title,
  description,
  showNavigation = true,
}: BrokenActionsStateProps): JSX.Element {
  const { t } = useTranslation();
  const { wipeAllData } = useAuth();
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async (): Promise<void> => {
    setIsResetting(true);
    try {
      await wipeAllData();
    } catch {
      // wipeAllData already handles errors, but just in case
      setIsResetting(false);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300,
          gap: 3,
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          <AlertTitle>{title || t('noActionsAvailable')}</AlertTitle>
          {description || t('noActionsAvailableDescription')}
        </Alert>

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          {t('errorPersistsCheckBack')}
        </Typography>

        <Button
          variant="contained"
          onClick={handleReset}
          disabled={isResetting}
          startIcon={isResetting ? <CircularProgress size={20} /> : <Refresh />}
          size="large"
        >
          {t('resetApp')}
        </Button>
      </Box>

      {showNavigation && (
        <Box sx={{ mt: 4 }}>
          <ButtonRow>
            <Button disabled>
              <Trans i18nKey="previous" />
            </Button>
            <Button variant="contained" disabled size="large">
              <Trans i18nKey="next" />
            </Button>
          </ButtonRow>
        </Box>
      )}
    </Box>
  );
}
