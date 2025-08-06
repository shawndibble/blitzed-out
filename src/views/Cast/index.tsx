import { Box, Button, Divider, Grid, Typography } from '@mui/material';
import ToastAlert from '@/components/ToastAlert';
import latestMessageByType from '@/helpers/messages';
import useMessages from '@/context/hooks/useMessages';
import usePrivateRoomBackground from '@/hooks/usePrivateRoomBackground';
import useTurnIndicator from '@/hooks/useTurnIndicator';
import { t } from 'i18next';
import { useEffect, useState } from 'react';
import { Trans } from 'react-i18next';
import { useParams } from 'react-router-dom';
import RoomBackground from '@/components/RoomBackground';
import './styles.css';
import useFullscreenStatus from '@/hooks/useFullscreenStatus';
import { ActionCard } from '@/types/cast';
import { Message } from '@/types/Message';
import '@/types/window';
import { loginAnonymously } from '@/services/firebase';
import { getAuth } from 'firebase/auth';

const ACTION_TYPE = 'actions';

const actionCard = (lastAction: Message): ActionCard => {
  const { text, displayName } = lastAction;
  if (!displayName) return {};

  const splitText = text?.split('\n');
  const [typeString, activityString] = splitText?.slice(1) || [];
  const type = typeString?.split(':')[1]?.trim();
  const activity = activityString?.split(':')[1]?.trim();

  return { displayName, type, activity };
};

export default function Cast() {
  const { id: room } = useParams<{ id: string }>();
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [openAlert, setOpenAlert] = useState<boolean>(false);
  const [isCastReceiver, setIsCastReceiver] = useState<boolean>(false);
  const [needsUserInteraction, setNeedsUserInteraction] = useState<boolean>(false);

  // Get messages context - let it throw if context is not available, we'll catch it with error boundary
  const { messages, isLoading } = useMessages();

  const { isVideo, url } = usePrivateRoomBackground(messages);

  const lastAction = latestMessageByType(messages, ACTION_TYPE);
  const nextPlayer = useTurnIndicator(lastAction);
  const { isFullscreen, toggleFullscreen } = useFullscreenStatus();

  // Auto-login anonymously for cast functionality
  useEffect(() => {
    const auth = getAuth();

    if (!auth.currentUser) {
      loginAnonymously('Cast Viewer').catch((error) => {
        console.error('Anonymous login failed:', error);
      });
    }
  }, [room]);

  // Enhanced autoplay for Cast page
  useEffect(() => {
    if (!isVideo || !url) return;

    // Multiple attempts to ensure autoplay works
    const attemptAutoplay = () => {
      const videos = document.querySelectorAll('video');
      const iframes = document.querySelectorAll('iframe');

      // Force play all video elements
      videos.forEach((video) => {
        if (video.paused) {
          video.muted = true; // Ensure muted for autoplay policy
          video.play().catch((error) => {
            console.log('Video autoplay attempt failed:', error);
            setNeedsUserInteraction(true);
          });
        }
      });

      // For YouTube and other iframe embeds, ensure they're loaded with autoplay
      iframes.forEach((iframe) => {
        if (iframe.src) {
          try {
            const urlObj = new URL(iframe.src, window.location.origin);
            const params = urlObj.searchParams;
            let changed = false;
            if (params.get('autoplay') !== '1') {
              params.set('autoplay', '1');
              changed = true;
            }
            if (params.get('mute') !== '1') {
              params.set('mute', '1');
              changed = true;
            }
            if (changed) {
              urlObj.search = params.toString();
              iframe.src = urlObj.toString();
            }
          } catch {
            // If URL parsing fails, fallback to original logic
            if (!iframe.src.includes('autoplay=1')) {
              const separator = iframe.src.includes('?') ? '&' : '?';
              iframe.src += `${separator}autoplay=1&mute=1`;
            }
          }
        }
      });
    };

    // Initial attempt
    const timer1 = setTimeout(attemptAutoplay, 500);
    // Retry attempt
    const timer2 = setTimeout(attemptAutoplay, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isVideo, url, messages.length]);

  useEffect(() => {
    // Check if we're running in a Cast receiver environment
    const isCastEnvironment = window.cast?.framework?.CastReceiverContext;
    const userAgent = navigator.userAgent;
    const isChromecast = userAgent.includes('CrKey') || userAgent.includes('TV');
    const isInIframe = window.self !== window.top;

    // More robust detection for cast environment
    const isActuallyCasting =
      isCastEnvironment ||
      isChromecast ||
      window.location.search.includes('chromecast') ||
      window.location.search.includes('receiver');

    if (isActuallyCasting) {
      document.body.classList.add('cast-receiver-mode');
      document.body.classList.remove('theme-light');
      setIsCastReceiver(true);
    }

    // Add iframe detection for background positioning
    if (isInIframe) {
      document.body.classList.add('in-iframe');
    }

    return () => {
      if (isActuallyCasting) {
        document.body.classList.remove('cast-receiver-mode');
      }
      if (isInIframe) {
        document.body.classList.remove('in-iframe');
      }
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const latestMessage = messages[messages.length - 1];

    if (latestMessage?.type === 'settings') {
      setOpenAlert(true);
      setAlertMessage(`${latestMessage.displayName} ${t('changedSettings')}`);
    }
  }, [messages, isLoading]);

  // Handle user interaction to start playback
  const handleUserInteraction = () => {
    const videos = document.querySelectorAll('video');
    videos.forEach((video) => {
      if (video.paused) {
        video.play().catch(console.error);
      }
    });
    setNeedsUserInteraction(false);
  };

  if (!lastAction) {
    return (
      <Box
        className="flex-column"
        style={{
          backgroundColor: 'transparent',
          color: 'white',
          minHeight: '100vh',
          backgroundImage: !isVideo && url ? `url(${url})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
        }}
      >
        {!!url && <RoomBackground url={url} isVideo={isVideo} />}

        {/* User interaction overlay - only when needed and positioned to not block video controls */}
        {needsUserInteraction && (
          <Box
            onClick={handleUserInteraction}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: '80px', // Leave space for video controls at bottom
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              fontSize: '1.5rem',
              cursor: 'pointer',
              zIndex: 1000,
            }}
          >
            Click to enable autoplay
          </Box>
        )}
        <Grid
          container
          spacing={0}
          direction="column"
          alignItems="center"
          justifyContent="center"
          className="cast-container"
          style={{ minHeight: '100vh' }}
        >
          <Grid container justifyContent="center">
            <div
              className="action-box responsive-cast-box"
              style={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: 'clamp(1rem, 4vw, 4rem)',
                borderRadius: 'clamp(0.5rem, 1vw, 1rem)',
                textAlign: 'center',
                width: 'clamp(320px, 90vw, 1400px)',
                margin: '0 auto',
              }}
            >
              <Typography
                variant="h2"
                style={{
                  color: 'white',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  marginBottom: '1rem',
                  fontSize: 'clamp(1.5rem, 6vw, 4rem)',
                }}
              >
                blitzedout.com/{room}
              </Typography>
              {isLoading ? (
                <Typography
                  variant="h4"
                  style={{
                    color: '#90CAF9',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    fontSize: 'clamp(1rem, 4vw, 2.5rem)',
                  }}
                >
                  Connecting to game...
                </Typography>
              ) : (
                <Typography
                  variant="h4"
                  style={{
                    color: '#A5D6A7',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    fontSize: 'clamp(1rem, 4vw, 2.5rem)',
                  }}
                >
                  Ready for game to start
                </Typography>
              )}
            </div>
          </Grid>
        </Grid>
      </Box>
    );
  }

  const { displayName, type, activity } = actionCard(lastAction);

  return (
    <Box
      className="flex-column"
      onClick={needsUserInteraction ? handleUserInteraction : undefined}
      style={{
        backgroundColor: 'transparent',
        color: 'white',
        minHeight: '100vh',
        backgroundImage: !isVideo && url ? `url(${url})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        cursor: needsUserInteraction ? 'pointer' : 'default',
      }}
    >
      {!!url && <RoomBackground url={url} isVideo={isVideo} />}
      <Box display="flex" justifyContent="space-between" sx={{ mx: 2, mt: 2, mb: -2 }}>
        <Box flex="1">
          {!isCastReceiver && !isFullscreen && (
            <Button variant="text" onClick={toggleFullscreen} style={{ color: 'white' }}>
              {t('fullscreen')}
            </Button>
          )}
        </Box>

        <Box textAlign="center" flex="1" key={nextPlayer?.displayName}>
          {!!nextPlayer?.displayName && (
            <Typography
              variant="h4"
              style={{
                color: 'white',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                fontSize: 'clamp(1rem, 3vw, 2rem)',
              }}
            >
              <Trans i18nKey="nextPlayersTurn" values={{ player: nextPlayer.displayName }} />
            </Typography>
          )}
        </Box>

        <Box flex="1" textAlign="right" className="text-stroke">
          {activity && (
            <Typography
              variant="h4"
              style={{
                color: 'white',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                fontSize: 'clamp(0.8rem, 2.5vw, 1.5rem)',
              }}
            >
              blitzedout.com/{room}
            </Typography>
          )}
        </Box>
      </Box>

      <Grid
        container
        spacing={0}
        direction="column"
        alignItems="center"
        justifyContent="center"
        className="cast-container"
        key={messages.length}
        style={{ minHeight: 'calc(100vh - 5rem)' }}
      >
        <Grid container justifyContent="center">
          {activity ? (
            <Grid
              size={12}
              className="action-box responsive-cast-box"
              style={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: 'clamp(1rem, 4vw, 4rem)',
                borderRadius: 'clamp(0.5rem, 1vw, 1rem)',
                maxWidth: '95vw',
                minWidth: 'fit-content',
                margin: '0 auto',
              }}
            >
              <Typography
                variant="h3"
                style={{
                  color: 'white',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  fontSize: 'clamp(1.2rem, 5vw, 3rem)',
                }}
              >
                {`${type} ${t('for')} ${displayName}`}
              </Typography>
              <Box
                className="divider"
                style={{
                  marginTop: '-0.5rem',
                  height: '0.5rem',
                  backgroundColor: 'white',
                  border: '2px solid black',
                }}
              >
                <Divider />
              </Box>
              <Typography
                variant="h1"
                style={{
                  color: 'white',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  fontWeight: 600,
                  fontSize: 'clamp(1.8rem, 8vw, 6rem)',
                  lineHeight: 1.2,
                }}
              >
                {activity}
              </Typography>
            </Grid>
          ) : (
            <div
              className="action-box responsive-cast-box"
              style={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: 'clamp(1rem, 4vw, 4rem)',
                borderRadius: 'clamp(0.5rem, 1vw, 1rem)',
                maxWidth: '95vw',
                minWidth: 'fit-content',
                margin: '0 auto',
              }}
            >
              <Typography
                variant="h1"
                style={{
                  color: 'white',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  fontWeight: 600,
                  fontSize: 'clamp(1.8rem, 8vw, 6rem)',
                  lineHeight: 1.2,
                }}
              >
                blitzedout.com/{room}
              </Typography>
            </div>
          )}
        </Grid>
      </Grid>

      <ToastAlert open={!!openAlert} close={() => setOpenAlert(false)} hideCloseButton>
        <Typography variant="h5" style={{ color: 'white' }}>
          {alertMessage}
        </Typography>
      </ToastAlert>
    </Box>
  );
}
