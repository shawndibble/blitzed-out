import { Help } from '@mui/icons-material';
import {
  Box, Stack, Switch, TextField, Tooltip, Typography,
} from '@mui/material';
import { customAlphabet } from 'nanoid';
import { Trans } from 'react-i18next';
import { useParams } from 'react-router-dom';

export default function PrivateRoomToggle({ formData, setFormData }) {
  const { id: room } = useParams();
  const handleChange = (event) => setFormData({
    ...formData,
    room: event.target.value,
    boardUpdated: true,
  });

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleChange(event);
    }
  };

  const togglePrivateRoomField = (event) => {
    // toggleVal === true, we want a private room, so get the one in the URL or generate one.
    // toggleVal === false, we want the public room.
    const roomId = event.target.checked
      ? room || customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 5)()
      : null;

    setFormData({ ...formData, room: roomId });
  };

  return (
    <Box sx={{ margin: '0.5rem' }}>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="center"
        sx={{ width: '100%' }}
      >
        <Typography><Trans i18nKey="public" /></Typography>
        <Switch
          id="showPrivate"
          checked={!!formData.room}
          onChange={togglePrivateRoomField}
          inputProps={{ 'aria-label': <Trans i18nKey="private" /> }}
        />
        <Typography><Trans i18nKey="private" /></Typography>
      </Stack>

      {!!formData.room && (
        <>
          <TextField
            fullWidth
            id="privateRoom"
            label="Private Room"
            defaultValue={formData.room}
            margin="normal"
            onBlur={(event) => handleChange(event)}
            onKeyDown={(event) => handleKeyDown(event)}
          />
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="center"
            sx={{ mt: 1 }}
          >
            <Typography><Trans i18nKey="solo" /></Typography>
            <Tooltip
              title={<Typography variant="subtitle2"><Trans i18nKey="soloTooltip" /></Typography>}
              arrow
            >
              <Help sx={{ fontSize: 15 }} />
            </Tooltip>
            <Switch
              id="gameMode"
              checked={formData.gameMode === 'local'}
              onChange={(event) => setFormData({
                ...formData, gameMode: event.target.checked ? 'local' : 'online',
              })}
              inputProps={{ 'aria-label': 'Game Type' }}
            />
            <Typography>
              <Trans i18nKey="local" />
            </Typography>
            <Tooltip
              title={<Typography variant="subtitle2"><Trans i18nKey="localTooltip" /></Typography>}
              arrow
            >
              <Help sx={{ fontSize: 15 }} />
            </Tooltip>
          </Stack>
        </>
      )}
    </Box>
  );
}
