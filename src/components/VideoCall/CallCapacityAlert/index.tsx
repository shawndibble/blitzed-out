import { Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { CALL_QUALITY_WARNING_PARTICIPANTS, MAX_CALL_PARTICIPANTS } from '@/config/webrtc';
import { useCallPresenceStore } from '@/stores/callPresenceStore';

/**
 * Warns about a crowded call, and says outright when it is full.
 *
 * One component with two states rather than two components, so the thresholds
 * cannot drift into a state where both render at once.
 *
 * Reads the passive presence store, never `videoCallStore`: someone refused for
 * being over the cap never finishes `initialize`, so store state is empty for
 * exactly the person who needs to be told the call is full.
 */
const CallCapacityAlert = () => {
  const { t } = useTranslation();
  // `capacityCount`, not the badge's `count`: this has to agree with whatever
  // refuses the join, or a call with backgrounded participants is refused while
  // the panel says nothing — blank grid, disabled button, no explanation.
  const capacityCount = useCallPresenceStore((state) => state.capacityCount);

  if (capacityCount < CALL_QUALITY_WARNING_PARTICIPANTS) return null;

  const isFull = capacityCount >= MAX_CALL_PARTICIPANTS;

  return (
    <Alert severity={isFull ? 'error' : 'warning'} sx={{ mb: 1, flexShrink: 0 }}>
      {isFull ? t('videoCall.capacity.full') : t('videoCall.capacity.warning')}
    </Alert>
  );
};

export default CallCapacityAlert;
