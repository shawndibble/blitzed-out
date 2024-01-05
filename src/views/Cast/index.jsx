import { Box, Grid, Typography } from '@mui/material';
import ToastAlert from 'components/ToastAlert';
import latestMessageByType from 'helpers/messages';
import useLocalStorage from 'hooks/useLocalStorage';
import useMessages from 'hooks/useMessages';
import usePrivateRoomBackground from 'hooks/usePrivateRoomBackground';
import { t } from 'i18next';
import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import RoomBackground from 'views/Room/RoomBackground';

const ACTION_TYPE = 'actions';

export default function Cast() {
  const { id: room } = useParams();
  const messages = useMessages(room);
  const settings = useLocalStorage('gameSettings')[0];
  const [alertMessage, setAlertMessage] = useState('');
  const [openAlert, setOpenAlert] = useState(false);

  const { isVideo, url } = usePrivateRoomBackground(messages, settings, room);

  const sortedMessages = useMemo(() => messages
    .sort((a, b) => a.timestamp.seconds - b.timestamp.seconds), [messages]);
  const latestMessage = sortedMessages[sortedMessages.length - 1];

  useEffect(() => {
    if (latestMessage?.type === 'settings') {
      setOpenAlert(true);
      setAlertMessage(`${latestMessage.displayName} ${t('changedSettings')}`);
    }
  }, [latestMessage]);

  const lastAction = useMemo(() => latestMessageByType(messages, ACTION_TYPE), [messages]);

  if (!messages.length || !lastAction) return null;

  const { text, displayName } = lastAction;
  const splitText = text.split('\n');
  const [type, activity] = splitText.slice(1);

  return (
    <>
      {!!url && (<RoomBackground url={url} isVideo={isVideo} />)}
      <Grid
        container
        spacing={0}
        direction="column"
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: '100vh' }}
      >
        <Grid item xs={3} padding="5%">
          <Box className="cast-container">
            <div className="title">
              <Typography variant="h3">
                {`${type} ${t('for')} ${displayName}`}
              </Typography>
            </div>
            <div className="description">
              <Typography variant="h1">{activity}</Typography>
            </div>
          </Box>
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
    </>
  );
}
