import useAuth from '../../hooks/useAuth';
import { Box, Button, TextField } from '@mui/material';
import { customizeBoard, dataFolder } from '../../services/buildGame';
import { useNavigate } from 'react-router-dom';
import SelectBoardSetting from './SelectBoardSetting';
import useLocalStorage from '../../hooks/useLocalStorage';
import PrivateRoomToggle from './PrivateRoomToggle';

export default function GameSettings({ submitText, closeDialog }) {
    const { login, user, updateUser } = useAuth();
    const updateBoard = useLocalStorage('customBoard')[1];
    const [settings, updateSettings] = useLocalStorage('gameSettings');
    const navigate = useNavigate();

    async function handleSubmit(event) {
        event.preventDefault();
        const privateRoom = event.target.privateRoom?.value;
        const showPrivate = event.target.showPrivate?.checked;
        const privatePath = privateRoom ? `/rooms/${privateRoom}` : null;

        const {displayName, ...gameOptions} = settings;

        if (!hasSomethingPicked(gameOptions)) {
            return alert('you need to pick at lease something');
        }

        const { poppers, alcohol, ...actionItems } = { ...gameOptions };

        if ((isAppending(poppers, gameOptions.poppersVariation) || isAppending(alcohol, gameOptions.alcoholVariation))
            && !hasSomethingPicked(actionItems)) {
            return alert('If you are going to append, you need an action.');
        }

        if (displayName !== undefined && displayName.length > 0) {
            user ? await updateUser(displayName) : await login(displayName);
        }

        updateSettings(settings);
        updateBoard(customizeBoard(gameOptions));

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
            sx={{ minWidth: '300px' }}
        >

            <TextField
                fullWidth
                id="displayName"
                label="Display Name"
                defaultValue={user?.displayName}
                required
                autoFocus
                onBlur={event => updateSettings({ ...settings, displayName: event.target.value })}
                margin='normal'
            />

            <PrivateRoomToggle />

            {settingSelectLists}

            <br />
            <Button fullWidth variant="contained" type="submit">
                {submitText}
            </Button>
        </Box>
    )
}

function hasSomethingPicked(object) {
    return Object.values(object).some(selection => [1, 2, 3, 4].includes(selection));
}

function isAppending(option, variationOption) {
    return option > 0 && variationOption?.startsWith('append');
}