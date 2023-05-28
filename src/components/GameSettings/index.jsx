import useAuth from '../../hooks/useAuth';
import './styles.css';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, Switch, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { customAlphabet } from 'nanoid';
import { createRoom } from '../../services/firebase';
import { dataFolder } from '../../hooks/useCustomize';
import { useNavigate } from 'react-router-dom';

export default function GameSettings({ submitText, closeDialog }) {
    const { login, user } = useAuth();
    const navigate = useNavigate();

    const nanoidAlphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZ';

    const urlElements = window.location.pathname.split('/');
    const roomId = urlElements.pop() || urlElements.pop(); // in the event we have a trailing / or not.

    const [showPrivate, setPrivateToggle] = useState(!!roomId);
    const [kinks, setKinks] = useState({
        'alcohol': 0,
        'throatTraining': 0,
        'ballBusting': 0,
        'buttPlay': 0,
        'titTorture': 0,
    })

    function togglePrivateRoomField(event) {
        setPrivateToggle(event.target.checked);
    }

    async function handleSubmit(event) {
        event.preventDefault();
        const displayName = event.target.displayName?.value;
        const privateRoom = event.target.privateRoom?.value;
        const privatePath = privateRoom ? `/rooms/${privateRoom}` : null;

        if (displayName !== undefined && displayName.length > 0) {
            await login(displayName);
        }

        if (showPrivate) await createRoom(privateRoom);
        navigate(showPrivate ? privatePath : '/');
        if (typeof closeDialog === 'function') closeDialog();
    }

    function getOptions(category) {
        const options = dataFolder();
        let optionArray = [<MenuItem value={0} key={`${category}-0`}><em>None</em></MenuItem>];
        Object.keys(options[category]).forEach((option, index) => {
            let value = index + 1;
            optionArray.push(<MenuItem value={value} key={`${category}-${value}`}>{option}</MenuItem>);
        });
        return optionArray;
    }

    function handleChange(event, kink) {
        let data = kinks;
        data[kink] = event.target.value;
        setKinks({...data });
    }

    const selectKinks = () => {
        const options = dataFolder();
        return Object.keys(options).map(option => {
            const labelId = option + 'label'; 
            const word = option.replace(/([A-Z])/g, ' $1').trim();
            const label = word.charAt(0).toUpperCase() + word.slice(1)
            return (
                <div key={option}>
                    <FormControl fullWidth margin="normal">
                        <InputLabel id={labelId}>{label}</InputLabel>
                        <Select
                            labelId={labelId}
                            id={option}
                            label={label}
                            value={kinks[option]}
                            onChange={(event) => handleChange(event, option)}
                        >
                            {getOptions(option)}
                        </Select>
                    </FormControl>
                </div>
            )
        });
    }


    return (
        <Box
            component="form"
            method="post"
            onSubmit={handleSubmit}
        >
            {!user && (<TextField
                fullWidth
                id="displayName"
                label="Display Name"
                defaultValue={user?.displayName}
                required
                autoFocus
                margin='normal'
            />)}

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

            {selectKinks()}

            <br />
            <Button fullWidth variant="contained" type="submit">
                {submitText}
            </Button>
        </Box>
    )
}