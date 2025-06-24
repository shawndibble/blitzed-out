import { useState, useEffect, useRef, useCallback } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import CastIcon from '@mui/icons-material/Cast';
import CastConnectedIcon from '@mui/icons-material/CastConnected';
import { Params, useParams } from 'react-router-dom';
import { t } from 'i18next';

// Global flag to track if Cast API has been initialized
window.__castApiInitialized = window.__castApiInitialized || false;

export default function CastButton(): JSX.Element | null {
  const [isCasting, setIsCasting] = useState<boolean>(false);
  const [castSession, setCastSession] = useState<any>(null);
  const { id: room } = useParams<Params>();
  const castButtonRef = useRef<HTMLButtonElement>(null);
  const [castApiReady, setCastApiReady] = useState<boolean>(false);

  // Function to send a message to the cast session
  const sendCastMessage = useCallback(
    (session: any) => {
      try {
        const castUrl = `${window.location.origin}/${room}/cast`;
        console.log('Sending cast message with URL:', castUrl);

        session.sendMessage('urn:x-cast:com.blitzedout.app', {
          type: 'LOAD',
          url: castUrl,
        });
      } catch (error) {
        console.error('Error sending cast message:', error);
      }
    },
    [room]
  );

  // Initialize the Cast API when the component mounts
  useEffect(() => {
    // Function to initialize the Cast API
    const initializeCastApi = () => {
      try {
        if (!window?.cast?.framework) {
          return;
        }

        // Only initialize once
        if (window.__castApiInitialized) {
          setCastApiReady(true);
          setupSessionListener();
          return;
        }

        const castContext = window.cast.framework.CastContext.getInstance();

        // Use your custom receiver application ID
        castContext.setOptions({
          receiverApplicationId: '1227B8DE', // Keep your custom app ID
          autoJoinPolicy: window.chrome?.cast?.AutoJoinPolicy?.ORIGIN_SCOPED,
        });

        window.__castApiInitialized = true;
        setCastApiReady(true);
        setupSessionListener();
      } catch (error) {
        console.error('Error initializing Cast API:', error);
      }
    };

    // Set up session state listener
    const setupSessionListener = () => {
      try {
        const castContext = window.cast?.framework?.CastContext.getInstance();
        if (!castContext) return;

        // Check if there's already an active session
        const currentSession = castContext.getCurrentSession();
        if (currentSession) {
          setIsCasting(true);
          setCastSession(currentSession);
          if (room) {
            sendCastMessage(currentSession);
          }
        }

        if (!window?.cast?.framework) return;

        // Set up session state listener
        castContext.addEventListener(
          window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
          (event: { sessionState: string }) => {
            const session = castContext.getCurrentSession();

            switch (event.sessionState) {
              case window.cast?.framework?.SessionState.SESSION_STARTED:
              case window.cast?.framework?.SessionState.SESSION_RESUMED:
                setIsCasting(true);
                setCastSession(session);
                if (session && room) {
                  sendCastMessage(session);
                }
                break;
              case window.cast?.framework?.SessionState.SESSION_ENDED:
                setIsCasting(false);
                setCastSession(null);
                break;
              default:
                break;
            }
          }
        );
      } catch (error) {
        console.error('Error setting up session listener:', error);
      }
    };

    // Check if the Cast API is already available
    if (window.chrome && window.chrome.cast && window.cast) {
      initializeCastApi();
    } else {
      // If not available, set up the callback for when it becomes available
      window.__onGCastApiAvailable = function (isAvailable: boolean) {
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
    }

    // Cleanup function
    return () => {
      // Don't reset the global callback as other instances might need it
    };
  }, [room, sendCastMessage]);

  // Function to toggle casting
  const toggleCasting = () => {
    if (!castApiReady) {
      return;
    }

    if (isCasting) {
      // Stop casting
      if (castSession) {
        castSession.endSession(true);
      }
    } else {
      // Start casting
      try {
        const castContext = window.cast?.framework?.CastContext.getInstance();
        if (castContext) {
          castContext.requestSession().then(
            () => console.log('Cast session requested successfully'),
            (error: Error) => console.error('Error requesting cast session:', error)
          );
        }
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
  }, [room, isCasting, castSession, sendCastMessage]);

  if (!castApiReady) return null;

  return (
    <Tooltip title={isCasting ? t('stopCasting') : t('startCasting')}>
      <IconButton
        ref={castButtonRef}
        onClick={toggleCasting}
        color={isCasting ? 'primary' : 'default'}
      >
        {isCasting ? <CastConnectedIcon /> : <CastIcon />}
      </IconButton>
    </Tooltip>
  );
}
