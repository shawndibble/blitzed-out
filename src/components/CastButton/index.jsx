import { useState, useEffect, useCallback } from 'react';
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
  const CAST_APP_ID = '1227B8DE';

  const initializeCastApi = useCallback(() => {
    if (!window.chrome || !window.chrome.cast) {
      console.error('Chrome Cast API not available');
      return;
    }

    const sessionRequest = new window.chrome.cast.SessionRequest(CAST_APP_ID);

    const apiConfig = new window.chrome.cast.ApiConfig(
      sessionRequest,
      (session) => {
        // Session listener - called when a session is created or updated
        console.log('New or updated session', session);
        setIsCasting(true);
      },
      (availability) => {
        // Receiver availability listener
        console.log('Receiver availability:', availability);
        setCastingAvailable(availability === window.chrome.cast.ReceiverAvailability.AVAILABLE);
      },
      window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
    );

    window.chrome.cast.initialize(
      apiConfig,
      () => {
        console.log('Cast API initialized successfully');
        // Check if there's already an active session
        if (window.chrome.cast.session) {
          setIsCasting(true);
        }
      },
      (error) => {
        console.error('Cast API initialization error:', error);
      }
    );
  }, [CAST_APP_ID]);

  useEffect(() => {
    // Define the callback function for when the Cast API is available
    window['__onGCastApiAvailable'] = (isAvailable) => {
      if (isAvailable && window.chrome && window.chrome.cast) {
        initializeCastApi();
      } else {
        console.log('Cast API not available');
      }
    };

    // Only load the script once across the entire app
    if (!castScriptLoaded) {
      // Remove any existing script to avoid conflicts
      const existingScript = document.querySelector('script[src*="cast_sender.js"]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
      script.async = true;
      document.body.appendChild(script);
      castScriptLoaded = true;
    } else if (window.chrome && window.chrome.cast && window.chrome.cast.isAvailable) {
      // If the API is already available, initialize it directly
      initializeCastApi();
    }

    return () => {
      // Cleanup if needed
    };
  }, [initializeCastApi]);

  const startCasting = () => {
    if (!window.chrome || !window.chrome.cast || !window.chrome.cast.isAvailable) {
      console.error('Cast API not available');
      return;
    }

    window.chrome.cast.requestSession(
      (session) => {
        console.log('Session started:', session);
        setIsCasting(true);

        // Create a media info object for the cast URL
        const castUrl = `${window.location.origin}/${room}/cast`;

        // Load the media using the default media receiver
        const mediaInfo = new window.chrome.cast.media.MediaInfo(castUrl, 'text/html');

        // Set the content type to HTML
        mediaInfo.contentType = 'text/html';

        // Add custom data to help the receiver understand what to display
        mediaInfo.customData = {
          roomId: room,
          isBlitzedOutCast: true,
        };

        // Create a request to load this media
        const request = new window.chrome.cast.media.LoadRequest(mediaInfo);

        // Send the request to the session
        session.loadMedia(
          request,
          (mediaSession) => {
            console.log('Media loaded successfully', mediaSession);
          },
          (error) => {
            console.error('Error loading media:', error);
          }
        );
      },
      (error) => {
        console.error('Error starting cast session:', error);
      }
    );
  };

  const stopCasting = () => {
    if (!window.chrome || !window.chrome.cast || !window.chrome.cast.isAvailable) {
      return;
    }

    try {
      const currentSession = window.chrome.cast.session;
      if (currentSession) {
        currentSession.endSession(
          () => {
            console.log('Session ended successfully');
            setIsCasting(false);
          },
          (error) => {
            console.error('Error ending session:', error);
          }
        );
      } else {
        console.log('No active session to stop');
        setIsCasting(false);
      }
    } catch (e) {
      console.error('Error stopping cast:', e);
      setIsCasting(false);
    }
  };

  const handleCastClick = () => {
    if (isCasting) {
      stopCasting();
    } else {
      startCasting();
    }
  };

  return (
    <Tooltip title={isCasting ? t('stopCasting') : t('startCasting')}>
      <IconButton
        color={isCasting ? 'primary' : 'default'}
        onClick={handleCastClick}
        disabled={!castingAvailable}
      >
        {isCasting ? <CastConnectedIcon /> : <CastIcon />}
      </IconButton>
    </Tooltip>
  );
}
