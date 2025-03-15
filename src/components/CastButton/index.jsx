import { useState, useEffect, useRef } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import CastIcon from '@mui/icons-material/Cast';
import CastConnectedIcon from '@mui/icons-material/CastConnected';
import { useParams } from 'react-router-dom';

export default function CastButton() {
  const [isCasting, setIsCasting] = useState(false);
  const [castSession, setCastSession] = useState(null);
  const { id: room } = useParams();
  const castButtonRef = useRef(null);
  const castButtonContainerRef = useRef(null);

  // Initialize the Cast API when the component mounts
  useEffect(() => {
    // Function to initialize the Cast API
    const initializeCastApi = () => {
      try {
        if (!window.cast || !window.cast.framework) {
          console.log('Cast framework not available yet');
          return;
        }

        const castContext = window.cast.framework.CastContext.getInstance();

        // Use your custom receiver application ID
        castContext.setOptions({
          receiverApplicationId: '1227B8DE', // Keep your custom app ID
          autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        });

        // Set up session state listener
        castContext.addEventListener(
          window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
          (event) => {
            const session = castContext.getCurrentSession();

            switch (event.sessionState) {
              case window.cast.framework.SessionState.SESSION_STARTED:
              case window.cast.framework.SessionState.SESSION_RESUMED:
                setIsCasting(true);
                setCastSession(session);
                if (session && room) {
                  sendCastMessage(session);
                }
                break;
              case window.cast.framework.SessionState.SESSION_ENDED:
                setIsCasting(false);
                setCastSession(null);
                break;
              default:
                break;
            }
          }
        );

        // Create and add the Google Cast button
        if (castButtonContainerRef.current) {
          // Clear previous button if it exists
          castButtonContainerRef.current.innerHTML = '';

          // Create the Google Cast button element
          const googleCastButton = document.createElement('google-cast-launcher');
          googleCastButton.setAttribute('id', 'castbutton');
          googleCastButton.style.display = 'none'; // Hide the default button

          // Add the button to the DOM
          castButtonContainerRef.current.appendChild(googleCastButton);
        }
      } catch (error) {
        console.error('Error initializing Cast API:', error);
      }
    };

    // Check if the Cast API is already available
    if (window.chrome && window.chrome.cast && window.cast) {
      initializeCastApi();
    }

    // If not available, set up the callback for when it becomes available
    window.__onGCastApiAvailable = function (isAvailable) {
      if (isAvailable) {
        initializeCastApi();
      }
    };

    // Load the Cast API script if it hasn't been loaded yet
    if (!document.querySelector('script[src*="cast_sender.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
      document.head.appendChild(script);
    }

    // Cleanup function
    return () => {
      window.__onGCastApiAvailable = null;
    };
  }, [room]);

  // Function to send a message to the cast session
  const sendCastMessage = (session) => {
    try {
      const castUrl = `${window.location.origin}/${room}/cast`;
      console.log('Sending cast message with URL:', castUrl);

      session.sendMessage('urn:x-cast:com.blitzedout.cast', {
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
    <>
      {/* Hidden container for the Google Cast button */}
      <Box ref={castButtonContainerRef} sx={{ display: 'none' }}></Box>

      {/* Our custom Cast button */}
      <Tooltip title={isCasting ? 'Stop Casting' : 'Cast to TV'}>
        <IconButton
          ref={castButtonRef}
          onClick={toggleCasting}
          color={isCasting ? 'primary' : 'default'}
        >
          {isCasting ? <CastConnectedIcon /> : <CastIcon />}
        </IconButton>
      </Tooltip>
    </>
  );
}
