import { useState, useEffect } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import CastIcon from '@mui/icons-material/Cast';
import CastConnectedIcon from '@mui/icons-material/CastConnected';
import { useParams } from 'react-router-dom';

export default function CastButton() {
  const [castingAvailable, setCastingAvailable] = useState(false);
  const [isCasting, setIsCasting] = useState(false);
  const [castApiLoaded, setCastApiLoaded] = useState(false);
  const { id: room } = useParams();
  const CAST_APP_ID = import.meta.env.VITE_CAST_APP_ID || '1227B8DE';

  // Function to initialize the Cast API
  const initializeCastApi = () => {
    if (!window.cast || !window.cast.framework) {
      console.log('Cast framework not available yet');
      return false;
    }

    try {
      console.log('Initializing Cast API');
      const castContext = window.cast.framework.CastContext.getInstance();

      // Set up the receiver application ID
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

      setCastingAvailable(true);
      return true;
    } catch (error) {
      console.error('Error initializing Cast API:', error);
      return false;
    }
  };

  // Load the Cast SDK
  useEffect(() => {
    // Define the callback for when the Cast API is available
    window.__onGCastApiAvailable = function (isAvailable) {
      console.log('Cast API available:', isAvailable);
      if (isAvailable) {
        setCastApiLoaded(true);
        const success = initializeCastApi();
        if (success) {
          console.log('Cast API initialized successfully');
        }
      }
    };

    // Check if the Cast API is already loaded
    if (window.cast && window.cast.framework) {
      console.log('Cast API already loaded');
      setCastApiLoaded(true);
      initializeCastApi();
    } else {
      // Add the Cast SDK script
      console.log('Loading Cast SDK script');
      const existingScript = document.querySelector('script[src*="cast_sender.js"]');

      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
        script.async = true;
        document.head.appendChild(script);
        console.log('Cast SDK script added to document');
      } else {
        console.log('Cast SDK script already exists in document');
      }
    }

    // Try to initialize periodically if the API takes time to load
    const initInterval = setInterval(() => {
      if (window.cast && window.cast.framework && !castingAvailable) {
        console.log('Attempting to initialize Cast API');
        const success = initializeCastApi();
        if (success) {
          clearInterval(initInterval);
        }
      }
    }, 1000);

    return () => {
      clearInterval(initInterval);

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

  // Always show the button, but disable it if casting is not available
  return (
    <Tooltip title={isCasting ? 'Stop Casting' : 'Cast to TV'}>
      <span>
        <IconButton
          color={isCasting ? 'primary' : 'default'}
          onClick={startCasting}
          aria-label={isCasting ? 'Stop Casting' : 'Cast to TV'}
          disabled={!castApiLoaded}
        >
          {isCasting ? <CastConnectedIcon /> : <CastIcon />}
        </IconButton>
      </span>
    </Tooltip>
  );
}
