import { Help } from '@mui/icons-material';
import {
  Box,
  Divider,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import BackgroundSelect from 'components/BackgroundSelect';
import { customAlphabet } from 'nanoid';
import { useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import GameSpeed from './GameSpeed';

const PUBLIC_ROOM = 'PUBLIC';

export default function RoomSettings({ formData, setFormData }) {
  const { id: room } = useParams();
  const { t } = useTranslation();

  const backgrounds = {
    app: t('appBackground'),
    custom: t('customURL'),
  };

  const handleChange = useCallback(
    (event) => {
      setFormData({
        ...formData,
        room: event.target.value,
        boardUpdated: true,
      });
    },
    [formData, setFormData]
  );

  const togglePrivateRoomField = useCallback(
    (event) => {
      let roomId;

      if (event.target.checked && room.toUpperCase() === PUBLIC_ROOM) {
        roomId = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 5)();
      } else if (event.target.checked && room.toUpperCase() !== PUBLIC_ROOM) {
        roomId = room;
      } else {
        roomId = PUBLIC_ROOM;
      }

      setFormData({
        ...formData,
        room: roomId,
        gameMode:
          roomId.toUpperCase() === PUBLIC_ROOM ? 'online' : formData.gameMode,
      });
    },
    [room, formData, setFormData]
  );

  return (
    <Box sx={{ margin: '0.5rem' }}>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="center"
        sx={{ width: '100%' }}
      >
        <Typography>
          <Trans i18nKey="public" />
        </Typography>
        <Switch
          id="showPrivate"
          checked={formData.room.toUpperCase() !== PUBLIC_ROOM}
          onChange={togglePrivateRoomField}
          inputProps={{ 'aria-label': <Trans i18nKey="private" /> }}
        />
        <Typography>
          <Trans i18nKey="private" />
        </Typography>
        <Tooltip
          title={
            <Typography variant="subtitle2">
              <Trans i18nKey="privateOptions" />
            </Typography>
          }
          arrow
        >
          <Help sx={{ fontSize: 15 }} />
        </Tooltip>
      </Stack>

      {formData.room.toUpperCase() !== PUBLIC_ROOM && (
        <>
          <TextField
            fullWidth
            id="privateRoom"
            label="Private Room"
            defaultValue={formData.room}
            margin="normal"
            onBlur={handleChange}
            onKeyDown={handleChange}
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
