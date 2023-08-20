import { Help } from '@mui/icons-material';
import {
  Box, Divider, Stack, Switch, TextField, Tooltip, Typography,
} from '@mui/material';
import { customAlphabet } from 'nanoid';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import BackgroundSelect from 'components/BackgroundSelect';
import GameSpeed from './GameSpeed';

export default function RoomSettings({ formData, setFormData }) {
  const { id: room } = useParams();
  const { t } = useTranslation();

  const backgrounds = {
    app: t('appBackground'),
    custom: t('customURL'),
  };

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
        <Tooltip
          title={<Typography variant="subtitle2"><Trans i18nKey="privateOptions" /></Typography>}
          arrow
        >
          <Help sx={{ fontSize: 15 }} />
        </Tooltip>
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
          <Divider sx={{ my: 1 }} />
          <GameSpeed formData={formData} setFormData={setFormData} />
          <Divider sx={{ my: 1 }} />
          <BackgroundSelect
            formData={formData}
            setFormData={setFormData}
            backgrounds={backgrounds}
            isRoom="true"
          />
        </>
      )}
    </Box>
  );
}
