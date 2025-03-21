import { Help } from '@mui/icons-material';
import { Stack, Switch, TextField, Tooltip, Typography } from '@mui/material';
import { isPublicRoom } from '@/helpers/strings';
import { customAlphabet } from 'nanoid';
import { useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

export default function RoomSwitch({ formData, setFormData }) {
  const { id: room } = useParams();
  const { t } = useTranslation();

  const togglePrivateRoomField = (event) => {
    let roomId;

    if (event.target.checked && isPublicRoom(room)) {
      roomId = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 5)();
      console.log('roomId', roomId);
    } else if (event.target.checked && !isPublicRoom(room)) {
      roomId = room;
    } else {
      roomId = 'PUBLIC';
    }

    setFormData({
      ...formData,
      room: roomId,
      gameMode: isPublicRoom(roomId) ? 'online' : formData.gameMode,
    });
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

  const isPrivate = !isPublicRoom(formData.room);
  return (
    <>
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
          checked={isPrivate}
          onChange={togglePrivateRoomField}
          slotProps={{ input: { 'aria-label': t('room') } }}
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
      {isPrivate && (
        <TextField
          fullWidth
          id="privateRoom"
          label="Private Room"
          defaultValue={formData.room?.toUpperCase()}
          margin="normal"
          onBlur={handleChange}
          onKeyDown={handleChange}
        />
      )}
    </>
  );
}
