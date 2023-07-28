import {
  Box, Button, Divider, FormControlLabel, Switch, Tab, Tabs, TextField,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import TabPanel from 'components/TabPanel';
import ToastAlert from 'components/ToastAlert';
import CustomTileDialog from 'components/CustomTileDialog';
import { a11yProps } from 'helpers/strings';
import useAuth from 'hooks/useAuth';
import useLocalStorage from 'hooks/useLocalStorage';
import { importActions } from 'services/importLocales';
import { sendMessage } from 'services/firebase';
import SelectBoardSetting from './SelectBoardSetting';
import PrivateRoomToggle from './PrivateRoomToggle';
import {
  handleUser, handleBoardUpdate, validateFormData, getSettingsMessage, exportSettings,
} from './submitForm';
import './styles.css';
import LanguageSelect from './LanguageSelect';

export default function GameSettings({ submitText, closeDialog }) {
  const { login, user, updateUser } = useAuth();
  const { id: room } = useParams();
  const { t, i18n } = useTranslation();
  const updateBoard = useLocalStorage('customBoard')[1];
  const customTiles = useLocalStorage('customTiles', [])[0];

  // set default settings for first time users. Local Storage will take over after this.
  const [settings, updateSettings] = useLocalStorage('gameSettings', {
    boardUpdated: false,
    playerDialog: true,
    othersDialog: false,
    mySound: true,
    chatSound: true,
    locale: 'en',
    gameMode: 'online',
  });
  const navigate = useNavigate();

  const [value, setValue] = useState(0);
  const [alert, setAlert] = useState(null);
  const [dataFolder, setDataFolder] = useState({});
  const [openCustomTile, setOpenCustomTile] = useState(false);

  // set the variations to standalone by default.
  // useEffect will override this if needed.
  // separate from updateSettings as we don't write to localStorage here.
  const [formData, setFormData] = useState({
    poppersVariation: 'standalone',
    alcoholVariation: 'standalone',
  });

  useEffect(() => {
    setDataFolder(importActions(i18n.resolvedLanguage, formData?.gameMode));
  }, [i18n.resolvedLanguage, formData?.gameMode]);

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

    const validationMessage = validateFormData(gameOptions);
    if (validationMessage) return setAlert(t(validationMessage));

    const updatedUser = await handleUser(user, displayName, updateUser, login);

    const { settingsBoardUpdated, newBoard } = await handleBoardUpdate({
      formData,
      dataFolder,
      updateBoard,
      customTiles,
      updateSettings,
    });

    // if our board updated, or we changed rooms, send out that message.
    if (settingsBoardUpdated || room !== formData.room) {
      sendMessage({
        room: formData.room || 'public',
        user: updatedUser,
        text: getSettingsMessage(formData, customTiles, dataFolder),
        type: 'settings',
        gameBoard: JSON.stringify(newBoard),
        settings: JSON.stringify(exportSettings(formData)),
      });
    }

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
        label={t('displayName')}
        defaultValue={user?.displayName}
        required
        autoFocus
        onBlur={(event) => setFormData({ ...formData, displayName: event.target.value })}
        onKeyDown={(event) => onEnterKey(event)}
        margin="normal"
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleTabChange} aria-label="Game Settings" centered>
          <Tab label={t('gameboard')} {...a11yProps(0)} />
          <Tab label={t('application')} {...a11yProps(1)} />
        </Tabs>
      </Box>

      <TabPanel value={value} index={0} style={{ p: 0 }}>
        {settingSelectLists}
      </TabPanel>

      <TabPanel value={value} index={1} style={{ p: 0, pt: 1 }}>
        <LanguageSelect boardUpdated={boardUpdated} />
        <Divider />
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
          label={t('myRollDialog')}
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
          label={t('othersRollDialog')}
          labelPlacement="start"
          className="settings-switch"
        />
        <Divider />
        <FormControlLabel
          control={(
            <Switch
              checked={formData.mySound}
              onChange={(event) => setFormData({ ...formData, mySound: event.target.checked })}
            />
          )}
          label={t('mySound')}
          labelPlacement="start"
          className="settings-switch"
        />
        <Divider />
        <FormControlLabel
          control={(
            <Switch
              checked={formData.otherSound}
              onChange={(event) => setFormData({ ...formData, otherSound: event.target.checked })}
            />
          )}
          label={t('otherSound')}
          labelPlacement="start"
          className="settings-switch"
        />
        <Divider />
        <FormControlLabel
          control={(
            <Switch
              checked={formData.chatSound}
              onChange={(event) => setFormData({ ...formData, chatSound: event.target.checked })}
            />
          )}
          label={t('chatSound')}
          labelPlacement="start"
          className="settings-switch"
        />
        <Divider />
      </TabPanel>

      <div className="flex-buttons">
        <Button variant="outlined" type="button" onClick={() => setOpenCustomTile(true)}>
          <Trans i18nKey="customTiles">
            Custom Tiles
          </Trans>
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
      <ToastAlert open={!!alert} setOpen={setAlert} close={() => setAlert(null)}>
        {alert}
      </ToastAlert>
    </Box>
  );
}
