import { IconButton, Tooltip } from '@mui/material';
import { Params, useParams } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';

import CastConnectedIcon from '@mui/icons-material/CastConnected';
import CastIcon from '@mui/icons-material/Cast';
import { t } from 'i18next';

// Global flags to track Cast API state
window.__castApiInitialized = window.__castApiInitialized || false;
window.__castScriptLoading = window.__castScriptLoading || false;

export default function CastButton(): JSX.Element | null {
  const [isCasting, setIsCasting] = useState<boolean>(false);
  const [castSession, setCastSession] = useState<any>(null);
  const { id: room } = useParams<Params>();
  const castButtonRef = useRef<HTMLButtonElement>(null);
  const [castReady, setCastReady] = useState<boolean>(false);
  const [userRequestedStop, setUserRequestedStop] = useState<boolean>(false);

  // Reset casting state and session
  const resetCastingState = useCallback((clearUserStopFlag = false) => {
    setIsCasting(false);
    setCastSession(null);
    if (clearUserStopFlag) {
      setUserRequestedStop(false);
    }
  }, []);

  // Function to send a message to the cast session
  const sendCastMessage = useCallback(
    (session: any) => {
      try {
        const castUrl = `${window.location.origin}/${room}/cast`;

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
          setCastReady(true);
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
        setCastReady(true);
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
                // Only set to casting if user didn't request stop
                if (!userRequestedStop) {
                  setIsCasting(true);
                  setCastSession(session);
                  if (session && room) {
                    sendCastMessage(session);
                  }
                }
                break;
              case window.cast?.framework?.SessionState.SESSION_ENDED:
                resetCastingState(true); // Clear user stop flag when session actually ends
                break;
              default:
                // Handle SESSION_STARTING and SESSION_ENDING states
                if (event.sessionState === 'SESSION_ENDING') {
                  resetCastingState();
                }
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
      if (!document.querySelector('script[src*="cast_sender.js"]') && !window.__castScriptLoading) {
        window.__castScriptLoading = true;
        const script = document.createElement('script');
        script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
        script.onload = () => {
          window.__castScriptLoading = false;
        };
        script.onerror = () => {
          window.__castScriptLoading = false;
          console.error('Failed to load Cast SDK');
        };
        document.head.appendChild(script);
      }
    }

    // Cleanup function
    return () => {
      // Don't reset the global callback as other instances might need it
    };
  }, [room, sendCastMessage, userRequestedStop, resetCastingState]);

  // Function to toggle casting
  const toggleCasting = () => {
    if (!castReady) {
      console.warn('Cast API not ready yet');
      return;
    }

    if (isCasting) {
      // Stop casting
      setUserRequestedStop(true);

      // Immediately set state since user requested it - don't wait for API response
      resetCastingState();

      // Send the disconnect request but don't wait for response
      try {
        const castContext = window.cast?.framework?.CastContext.getInstance();
        if (castContext) {
          castContext.endCurrentSession(true);
        }

        if (castSession) {
          castSession.endSession(true);
        }
      } catch {
        // Silently ignore disconnect errors since we've already updated the UI
      }
    } else {
      // Clear user stop flag when starting new session
      setUserRequestedStop(false);
      // Start casting
      try {
        const castContext = window.cast?.framework?.CastContext.getInstance();
        if (castContext) {
          castContext
            .requestSession()
            .catch((error: Error) => console.error('Error requesting cast session:', error));
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

  if (!castReady) return null;

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
