import {
  Box, Button, Divider, FormControlLabel, Switch, Tab, Tabs, TextField,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuth from 'hooks/useAuth';
import customizeBoard from 'services/buildGame';
import useLocalStorage from 'hooks/useLocalStorage';
import TabPanel from 'components/TabPanel';
import { a11yProps, camelToPascal, pascalToCamel } from 'helpers/strings';
import ToastAlert from 'components/ToastAlert';
import { sendMessage } from 'services/firebase';
import CustomTileDialog from 'components/CustomTileDialog';
import importData from '../../helpers/json';
import SelectBoardSetting from './SelectBoardSetting';
import PrivateRoomToggle from './PrivateRoomToggle';
import './styles.css';

function hasSomethingPicked(object) {
  return Object.values(object).some((selection) => [1, 2, 3, 4].includes(selection));
}

function isAppending(option, variationOption) {
  return option > 0 && variationOption?.startsWith('append');
}

function getCustomTileCount(settings, customTiles, dataFolder) {
  const usedCustomTiles = [];
  const settingsDataFolder = {};
  // restrict our datafolder to just those the user selected.
  Object.entries(dataFolder).forEach(([key, value]) => {
    if (settings[key]) settingsDataFolder[key] = Object.keys(value).slice(1, settings[key] + 1);
  });

  // copy over any custom tiles that fall within our limited datafolder.
  Object.entries(settingsDataFolder).forEach(([settingGroup, intensityArray]) => {
    customTiles.forEach((entry) => {
      if (
        (pascalToCamel(entry.group) === settingGroup && intensityArray.includes(entry.intensity))
        || entry.group === 'Miscellaneous'
      ) {
        usedCustomTiles.push(entry);
      }
    });
  });

  // return the count of custom tiles that were actually used in the game board.
  return usedCustomTiles.length;
}

function getSettingsMessage(settings, customTiles, dataFolder) {
  let message = '### Game Settings\r\n';
  const { poppersVariation, alcoholVariation } = settings;
  Object.entries(dataFolder).map(([key, val]) => {
    if (settings[key] > 0) {
      const intensity = settings[key];
      message += `* ${val?.label}: ${Object.keys(val?.actions)?.[intensity]}`;
      if (key === 'poppers') {
        message += ` (${camelToPascal(poppersVariation)})`;
      }
      if (key === 'alcohol') {
        message += ` (${camelToPascal(alcoholVariation)})`;
      }
      message += '\r\n';
    }
    return undefined;
  });

  const customTileCount = getCustomTileCount(settings, customTiles, dataFolder);
  if (customTileCount) {
    message += `* Custom Tiles: ${customTileCount} \r\n`;
  }

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
  const customTiles = useLocalStorage('customTiles', [])[0];

  // set default settings for first time users. Local Storage will take over after this.
  const [settings, updateSettings] = useLocalStorage('gameSettings', {
    boardUpdated: false,
    playerDialog: true,
    othersDialog: false,
    sound: true,
    locale: 'en',
    gameMode: 'online',
  });
  const navigate = useNavigate();

  const [value, setValue] = useState(0);
  const [alert, setAlert] = useState(null);
  const [openCustomTile, setOpenCustomTile] = useState(false);

  // set the variations to standalone by default.
  // useEffect will override this if needed.
  // separate from updateSettings as we don't write to localStorage here.
  const [formData, setFormData] = useState({
    poppersVariation: 'standalone',
    alcoholVariation: 'standalone',
  });

  const dataFolder = importData(formData?.locale, formData?.gameMode);

  const handleTabChange = (_, newValue) => {
    setValue(newValue);
  };

  const boardUpdated = () => updateSettings({ ...settings, boardUpdated: true });

  // once our data from localstorage updates, push them to the formData.
  useEffect(() => setFormData({
    ...formData,
    ...settings,
    room,
  // eslint-disable-next-line
  }), [settings]);

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

    let updatedDataFolder = { ...dataFolder };
    let settingsBoardUpdated = formData.boardUpdated;
    let { gameMode } = formData;
    if ((!formData.room || formData.room === 'public') && formData.gameMode === 'local') {
      gameMode = 'online';
      // this is async, so we need the boardUpdated & updatedDataFolder as separate entities.
      updatedDataFolder = importData(formData.locale, gameMode);
      settingsBoardUpdated = true;
    }

    const newBoard = customizeBoard(gameOptions, updatedDataFolder, customTiles);
    // if our board updated, then push those changes out.
    if (settingsBoardUpdated) await updateBoard(newBoard);

    // if our board updated, or we changed rooms, send out that message.
    if (settingsBoardUpdated || room !== formData.room) {
      sendMessage({
        room: formData.room || 'public',
        user: updatedUser,
        text: getSettingsMessage(formData, customTiles, updatedDataFolder),
        type: 'settings',
        gameBoard: JSON.stringify(newBoard),
        settings: JSON.stringify(exportSettings(formData)),
      });
    }

    updateSettings({ ...formData, boardUpdated: false, gameMode });

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
      dataFolder={dataFolder}
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

      <div className="flex-buttons">
        <Button variant="outlined" type="button" onClick={() => setOpenCustomTile(true)}>
          Custom Tiles
        </Button>
        <Button variant="contained" type="submit">
          {submitText}
        </Button>
      </div>
      <CustomTileDialog
        open={openCustomTile}
        setOpen={setOpenCustomTile}
        boardUpdated={boardUpdated}
        dataFolder={dataFolder}
      />
      <ToastAlert open={!!alert} setOpen={setAlert}>
        {alert}
      </ToastAlert>
    </Box>
  );
}
