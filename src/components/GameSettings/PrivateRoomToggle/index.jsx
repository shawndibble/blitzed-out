import {
  Box, Stack, Switch, TextField, Typography,
} from '@mui/material';
import { customAlphabet } from 'nanoid';
import { useState } from 'react';

export default function PrivateRoomToggle() {
  const urlElements = window.location.pathname.split('/');
  // in the event we have a trailing / or not.
  const roomId = urlElements.pop() || urlElements.pop();

  const [showPrivate, setPrivateToggle] = useState(!!roomId);

  const togglePrivateRoomField = (event) => setPrivateToggle(event?.target.checked);

  return (
    <Box sx={{ margin: '0 0.5rem 0.5rem' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
        <Typography>Public Room</Typography>
        <Switch
          id="showPrivate"
          defaultChecked={!!roomId}
          onChange={(event) => togglePrivateRoomField(event)}
          inputProps={{ 'aria-label': 'Room Type' }}
        />
        <Typography>Private Room</Typography>
      </Stack>

      {showPrivate && (
        <TextField
          fullWidth
          id="privateRoom"
          label="Private Room"
          defaultValue={roomId || customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 5)()}
          margin="normal"
        />
      )}
    </Box>
  );
}
