import { useState, useEffect } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import CastIcon from '@mui/icons-material/Cast';
import CastConnectedIcon from '@mui/icons-material/CastConnected';
import { useParams, useLocation } from 'react-router-dom';

export default function CastButton() {
  const [castingAvailable, setCastingAvailable] = useState(false);
  const [isCasting, setIsCasting] = useState(false);
  const [castSession, setCastSession] = useState(null);
  const { id: room } = useParams();
  const location = useLocation();

  const CAST_APP_ID = '1227B8DE';

  // Initialize the Cast API when the component mounts
  useEffect(() => {
    // Function to load the Cast API
    const loadCastApi = () => {
      if (!window.chrome || !window.chrome.cast || !window.cast) {
        console.log('Cast API not available yet');
        setTimeout(loadCastApi, 1000);
        return;
      }

      // Initialize the Cast API
      window.__onGCastApiAvailable = function (isAvailable) {
        if (isAvailable) {
          initializeCastApi();
        }
      };

      // Load the Cast API
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
      document.head.appendChild(script);
    };

    loadCastApi();

    // Cleanup function
    return () => {
      window.__onGCastApiAvailable = null;
    };
  }, []);

  // Function to initialize the Cast API
  const initializeCastApi = () => {
    try {
      const castContext = window.cast.framework.CastContext.getInstance();

      // Set up the receiver application ID
      castContext.setOptions({
        receiverApplicationId: CAST_APP_ID,
        autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      });

      // Listen for session state changes
      castContext.addEventListener(
        window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
        (event) => {
          const session = castContext.getCurrentSession();
          setCastSession(session);

          setIsCasting(
            event.sessionState === window.cast.framework.SessionState.SESSION_STARTED ||
              event.sessionState === window.cast.framework.SessionState.SESSION_RESUMED
          );

          if (session && room) {
            sendCastMessage(session);
          }
        }
      );

      setCastingAvailable(true);
      console.log('Cast API initialized successfully');
    } catch (error) {
      console.error('Error initializing Cast API:', error);
    }
  };

  // Function to send a message to the receiver
  const sendCastMessage = (session) => {
    if (!session) return;

    try {
      // Get the current URL to cast
      const baseUrl = window.location.origin;
      const castUrl = `${baseUrl}/${room}/cast`;

      console.log('Sending cast message with URL:', castUrl);

      // Send a message to the receiver
      session.sendMessage('urn:x-cast:com.blitzedout.app', {
        type: 'LOAD',
        url: castUrl,
      });
    } catch (error) {
      console.error('Error sending cast message:', error);
    }
  };

  // Function to toggle casting
  const toggleCasting = () => {
    if (isCasting) {
      // Stop casting
      if (castSession) {
        castSession.endSession(true);
      }
    } else {
      // Start casting
      try {
        const castContext = window.cast.framework.CastContext.getInstance();
        castContext.requestSession();
      } catch (error) {
        console.error('Error requesting cast session:', error);
      }
    }
  };

  // Send a new cast message when the room changes
  useEffect(() => {
    if (isCasting && castSession && room) {
      sendCastMessage(castSession);
    }
  }, [room, isCasting, castSession]);

  return (
    <Tooltip title={isCasting ? 'Stop Casting' : 'Cast to TV'}>
      <IconButton
        onClick={toggleCasting}
        color={isCasting ? 'primary' : 'default'}
        disabled={!castingAvailable}
      >
        {isCasting ? <CastConnectedIcon /> : <CastIcon />}
      </IconButton>
    </Tooltip>
  );
}
