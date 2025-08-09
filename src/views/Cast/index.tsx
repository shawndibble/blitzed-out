import './styles.css';
import '@/types/window';

import { Box, Button, Divider, Grid, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { ActionCard } from '@/types/cast';
import { Message } from '@/types/Message';
import RoomBackground from '@/components/RoomBackground';
import ToastAlert from '@/components/ToastAlert';
import { Trans } from 'react-i18next';
import { getAuth } from 'firebase/auth';
import latestMessageByType from '@/helpers/messages';
import { loginAnonymously } from '@/services/firebase';
import { t } from 'i18next';
import useFullscreenStatus from '@/hooks/useFullscreenStatus';
import useMessages from '@/context/hooks/useMessages';
import { useParams } from 'react-router-dom';
import usePrivateRoomBackground from '@/hooks/usePrivateRoomBackground';
import useTurnIndicator from '@/hooks/useTurnIndicator';

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
        className="flex-column cast-main-container"
        style={{
          backgroundImage: !isVideo && url ? `url(${url})` : 'none',
        }}
      >
        {!!url && <RoomBackground url={url} isVideo={isVideo} />}

        {/* User interaction overlay - only when needed and positioned to not block video controls */}
        {needsUserInteraction && (
          <Box onClick={handleUserInteraction} className="user-interaction-overlay">
            Click to enable autoplay
          </Box>
        )}
        <Grid
          container
          spacing={0}
          direction="column"
          alignItems="center"
          justifyContent="center"
          className="cast-container cast-grid-container"
        >
          <Grid container justifyContent="center">
            <div className="action-box-large responsive-cast-box">
              <Typography variant="h2" className="cast-title">
                blitzedout.com/{room}
              </Typography>
              {isLoading ? (
                <Typography variant="h4" className="cast-loading-text">
                  Connecting to game...
                </Typography>
              ) : (
                <Typography variant="h4" className="cast-ready-text">
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
      className="flex-column cast-main-container"
      onClick={needsUserInteraction ? handleUserInteraction : undefined}
      style={{
        backgroundImage: !isVideo && url ? `url(${url})` : 'none',
        cursor: needsUserInteraction ? 'pointer' : 'default',
      }}
    >
      {!!url && <RoomBackground url={url} isVideo={isVideo} />}
      <Box display="flex" justifyContent="space-between" className="cast-header-bar">
        <Box flex="1">
          {!isCastReceiver && !isFullscreen && (
            <Button variant="text" onClick={toggleFullscreen} className="cast-fullscreen-button">
              {t('fullscreen')}
            </Button>
          )}
        </Box>

        <Box textAlign="center" flex="1" key={nextPlayer?.displayName}>
          {!!nextPlayer?.displayName && (
            <Typography variant="h4" className="cast-next-player">
              <Trans i18nKey="nextPlayersTurn" values={{ player: nextPlayer.displayName }} />
            </Typography>
          )}
        </Box>

        <Box flex="1" textAlign="right" className="text-stroke">
          {activity && (
            <Typography variant="h4" className="cast-room-url">
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
        className="cast-container cast-grid-container-adjusted"
        key={messages.length}
      >
        <Grid container justifyContent="center">
          {activity ? (
            <Grid size={12} className="action-box-responsive responsive-cast-box">
              <Typography variant="h3" className="cast-type-text">
                {`${type} ${t('for')} ${displayName}`}
              </Typography>
              <Box className="cast-divider">
                <Divider />
              </Box>
              <Typography variant="h1" className="cast-activity-text">
                {activity}
              </Typography>
            </Grid>
          ) : (
            <div className="action-box-responsive responsive-cast-box">
              <Typography variant="h1" className="cast-room-main">
                blitzedout.com/{room}
              </Typography>
            </div>
          )}
        </Grid>
      </Grid>

      <ToastAlert open={!!openAlert} close={() => setOpenAlert(false)} hideCloseButton>
        <Typography variant="h5" className="cast-alert-text">
          {alertMessage}
        </Typography>
      </ToastAlert>
    </Box>
  );
}
