import { useState, useEffect } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import CastIcon from '@mui/icons-material/Cast';
import CastConnectedIcon from '@mui/icons-material/CastConnected';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function CastButton() {
  const [castingAvailable, setCastingAvailable] = useState(false);
  const [isCasting, setIsCasting] = useState(false);
  const { t } = useTranslation();
  const { id: room } = useParams();

  // Custom receiver app ID - you need to register one at the Google Cast Developer Console
  const CAST_APP_ID = import.meta.env.CAST_APP_ID || 'CC1AD845'; // Replace with your registered app ID once you have it

  useEffect(() => {
    // Initialize the Cast API
    const initializeCastApi = () => {
      const context = cast.framework.CastContext.getInstance();
      context.setOptions({
        receiverApplicationId: CAST_APP_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      });

      // Listen for cast state changes
      context.addEventListener(cast.framework.CastContextEventType.CAST_STATE_CHANGED, (event) => {
        switch (event.castState) {
          case cast.framework.CastState.NO_DEVICES_AVAILABLE:
            setCastingAvailable(false);
            setIsCasting(false);
            break;
          case cast.framework.CastState.NOT_CONNECTED:
            setCastingAvailable(true);
            setIsCasting(false);
            break;
          case cast.framework.CastState.CONNECTED:
            setCastingAvailable(true);
            setIsCasting(true);
            break;
          default:
            break;
        }
      });
    };

    // Check if the Cast API is available
    if (window.cast && window.chrome) {
      if (window.cast.framework) {
        initializeCastApi();
      } else {
        window.__onGCastApiAvailable = (isAvailable) => {
          if (isAvailable) {
            initializeCastApi();
          }
        };
      }
    }
  }, []);

  const handleCastClick = () => {
    if (!room) return;

    if (isCasting) {
      // Stop casting
      const castSession = cast.framework.CastContext.getInstance().getCurrentSession();
      if (castSession) {
        castSession.endSession(true);
      }
    } else {
      // Start casting
      const castSession = cast.framework.CastContext.getInstance().getCurrentSession();
      if (castSession) {
        // For custom web receiver, we need to send a URL to load
        const castUrl = `${window.location.origin}/${room}/cast`;

        // Create a custom message with the URL to load
        const message = {
          type: 'LOAD',
          url: castUrl,
        };

        // Send the message to the receiver
        castSession.sendMessage('urn:x-cast:com.blitzedout.cast', message);
      } else {
        // Request a new session
        cast.framework.CastContext.getInstance().requestSession();
      }
    }
  };

  if (!castingAvailable) return null;

  return (
    <Tooltip title={isCasting ? t('stopCasting') : t('startCasting')}>
      <IconButton
        color="inherit"
        onClick={handleCastClick}
        aria-label={isCasting ? t('stopCasting') : t('startCasting')}
      >
        {isCasting ? <CastConnectedIcon /> : <CastIcon />}
      </IconButton>
    </Tooltip>
  );
}
