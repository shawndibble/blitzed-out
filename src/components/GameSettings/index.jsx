import {
  Box, Button, Tab, Tabs, TextField,
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
import {
  handleUser, handleBoardUpdate, validateFormData, getSettingsMessage,
  exportSettings, getRoomSettingsMessage, exportRoomSettings,
} from './submitForm';
import './styles.css';
import AppSettings from './AppSettings';
import RoomSettings from './RoomSettings';
import BoardSettings from './BoardSettings';

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
    background: 'color',
    finishRange: [30, 70],
  });
  const navigate = useNavigate();

  const [value, setValue] = useState(0);
  const [alert, setAlert] = useState(null);
  const [actionsList, setActionsList] = useState({});
  const [openCustomTile, setOpenCustomTile] = useState(false);

  // set the variations to standalone by default.
  // useEffect will override this if needed.
  // separate from updateSettings as we don't write to localStorage here.
  const [formData, setFormData] = useState({
    poppersVariation: 'standalone',
    alcoholVariation: 'standalone',
  });

  useEffect(() => {
    setActionsList(importActions(i18n.resolvedLanguage, formData?.gameMode));
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
      actionsList,
      updateBoard,
      customTiles,
      updateSettings,
    });

    const roomChanged = room !== formData.room;

    // if our board updated, or we changed rooms, send out game settings message.
    if (settingsBoardUpdated || roomChanged) {
      sendMessage({
        room: formData.room || 'public',
        user: updatedUser,
        text: getSettingsMessage(formData, customTiles, actionsList),
        type: 'settings',
        gameBoard: JSON.stringify(newBoard),
        settings: JSON.stringify(exportSettings(formData)),
      });
    }

    // send out room specific settings if we are in a private room.
    if (room !== 'public') {
      sendMessage({
        room,
        user: updatedUser,
        text: getRoomSettingsMessage(formData),
        type: 'room',
        settings: JSON.stringify(exportRoomSettings(formData)),
      });
    }

    if (roomChanged) {
      const privatePath = formData.room ? `/rooms/${formData.room}` : '/';
      navigate(privatePath);
    }

    if (typeof closeDialog === 'function') closeDialog();

    return null;
  }

  const onEnterKey = (event) => {
    if (event.key === 'Enter') {
      setFormData({ ...formData, displayName: event.target.value });
      handleSubmit(event);
    }
  };

  if (!formData.locale) return null;

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
          <Tab label={t('room')} {...a11yProps(1)} />
          <Tab label={t('application')} {...a11yProps(2)} />
        </Tabs>
      </Box>

      <TabPanel value={value} index={0} style={{ p: 0 }}>
        <BoardSettings formData={formData} setFormData={setFormData} actionsList={actionsList} />
      </TabPanel>

      <TabPanel value={value} index={1} style={{ p: 0, pt: 1 }}>
        <RoomSettings formData={formData} setFormData={setFormData} />
      </TabPanel>

      <TabPanel value={value} index={2} style={{ p: 0, pt: 1 }}>
        <AppSettings
          settings={formData}
          formData={formData}
          setFormData={setFormData}
          boardUpdated={boardUpdated}
        />
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
        actionsList={actionsList}
      />
      <ToastAlert open={!!alert} setOpen={setAlert} close={() => setAlert(null)}>
        {alert}
      </ToastAlert>
    </Box>
  );
}
