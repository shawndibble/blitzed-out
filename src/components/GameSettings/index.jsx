import useAuth from '../../hooks/useAuth';
import { Box, Button, Divider, FormControlLabel, Switch, Tab, Tabs, TextField} from '@mui/material';
import { customizeBoard, dataFolder } from '../../services/buildGame';
import { useNavigate } from 'react-router-dom';
import SelectBoardSetting from './SelectBoardSetting';
import useLocalStorage from '../../hooks/useLocalStorage';
import PrivateRoomToggle from './PrivateRoomToggle';
import { useState } from 'react';
import './styles.css';

export default function GameSettings({ submitText, closeDialog }) {
    const { login, user, updateUser } = useAuth();
    const updateBoard = useLocalStorage('customBoard')[1];
    const [settings, updateSettings] = useLocalStorage('gameSettings', { playerDialog: true, sound: true });
    const navigate = useNavigate();

    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
      setValue(newValue);
    };

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
            className="settings-box"
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

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="Game Settings" centered>
                    <Tab label="Gameboard" {...a11yProps(0)} />
                    <Tab label="Application" {...a11yProps(1)} />
                </Tabs>
            </Box>
            <TabPanel value={value} index={0}>
                {settingSelectLists}
            </TabPanel>
            <TabPanel value={value} index={1}>
                <div>
                    <PrivateRoomToggle />
                    <Divider />
                    <FormControlLabel
                        control={<Switch
                            checked={settings.playerDialog}
                            onChange={event => updateSettings({ ...settings, playerDialog: event.target.checked})}
                        />}
                        label="Show my roll dialog"
                        labelPlacement="start"
                        className="settings-switch"
                    />
                    <Divider />
                    <FormControlLabel
                        control={<Switch
                            checked={settings.othersDialog}
                            onChange={event => updateSettings({ ...settings, othersDialog: event.target.checked})}
                        />}
                        label="Show other's roll dialog"
                        labelPlacement="start"
                        className="settings-switch"
                    />
                    <Divider />
                    <FormControlLabel
                        control={<Switch
                            checked={settings.sound}
                            onChange={event => updateSettings({ ...settings, sound: event.target.checked})}
                        />}
                        label="Play sound on roll"
                        labelPlacement="start"
                        className="settings-switch"
                    />
                    <Divider />
                </div>
            </TabPanel>

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

function TabPanel(props) {
    const { children, value, index, ...other } = props;
  
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ pt: 2 }}>
            {children}
          </Box>
        )}
      </div>
    );
  }
  
  function a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }