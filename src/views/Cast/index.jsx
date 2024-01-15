import {
  Box, Divider, Grid, Typography,
} from '@mui/material';
import ToastAlert from 'components/ToastAlert';
import latestMessageByType from 'helpers/messages';
import useLocalStorage from 'hooks/useLocalStorage';
import useMessages from 'hooks/useMessages';
import usePrivateRoomBackground from 'hooks/usePrivateRoomBackground';
import useTurnIndicator from 'hooks/useTurnIndicator';
import { t } from 'i18next';
import { useEffect, useState, useMemo } from 'react';
import { Trans } from 'react-i18next';
import { useParams } from 'react-router-dom';
import RoomBackground from 'components/RoomBackground';
import './styles.css';

const ACTION_TYPE = 'actions';

export default function Cast() {
  const { id: room } = useParams();
  const { messages, isLoading } = useMessages(room);
  const settings = useLocalStorage('gameSettings')[0];
  const [alertMessage, setAlertMessage] = useState('');
  const [openAlert, setOpenAlert] = useState(false);

  const { isVideo, url } = usePrivateRoomBackground(messages, settings, room);

  const lastAction = useMemo(() => latestMessageByType(messages, ACTION_TYPE), [messages]);
  const nextPlayer = useTurnIndicator(room, lastAction);

  useEffect(() => {
    if (isLoading) return;

    messages.sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);
    const latestMessage = messages[messages.length - 1];

    if (latestMessage?.type === 'settings') {
      setOpenAlert(true);
      setAlertMessage(`${latestMessage.displayName} ${t('changedSettings')}`);
    }
  }, [messages, isLoading]);

  if (!messages.length || !lastAction) return null;

  const { text, displayName } = lastAction;
  const splitText = text.split('\n');
  const [typeString, activityString] = splitText.slice(1);
  const type = typeString.split(':')[1].trim();
  const activity = activityString.split(':')[1].trim();

  return (
    <Box className="text-stroke flex-column">
      {!!url && (<RoomBackground url={url} isVideo={isVideo} />)}
      {!!nextPlayer?.displayName && (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5">
            <Trans i18nKey="nextPlayersTurn" values={{ player: nextPlayer.displayName }} />
          </Typography>
        </Box>
      )}
      <Grid
        container
        spacing={0}
        direction="column"
        alignItems="center"
        justifyContent="center"
        className="cast-container"
      >
        <Grid item container justifyContent="center">
          <Grid item xl={8} lg={10} md={10} className="action-box">
            <Typography variant="h3">
              {`${type} ${t('for')} ${displayName}`}
            </Typography>
            <Box className="divider"><Divider /></Box>
            <Typography variant="h1">{activity}</Typography>
          </Grid>
        </Grid>
      </Grid>
      <ToastAlert
        open={!!openAlert}
        setOpen={setOpenAlert}
        close={() => setOpenAlert(false)}
        hideCloseButton
      >
        <Typography variant="h5">{alertMessage}</Typography>
      </ToastAlert>
    </Box>
  );
}
