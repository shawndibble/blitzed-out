import { Box, Button, Divider, Grid2, Typography } from '@mui/material';
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
import React from 'react';
import { ActionCard, Message, TurnIndicator } from '@/types/cast';

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

// Define the Cast interface for window

// Define the window with cast properties
declare global {
  interface Window {
    cast?: {
      framework?: {
        CastReceiverContext?: any;
      };
    };
  }
}

export default function Cast() {
  const { id: room } = useParams<{ id: string }>();
  const { messages, isLoading } = useMessages();
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [openAlert, setOpenAlert] = useState<boolean>(false);
  const [isCastReceiver, setIsCastReceiver] = useState<boolean>(false);

  const { isVideo, url } = usePrivateRoomBackground(messages);

  const lastAction = latestMessageByType(messages, ACTION_TYPE) || {};
  const nextPlayer = useTurnIndicator(lastAction);
  const { isFullscreen, toggleFullscreen } = useFullscreenStatus();

  useEffect(() => {
    // Check if we're running in a Cast receiver environment
    const isCastEnvironment = window.cast?.framework?.CastReceiverContext;

    if (isCastEnvironment) {
      document.body.classList.add('cast-receiver-mode');
      setIsCastReceiver(true);
    }

    return () => {
      if (isCastEnvironment) {
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

  const { displayName, type, activity } = actionCard(lastAction);

  return (
    <Box className="flex-column">
      {!!url && <RoomBackground url={url} isVideo={isVideo} />}
      <Box display="flex" justifyContent="space-between" sx={{ mx: 2, mt: 2, mb: -2 }}>
        <Box flex="1">
          {!isCastReceiver && !isFullscreen && (
            <Button variant="text" onClick={toggleFullscreen}>
              Fullscreen
            </Button>
          )}
        </Box>

        <Box textAlign="center" flex="1" key={nextPlayer?.displayName}>
          {!!nextPlayer?.displayName && (
            <Typography variant="h4">
              <Trans i18nKey="nextPlayersTurn" values={{ player: nextPlayer.displayName }} />
            </Typography>
          )}
        </Box>

        <Box flex="1" textAlign="right" className="text-stroke">
          {activity && <Typography variant="h4">blitzedout.com/{room}</Typography>}
        </Box>
      </Box>

      <Grid2
        container
        spacing={0}
        direction="column"
        alignItems="center"
        justifyContent="center"
        className="cast-container"
        key={messages.length}
      >
        <Grid2 container justifyContent="center">
          {activity ? (
            <Grid2 size={12} className="action-box">
              <Typography variant="h3">{`${type} ${t('for')} ${displayName}`}</Typography>
              <Box className="divider">
                <Divider />
              </Box>
              <Typography variant="h1">{activity}</Typography>
            </Grid2>
          ) : (
            <div className="action-box">
              <Typography variant="h1">blitzedout.com/{room}</Typography>
            </div>
          )}
        </Grid2>
      </Grid2>

      <ToastAlert open={!!openAlert} close={() => setOpenAlert(false)} hideCloseButton>
        <Typography variant="h5">{alertMessage}</Typography>
      </ToastAlert>
    </Box>
  );
}
