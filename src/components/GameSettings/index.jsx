import { useAuth } from '../../hooks/useAuth';
import './styles.css';
import { Box, Button, Stack, Switch, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { customAlphabet } from 'nanoid';
import { createRoom } from '../../services/firebase';

export default function GameSettings({ submitText }) {
    const { login, user } = useAuth();
    console.log(user.displayName);

    const nanoidAlphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZ';

    const urlElements = window.location.pathname.split('/');
    const roomId = urlElements.pop() || urlElements.pop(); // in the event we have a trailing / or not.

    const [showPrivate, setPrivate] = useState(!!roomId);

    function togglePrivateRoomField(event) {
        setPrivate(event.target.checked);
    }

    async function handleSubmit(event) {
        event.preventDefault();
        const displayName = event.target.displayName.value;
        const privateRoom = event.target.privateRoom?.value;
        const privatePath = privateRoom ? `/rooms/${privateRoom}` : null;

        if (displayName !== undefined && displayName.length > 0) {
            if (showPrivate) await createRoom(privateRoom);
            await login(displayName);
            document.location = showPrivate ? privatePath : '/';
        }
    }

    return (
        <>
            <Box
                component="form"
                method="post"
                onSubmit={handleSubmit}
            >
                <TextField id="displayName" label="Display Name" defaultValue={user.displayName} required autoFocus margin='normal' />

                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography>Public Room</Typography>
                    <Switch defaultChecked={!!roomId} onChange={togglePrivateRoomField} inputProps={{ 'aria-label': 'Room Type' }} />
                    <Typography>Private Room</Typography>
                </Stack>

                {showPrivate && (
                    <TextField id="privateRoom" label="Private Room" defaultValue={roomId || customAlphabet(nanoidAlphabet, 5)()} margin="dense" />
                )}

                <br /> <br />
                <Button variant="contained" type="submit">
                    {submitText}
                </Button>
            </Box>
        </>
    )
}