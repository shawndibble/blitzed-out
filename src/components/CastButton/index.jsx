import { useState, useEffect } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import CastIcon from '@mui/icons-material/Cast';
import CastConnectedIcon from '@mui/icons-material/CastConnected';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Global flag to track if the script has been loaded
let castScriptLoaded = false;

export default function CastButton() {
  const [castingAvailable, setCastingAvailable] = useState(false);
  const [isCasting, setIsCasting] = useState(false);
  const { t } = useTranslation();
  const { id: room } = useParams();

  // Load the Cast API script
  useEffect(() => {
    if (!castScriptLoaded && !window.__onGCastApiAvailable) {
      // Define the callback function that the Cast API will call when loaded
      window.__onGCastApiAvailable = function (isAvailable) {
        if (isAvailable) {
          initializeCastApi();
        }
      };

      // Load the Cast API script
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
      script.async = true;
      document.head.appendChild(script);

      castScriptLoaded = true;
    } else if (window.cast && window.cast.framework) {
      // If the API is already loaded, initialize it
      initializeCastApi();
    }

    return () => {
      // Clean up any cast session if component unmounts
      if (window.cast && window.cast.framework) {
        const castSession = window.cast.framework.CastContext.getInstance().getCurrentSession();
        if (castSession) {
          castSession.endSession(true);
        }
      }
    };
  }, []);

  // Initialize the Cast API
  const initializeCastApi = () => {
    const context = window.cast.framework.CastContext.getInstance();

    // Set up the receiver application ID
    // For development, you can use the default media receiver
    context.setOptions({
      receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
      autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    });

    // Listen for cast state changes
    context.addEventListener(
      window.cast.framework.CastContextEventType.CAST_STATE_CHANGED,
      (event) => {
        const castState = event.castState;

        // Update state based on cast availability
        if (castState === window.cast.framework.CastState.NO_DEVICES_AVAILABLE) {
          setCastingAvailable(false);
          setIsCasting(false);
        } else {
          setCastingAvailable(true);
          setIsCasting(
            castState === window.cast.framework.CastState.CONNECTED ||
              castState === window.cast.framework.CastState.CONNECTING
          );
        }
      }
    );
  };

  // Handle the cast button click
  const handleCastClick = () => {
    if (!window.cast || !window.cast.framework) {
      console.error('Cast API not available');
      return;
    }

    const castContext = window.cast.framework.CastContext.getInstance();
    const currentSession = castContext.getCurrentSession();

    if (currentSession) {
      // If already casting, end the session
      currentSession.endSession(true);
      setIsCasting(false);
    } else {
      // Start a new cast session
      // Generate the full URL for the cast page
      const baseUrl = window.location.origin;
      const castUrl = `${baseUrl}/${room}/cast`;

      // Request a new session
      castContext.requestSession().then(
        (session) => {
          // Load the URL in the cast session
          const mediaInfo = new window.chrome.cast.media.MediaInfo(castUrl, 'text/html');

          const request = new window.chrome.cast.media.LoadRequest(mediaInfo);
          session.loadMedia(request).then(
            () => {
              console.log('Cast session started successfully');
              setIsCasting(true);
            },
            (error) => {
              console.error('Error loading media:', error);
              setIsCasting(false);
            }
          );
        },
        (error) => {
          console.error('Error starting cast session:', error);
        }
      );
    }
  };

  // Don't render the button if casting is not available
  if (!castScriptLoaded) {
    return null;
  }

  return (
    <Tooltip title={isCasting ? t('stopCasting') : t('startCasting')}>
      <IconButton
        onClick={handleCastClick}
        disabled={!castingAvailable}
        color={isCasting ? 'primary' : 'default'}
      >
        {isCasting ? <CastConnectedIcon /> : <CastIcon />}
      </IconButton>
    </Tooltip>
  );
}
