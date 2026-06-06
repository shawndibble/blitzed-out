import { Button, Snackbar } from '@mui/material';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/utils/logger';

/**
 * Surfaces a snackbar when a new service worker has been installed and is
 * waiting. Lets the user reload on their terms so an active game is never
 * interrupted by an automatic refresh.
 */
export default function ReloadPrompt(): JSX.Element | null {
  const { t } = useTranslation();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      logger.warn('Service worker registration failed:', error);
    },
  });

  if (!needRefresh) {
    return null;
  }

  return (
    <Snackbar
      open
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      message={t('updateAvailable')}
      action={
        <>
          <Button color="primary" size="small" onClick={() => updateServiceWorker(true)}>
            {t('reload')}
          </Button>
          <Button color="inherit" size="small" onClick={() => setNeedRefresh(false)}>
            {t('close')}
          </Button>
        </>
      }
    />
  );
}
