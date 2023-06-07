import {
  Box, Stack, Switch, TextField, Typography,
} from '@mui/material';
import { customAlphabet } from 'nanoid';
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
    const toggleVal = event.target.checked;
    let roomId = formData?.room;

    // toggleVal === true, we want a private room, so get the one in the URL or generate one.
    // toggleVal === false, we want the public room.
    roomId = toggleVal
      ? room || customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 5)()
      : null;

    setFormData({ ...formData, room: roomId });
  };

  return (
    <Box sx={{ margin: '0 0.5rem 0.5rem' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
        <Typography>Public Room</Typography>
        <Switch
          id="showPrivate"
          checked={!!formData.room}
          onChange={togglePrivateRoomField}
          inputProps={{ 'aria-label': 'Room Type' }}
        />
        <Typography>Private Room</Typography>
      </Stack>

      {!!formData.room && (
        <TextField
          fullWidth
          id="privateRoom"
          label="Private Room"
          defaultValue={formData.room}
          margin="normal"
          onBlur={(event) => handleChange(event)}
          onKeyDown={(event) => handleKeyDown(event)}
        />
      )}
    </Box>
  );
}
