import { Alert, Collapse } from '@mui/material';
import { useTranslation } from 'react-i18next';
import useOnlineStatus from '@/hooks/useOnlineStatus';

/**
 * Inline banner shown above the message list while the browser is offline.
 * Chat sends are queued by Firestore and replayed on reconnect, so this just
 * sets the expectation that messages won't deliver until the connection returns.
 */
export default function OfflineBanner(): JSX.Element {
  const online = useOnlineStatus();
  const { t } = useTranslation();

  return (
    <Collapse in={!online} unmountOnExit>
      <Alert severity="warning" variant="filled" sx={{ borderRadius: 0 }}>
        {t('offlineBanner')}
      </Alert>
    </Collapse>
  );
}
