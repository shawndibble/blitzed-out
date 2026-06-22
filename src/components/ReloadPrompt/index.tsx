import { Button, Snackbar } from '@mui/material';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/utils/logger';

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly

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
    // The browser only re-checks for a new service worker on initial load or
    // its own ~24h cadence. On mobile an installed PWA can stay backgrounded
    // for days and never notice a deploy. Poll hourly and on resume so the
    // update banner actually fires.
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const check = () => {
        if (registration.installing || !navigator.onLine) return;
        registration.update().catch(() => {});
      };

      setInterval(check, UPDATE_CHECK_INTERVAL_MS);

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
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
