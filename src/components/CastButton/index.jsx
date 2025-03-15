import { useState, useEffect } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import CastIcon from '@mui/icons-material/Cast';
import CastConnectedIcon from '@mui/icons-material/CastConnected';
import { useParams } from 'react-router-dom';

export default function CastButton() {
  const [castingAvailable, setCastingAvailable] = useState(false);
  const [isCasting, setIsCasting] = useState(false);
  const { id: room } = useParams();
  const CAST_APP_ID = import.meta.env.VITE_CAST_APP_ID || '1227B8DE';

  useEffect(() => {
    // Load the Cast SDK
    if (!window.__onGCastApiAvailable) {
      window.__onGCastApiAvailable = function (isAvailable) {
        if (isAvailable) {
          initializeCastApi();
          setCastingAvailable(true);
        }
      };

      // Add the Cast SDK script
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
      script.async = true;
      document.head.appendChild(script);
    } else if (window.cast && window.cast.framework) {
      initializeCastApi();
      setCastingAvailable(true);
    }

    return () => {
      // Clean up if needed
      if (window.cast && window.cast.framework) {
        try {
          const castContext = window.cast.framework.CastContext.getInstance();
          const session = castContext.getCurrentSession();
          if (session) {
            session.endSession(true);
          }
        } catch (error) {
          console.error('Error cleaning up cast session:', error);
        }
      }
    };
  }, []);

  const initializeCastApi = () => {
    try {
      const castContext = window.cast.framework.CastContext.getInstance();

      // Set up the receiver application ID using your custom app ID
      castContext.setOptions({
        receiverApplicationId: CAST_APP_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      });

      // Listen for session state changes
      castContext.addEventListener(
        window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
        (event) => {
          const sessionState = event.sessionState;
          setIsCasting(
            sessionState === window.cast.framework.SessionState.SESSION_STARTED ||
              sessionState === window.cast.framework.SessionState.SESSION_RESUMED
          );
        }
      );
    } catch (error) {
      console.error('Error initializing Cast API:', error);
    }
  };

  const startCasting = () => {
    if (!window.cast || !window.cast.framework) {
      console.error('Cast framework not available');
      return;
    }

    try {
      const castContext = window.cast.framework.CastContext.getInstance();

      if (isCasting) {
        // If already casting, end the session
        const session = castContext.getCurrentSession();
        if (session) {
          session.endSession(true);
        }
      } else {
        // Start a new casting session
        castContext.requestSession().then(
          (session) => {
            // Send the room ID to the receiver
            const castSession = castContext.getCurrentSession();
            if (castSession) {
              // Create a custom message with the room ID
              const message = {
                type: 'ROOM_INFO',
                roomId: room,
              };

              // Send the message to the receiver
              castSession
                .sendMessage('urn:x-cast:com.blitzedout.cast', JSON.stringify(message))
                .then(() => console.log('Message sent successfully'))
                .catch((error) => console.error('Error sending message:', error));

              // You can also load a URL directly if your receiver app supports it
              const castUrl = `${window.location.origin}/cast/${room}`;

              // Create a media info object
              const mediaInfo = new chrome.cast.media.MediaInfo(castUrl, 'text/html');
              const request = new chrome.cast.media.LoadRequest(mediaInfo);

              castSession.loadMedia(request).then(
                () => console.log('Media loaded successfully'),
                (error) => console.error('Error loading media:', error)
              );
            }
          },
          (error) => console.error('Error starting cast session:', error)
        );
      }
    } catch (error) {
      console.error('Error with cast operation:', error);
    }
  };

  if (!castingAvailable) {
    return null; // Don't show the button if casting is not available
  }

  return (
    <Tooltip title={isCasting ? 'Stop Casting' : 'Cast to TV'}>
      <IconButton
        color={isCasting ? 'primary' : 'default'}
        onClick={startCasting}
        aria-label={isCasting ? 'Stop Casting' : 'Cast to TV'}
      >
        {isCasting ? <CastConnectedIcon /> : <CastIcon />}
      </IconButton>
    </Tooltip>
  );
}
