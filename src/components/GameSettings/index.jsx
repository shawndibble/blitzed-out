import {
  Box, Button, Divider, FormControlLabel, Switch, Tab, Tabs, TextField,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { customizeBoard, dataFolder } from '../../services/buildGame';
import SelectBoardSetting from './SelectBoardSetting';
import useLocalStorage from '../../hooks/useLocalStorage';
import PrivateRoomToggle from './PrivateRoomToggle';
import './styles.css';
import TabPanel from '../TabPanel';
import { a11yProps, camelToPascal } from '../../helpers/strings';
import ToastAlert from '../ToastAlert';
import { sendMessage } from '../../services/firebase';

function hasSomethingPicked(object) {
  return Object.values(object).some((selection) => [1, 2, 3, 4].includes(selection));
}

function isAppending(option, variationOption) {
  return option > 0 && variationOption?.startsWith('append');
}

function getSettingsMessage(settings) {
  let message = '### Game Settings\r\n';
  const { poppersVariation, alcoholVariation } = settings;
  Object.keys(dataFolder).map((val) => {
    if (settings[val] > 0) {
      const intensity = settings[val];
      message += `* ${camelToPascal(val)}: ${Object.keys(dataFolder[val])?.[intensity]}`;
      if (val === 'poppers') {
        message += ` (${camelToPascal(poppersVariation)})`;
      }
      if (val === 'alcohol') {
        message += ` (${camelToPascal(alcoholVariation)})`;
      }
      message += '\r\n';
    }
    return undefined;
  });
  return message;
}

function exportSettings(formData) {
  const newSettings = {};
  Object.entries(formData).forEach(([settingKey, settingValue]) => {
    const personalSettings = ['boardUpdated', 'playerDialog', 'sound', 'displayName', 'othersDialog', 'room'];
    if (!personalSettings.includes(settingKey)) newSettings[settingKey] = settingValue;
  });
  return newSettings;
}

export default function GameSettings({ submitText, closeDialog }) {
  const { login, user, updateUser } = useAuth();
  const { id: room } = useParams();
  const updateBoard = useLocalStorage('customBoard')[1];

  // set default settings for first time users. Local Storage will take over after this.
  const [settings, updateSettings] = useLocalStorage('gameSettings', {
    boardUpdated: false,
    playerDialog: true,
    othersDialog: false,
    sound: true,
  });
  const navigate = useNavigate();

  const [value, setValue] = useState(0);
  const [alert, setAlert] = useState(null);

  // set the variations to standalone by default.
  // useEffect will override this if needed.
  const [formData, setFormData] = useState({
    poppersVariation: 'standalone',
    alcoholVariation: 'standalone',
  });

  const handleTabChange = (_, newValue) => {
    setValue(newValue);
  };

  // once our data from localstorage updates, push them to the formData.
  useEffect(() => setFormData({
    ...formData,
    ...settings,
    room,
  // eslint-disable-next-line
  }), [settings]);

  console.log('setting', settings);

  async function handleSubmit(event) {
    event.preventDefault();

    const { displayName, ...gameOptions } = formData;

    if (!hasSomethingPicked(gameOptions)) {
      return setAlert('you need to pick at lease something');
    }

    const { poppers, alcohol, ...actionItems } = { ...gameOptions };

    if (
      (
        isAppending(poppers, gameOptions.poppersVariation)
        || isAppending(alcohol, gameOptions.alcoholVariation)
      )
      && !hasSomethingPicked(actionItems)) {
      return setAlert('If you are going to append, you need an action.');
    }

    let updatedUser;
    if (displayName !== undefined && displayName.length > 0) {
      updatedUser = user ? await updateUser(displayName) : await login(displayName);
    }

    const newBoard = customizeBoard(gameOptions);
    // if our board updated, then push those changes out.
    if (formData.boardUpdated) await updateBoard(newBoard);

    // if our board updated or we changed rooms, send out that message.
    if (formData.boardUpdated || room !== formData.room) {
      sendMessage({
        room: formData.room || 'public',
        user: updatedUser,
        text: getSettingsMessage(formData),
        type: 'settings',
        gameBoard: JSON.stringify(newBoard),
        settings: JSON.stringify(exportSettings(formData)),
      });
    }

    updateSettings({ ...formData, boardUpdated: false });

    const privatePath = formData.room ? `/rooms/${formData.room}` : '/';
    navigate(privatePath);

    if (typeof closeDialog === 'function') closeDialog();

    return null;
  }

  const onEnterKey = (event) => {
    if (event.key === 'Enter') {
      setFormData({ ...formData, displayName: event.target.value });
      handleSubmit(event);
    }
  };

  const settingSelectLists = Object.keys(dataFolder).map((option) => (
    <SelectBoardSetting
      key={option}
      option={option}
      settings={formData}
      setSettings={setFormData}
    />
  ));

  return (
    <Box
      component="form"
      method="post"
      // eslint-disable-next-line react/jsx-no-bind
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
        onBlur={(event) => setFormData({ ...formData, displayName: event.target.value })}
        onKeyDown={(event) => onEnterKey(event)}
        margin="normal"
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleTabChange} aria-label="Game Settings" centered>
          <Tab label="Gameboard" {...a11yProps(0)} />
          <Tab label="Application" {...a11yProps(1)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0} style={{ p: 0 }}>
        {settingSelectLists}
      </TabPanel>
      <TabPanel value={value} index={1} style={{ p: 0, pt: 1 }}>
        <PrivateRoomToggle formData={formData} setFormData={setFormData} />
        <Divider />
        <FormControlLabel
          control={(
            <Switch
              checked={formData.playerDialog}
              onChange={(event) => setFormData({
                ...formData, playerDialog: event.target.checked,
              })}
            />
          )}
          label="Show my roll dialog"
          labelPlacement="start"
          className="settings-switch"
        />
        <Divider />
        <FormControlLabel
          control={(
            <Switch
              checked={formData.othersDialog}
              onChange={(event) => setFormData({
                ...formData, othersDialog: event.target.checked,
              })}
            />
          )}
          label="Show other's roll dialog"
          labelPlacement="start"
          className="settings-switch"
        />
        <Divider />
        <FormControlLabel
          control={(
            <Switch
              checked={formData.sound}
              onChange={(event) => setFormData({ ...formData, sound: event.target.checked })}
            />
          )}
          label="Play sound on roll"
          labelPlacement="start"
          className="settings-switch"
        />
        <Divider />
      </TabPanel>

      <br />
      <Button fullWidth variant="contained" type="submit">
        {submitText}
      </Button>
      <ToastAlert open={!!alert} setOpen={setAlert}>
        {alert}
      </ToastAlert>
    </Box>
  );
}
