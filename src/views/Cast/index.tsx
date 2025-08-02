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

  // Force early debugging - this should show up even if other code fails
  try {
    console.log('=== CAST COMPONENT LOADED ===');
    console.log('Room:', room);
    console.log('Window location:', window.location.href);
    console.log('User agent:', navigator.userAgent);
    console.log('Environment checks:', {
      isProduction: process.env.NODE_ENV === 'production',
      hasConsole: typeof console !== 'undefined',
      hasAlert: typeof alert !== 'undefined',
      hasDocument: typeof document !== 'undefined',
      hasWindow: typeof window !== 'undefined',
      documentTitle: document.title,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Even if console fails, try alert
    if (typeof alert !== 'undefined') {
      alert('Cast component loaded, room: ' + room + ' Error: ' + error);
    }
  }

  // Get messages context - let it throw if context is not available, we'll catch it with error boundary
  const { messages, isLoading } = useMessages();

  console.log('=== HOOK RESULTS ===');
  console.log('Messages loaded:', {
    messagesCount: messages?.length || 0,
    isLoading,
    firstMessage: messages?.[0] || null,
    lastMessage: messages?.[messages.length - 1] || null,
  });

  const { isVideo, url } = usePrivateRoomBackground(messages);
  console.log('Background info:', { isVideo, url: url || 'none' });

  const lastAction = latestMessageByType(messages, ACTION_TYPE);
  console.log('Last action:', lastAction || 'none');

  const nextPlayer = useTurnIndicator(lastAction);
  console.log('Next player:', nextPlayer || 'none');

  const { isFullscreen, toggleFullscreen } = useFullscreenStatus();
  console.log('Fullscreen status:', isFullscreen);

  useEffect(() => {
    // Check if we're running in a Cast receiver environment
    const isCastEnvironment = window.cast?.framework?.CastReceiverContext;
    const userAgent = navigator.userAgent;
    const isChromecast = userAgent.includes('CrKey') || userAgent.includes('TV');

    // More robust detection for cast environment
    const isActuallyCasting =
      isCastEnvironment || isChromecast || window.location.search.includes('chromecast');

    console.log('Cast detection:', {
      isCastEnvironment: !!isCastEnvironment,
      isChromecast,
      userAgent,
      isActuallyCasting,
      url: window.location.href,
    });

    if (isActuallyCasting) {
      document.body.classList.add('cast-receiver-mode');
      setIsCastReceiver(true);
      console.log('Cast receiver mode activated');
    }

    return () => {
      if (isActuallyCasting) {
        document.body.classList.remove('cast-receiver-mode');
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

  console.log('=== RENDER STATE ===');
  console.log('Cast render state:', {
    isLoading,
    messagesLength: messages?.length || 0,
    lastAction: !!lastAction,
    room,
    isCastReceiver,
    url: window.location.href,
    windowDimensions: { width: window.innerWidth, height: window.innerHeight },
    bodyClasses: document.body.className,
    hasRoomBackground: !!url,
  });

  // Check DOM state
  console.log('=== DOM DEBUG ===');
  console.log('Document ready state:', document.readyState);
  console.log('Body background color:', getComputedStyle(document.body).backgroundColor);
  console.log('Cast container exists:', !!document.querySelector('.cast-container'));

  if (!lastAction) {
    console.log('No lastAction found, showing fallback');
    // Show fallback content instead of returning null
    return (
      <div
        style={{
          backgroundColor: '#000',
          color: '#fff',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          padding: '20px',
        }}
      >
        <div>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>blitzedout.com/{room}</div>
          <div style={{ fontSize: '24px' }}>
            {isLoading ? 'Loading...' : 'Waiting for game to start'}
          </div>
          <div style={{ fontSize: '16px', marginTop: '20px', opacity: 0.7 }}>
            DEBUG: Cast fallback mode - Room: {room} | Loading: {isLoading ? 'yes' : 'no'} |
            Messages: {messages?.length || 0}
          </div>
          <div style={{ fontSize: '12px', marginTop: '10px', opacity: 0.5 }}>
            Time: {new Date().toLocaleTimeString()} | UA: {navigator.userAgent.substring(0, 50)}...
          </div>
          <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.5 }}>
            Cast Receiver: {isCastReceiver ? 'YES' : 'NO'} | Body Classes:{' '}
            {document.body.className || 'none'}
          </div>
        </div>
      </div>
    );
  }

  const { displayName, type, activity } = actionCard(lastAction);

  return (
    <Box
      className="flex-column"
      style={{
        backgroundColor: isCastReceiver ? '#000' : 'transparent',
        color: 'white',
        minHeight: '100vh',
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
              style={{ color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
            >
              <Trans i18nKey="nextPlayersTurn" values={{ player: nextPlayer.displayName }} />
            </Typography>
          )}
        </Box>

        <Box flex="1" textAlign="right" className="text-stroke">
          {activity && (
            <Typography
              variant="h4"
              style={{ color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
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
              className="action-box"
              style={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: '2rem',
                borderRadius: '0.5rem',
                maxWidth: '80%',
                margin: '0 auto',
              }}
            >
              <Typography
                variant="h3"
                style={{ color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
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
                }}
              >
                {activity}
              </Typography>
            </Grid>
          ) : (
            <div
              className="action-box"
              style={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: '2rem',
                borderRadius: '0.5rem',
                maxWidth: '80%',
                margin: '0 auto',
              }}
            >
              <Typography
                variant="h1"
                style={{
                  color: 'white',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  fontWeight: 600,
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
