import useAuth from '../../hooks/useAuth';
import { Box, Button, Stack, Switch, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { customAlphabet } from 'nanoid';
import { createRoom } from '../../services/firebase';
import { customizeBoard, dataFolder } from '../../hooks/useCustomize';
import { useNavigate } from 'react-router-dom';
import SelectBoardSetting from '../SelectBoardSetting';
import useLocalStorage from '../../hooks/useLocalStorage';

export default function GameSettings({ submitText, closeDialog }) {
    const { login, user, updateUser } = useAuth();
    const updateBoard = useLocalStorage('gameStorage', 'customBoard')[1];
    const [settings, updateSettings ] = useLocalStorage('settingsStorage', 'gameSettings');
    const navigate = useNavigate();

    const nanoidAlphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZ';

    const urlElements = window.location.pathname.split('/');
    const roomId = urlElements.pop() || urlElements.pop(); // in the event we have a trailing / or not.

    const [showPrivate, setPrivateToggle] = useState(!!roomId);

    function togglePrivateRoomField(event) {
        setPrivateToggle(event.target.checked);
    }

    async function handleSubmit(event) {
        event.preventDefault();
        const displayName = event.target.displayName?.value;
        const privateRoom = event.target.privateRoom?.value;
        const privatePath = privateRoom ? `/rooms/${privateRoom}` : null;

        if (displayName !== undefined && displayName.length > 0) {
            user ? await updateUser(displayName) : await login(displayName);
        }
        
        updateSettings(settings);
        updateBoard(customizeBoard(settings));

        if (showPrivate) await createRoom(privateRoom);
        navigate(showPrivate ? privatePath : '/');

        if (typeof closeDialog === 'function') closeDialog();
    }

    const settingSelectLists = Object.keys(dataFolder).map(option => (
        <SelectBoardSetting key={option} option={option} settings={settings} setSettings={updateSettings} />
    ));

    return (
        <Box
            component="form"
            method="post"
            onSubmit={handleSubmit}
        >
            <TextField
                fullWidth
                id="displayName"
                label="Display Name"
                defaultValue={user?.displayName}
                required
                autoFocus
                margin='normal'
            />

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography>Public Room</Typography>
                <Switch defaultChecked={!!roomId} onChange={togglePrivateRoomField} inputProps={{ 'aria-label': 'Room Type' }} />
                <Typography>Private Room</Typography>
            </Stack>

            {showPrivate && (
                <TextField
                    fullWidth
                    id="privateRoom"
                    label="Private Room"
                    defaultValue={roomId || customAlphabet(nanoidAlphabet, 5)()}
                    margin="normal"
                />
            )}

            {settingSelectLists}

            <br />
            <Button fullWidth variant="contained" type="submit">
                {submitText}
            </Button>
        </Box>
    )
}