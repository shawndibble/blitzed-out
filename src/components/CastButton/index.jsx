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

  const CAST_APP_ID = '1227B8DE';

  // Function to initialize the Cast API
  const initializeCastApi = () => {
    if (!window.cast || !window.cast.framework) {
      console.log('Cast framework not available yet');
      return false;
    }

    try {
      console.log('Initializing Cast API with app ID:', CAST_APP_ID);
      const castContext = window.cast.framework.CastContext.getInstance();

      // Set up the receiver application ID
      castContext.setOptions({
        receiverApplicationId: CAST_APP_ID,
        // Use ORIGIN_SCOPED to make discovery automatic
        autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      });

      // Listen for session state changes
      castContext.addEventListener(
        window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
        (event) => {
          const sessionState = event.sessionState;
          console.log('Cast session state changed:', sessionState);
          setIsCasting(
            sessionState === window.cast.framework.SessionState.SESSION_STARTED ||
              sessionState === window.cast.framework.SessionState.SESSION_RESUMED
          );
        }
      );

      setCastingAvailable(true);
      setCastApiLoaded(true);
      return true;
    } catch (error) {
      console.error('Error initializing Cast API:', error);
      return false;
    }
  };

  // Load the Cast SDK
  useEffect(() => {
    console.log('CastButton component mounted');

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
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
      script.async = true;
      document.head.appendChild(script);
    }

    // Cleanup function
    return () => {
      // Remove the global callback when component unmounts
      window.__onGCastApiAvailable = null;
    };
  }, []);

  // Function to start casting
  const startCasting = async () => {
    if (!castApiLoaded || !window.cast || !window.cast.framework) {
      console.error('Cast API not loaded');
      return;
    }

    try {
      console.log('Starting cast session...');

      // Get the current origin with protocol
      const origin = window.location.origin;
      // Create the correct cast URL
      const castUrl = `${origin}/${room}/cast`;
      console.log('Target cast URL:', castUrl);

      // Use the CastContext to request a session
      const castContext = window.cast.framework.CastContext.getInstance();

      try {
        // Request a session using the higher-level Cast framework API
        const castSession = await castContext.requestSession();
        console.log('Cast session created successfully:', castSession);

        // Create a load request for the URL
        const loadRequest = new window.cast.framework.messages.LoadRequest();
        loadRequest.media = {
          contentId: castUrl,
          contentType: 'text/html',
          streamType: window.cast.framework.messages.StreamType.NONE,
        };

        // Load the media
        castSession
          .loadMedia(loadRequest)
          .then(() => {
            console.log('Media loaded successfully');
            setIsCasting(true);
          })
          .catch((error) => {
            console.error('Failed to load media:', error);
          });
      } catch (error) {
        console.error('Failed to create session:', error);
      }
    } catch (error) {
      console.error('Error in startCasting:', error);
    }
  };

  // Function to stop casting
  const stopCasting = () => {
    if (!castApiLoaded || !window.cast || !window.cast.framework) {
      console.error('Cast API not loaded');
      return;
    }

    try {
      const castSession = window.cast.framework.CastContext.getInstance().getCurrentSession();

      if (castSession) {
        console.log('Ending cast session...');
        castSession.endSession(true);
        setIsCasting(false);
      } else {
        console.error('No active cast session found');
      }
    } catch (error) {
      console.error('Error stopping cast session:', error);
    }
  };

  // Toggle casting
  const toggleCasting = () => {
    if (isCasting) {
      stopCasting();
    } else {
      startCasting();
    }
  };

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
