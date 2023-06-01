import { Stack, Switch, TextField, Typography } from "@mui/material"
import { customAlphabet } from "nanoid";
import { useState } from "react";

export default function PrivateRoomToggle()
{
    const urlElements = window.location.pathname.split('/');
    const roomId = urlElements.pop() || urlElements.pop(); // in the event we have a trailing / or not.

    const [showPrivate, setPrivateToggle] = useState(!!roomId);

    function togglePrivateRoomField(event) {
        setPrivateToggle(event.target.checked);
    }

    return (
        <>
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography>Public Room</Typography>
                <Switch
                    id="showPrivate"
                    defaultChecked={!!roomId}
                    onChange={togglePrivateRoomField}
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
        </>
    );
}