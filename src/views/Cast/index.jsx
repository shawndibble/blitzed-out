import { Box, Grid, Typography } from '@mui/material';
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
import RoomBackground from 'views/Room/RoomBackground';

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
    <>
      {!!url && (<RoomBackground url={url} isVideo={isVideo} />)}
      {!!nextPlayer && (
        <Box sx={{ mt: 2, mb: -2, textAlign: 'center' }}>
          <Typography variant="h5">
            <Trans i18nKey="nextPlayersTurn" values={{ nextPlayer }} />
          </Typography>
        </Box>
      )}
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
