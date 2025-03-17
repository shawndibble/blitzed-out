import { Help } from '@mui/icons-material';
import { Stack, Switch, TextField, Tooltip, Typography } from '@mui/material';
import { isPublicRoom } from '@/helpers/strings';
import { customAlphabet } from 'nanoid';
import { useCallback, ChangeEvent, KeyboardEvent, FocusEvent } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Settings, GameMode } from '@/types/Settings';

interface Params {
  id: string;
}

interface RoomSwitchProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
}

export default function RoomSwitch({ formData, setFormData }: RoomSwitchProps): JSX.Element {
  const { id: room } = useParams<Params>();
  const { t } = useTranslation();

  const togglePrivateRoomField = (event: ChangeEvent<HTMLInputElement>) => {
    let roomId: string;

    if (event.target.checked && isPublicRoom(room)) {
      roomId = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 5)();
    } else if (event.target.checked && !isPublicRoom(room)) {
      roomId = room;
    } else {
      roomId = 'PUBLIC';
    }

    setFormData({
      ...formData,
      room: roomId,
      gameMode: isPublicRoom(roomId) ? 'online' as GameMode : formData.gameMode,
    });
  };

  const handleChange = useCallback(
    (event: FocusEvent<HTMLInputElement> | KeyboardEvent<HTMLInputElement>) => {
      setFormData({
        ...formData,
        room: event.currentTarget.value,
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
