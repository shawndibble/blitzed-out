import { Box, Button, Tab, Tabs, TextField, Typography } from '@mui/material';
import TabPanel from 'components/TabPanel';
import ToastAlert from 'components/ToastAlert';
import latestMessageByType from 'helpers/messages';
import { a11yProps } from 'helpers/strings';
import useAuth from 'context/hooks/useAuth';
import useGameBoard from 'hooks/useGameBoard';
import useLocalStorage from 'hooks/useLocalStorage';
import useMessages from 'context/hooks/useMessages';
import { useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import sendGameSettingsMessage from 'services/gameSettingsMessage';
import { importActions } from 'services/importLocales';
import CustomTileDialog from 'views/CustomTileDialog';
import AppSettings from './AppSettings';
import BoardSettings from './BoardSettings';
import RoomSettings from './RoomSettings';
import './styles.css';
import { handleUser, sendRoomSettingsMessage } from './submitForm';
import validateFormData from './validateForm';
import { getActiveTiles } from 'stores/customTiles';
import { useLiveQuery } from 'dexie-react-hooks';
import { getActiveBoard, upsertBoard } from 'stores/gameBoard';

export default function GameSettings({ closeDialog }) {
  const { user, updateUser } = useAuth();
  const { id: room } = useParams();
  const { t, i18n } = useTranslation();
  const customTiles = useLiveQuery(() => getActiveTiles());
  const updateGameBoardTiles = useGameBoard();

  // set default settings for first time users. Local Storage will take over after this.
  const [settings, updateSettings] = useLocalStorage('gameSettings');
  const gameBoard = useLiveQuery(getActiveBoard);
  const navigate = useNavigate();

  const [value, setValue] = useState(0);
  const [alert, setAlert] = useState(null);
  const [actionsList, setActionsList] = useState({});
  const [openCustomTile, setOpenCustomTile] = useState(false);

  // set the variations to standalone by default.
  // useEffect will override this if needed.
  // separate from updateSettings as we don't write to localStorage here.
  const [formData, setFormData] = useState({});

  const { messages } = useMessages();

  // Update our actions list when the language changes.
  useEffect(() => {
    setActionsList(importActions(i18n.resolvedLanguage, formData?.gameMode));
  }, [i18n.resolvedLanguage, formData?.gameMode]);

  const handleTabChange = useCallback((_, newValue) => {
    setValue(newValue);
  }, []);

  const boardUpdated = () => updateSettings({ ...settings, boardUpdated: true });

  // once our data from localstorage updates, push them to the formData.
  useEffect(() => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      ...settings,
      room,
    }));
  }, []);

  // Import our private room settings into the form data.
  useEffect(() => {
    if (room.toUpperCase() === 'PUBLIC') return;

    const message = latestMessageByType(messages, 'room');

    if (message?.settings) {
      setFormData((previousFormData) => ({
        ...previousFormData,
        ...JSON.parse(message.settings),
      }));
    }
  }, [messages]);

  async function handleSubmit(event) {
    event.preventDefault();
    const { displayName, ...gameOptions } = formData;

    const validationMessage = validateFormData(gameOptions, actionsList);
    if (validationMessage) return setAlert(t(validationMessage));

    const updatedUser = await handleUser(user, displayName, updateUser);

    if (!formData.roomBackgroundURL || !formData.roomBackgroundURL.match(/^https?:\/\/.+\/.+$/)) {
      formData.roomBackground = 'app';
    }

    const { settingsBoardUpdated, gameMode, newBoard } = await updateGameBoardTiles(formData);

    const roomChanged = room.toUpperCase() !== formData.room.toUpperCase();
    const isPrivateRoom = formData.room && formData?.room.toUpperCase() !== 'PUBLIC';
    const privateBoardSizeChanged =
      isPrivateRoom && formData.roomTileCount !== settings.roomTileCount;

    // send out room specific settings if we are in a private room.
    if (isPrivateRoom && (formData.roomUpdated || !messages.find((m) => m.type === 'room'))) {
      await sendRoomSettingsMessage(formData, updatedUser);
    }

    if (gameBoard?.tiles !== newBoard) {
      await upsertBoard({
        title: t('settingsGenerated'),
        tiles: newBoard,
        isActive: 1,
        gameMode,
      });
    }

    // if our board updated, or we changed rooms, send out game settings message.
    if (settingsBoardUpdated || roomChanged || privateBoardSizeChanged) {
      await sendGameSettingsMessage({
        formData,
        user: updatedUser,
        customTiles,
        actionsList,
        title: 'Settings Generated Board',
        tiles: newBoard,
      });
    }

    updateSettings({
      ...formData,
      boardUpdated: false,
      roomUpdated: false,
      gameMode,
    });

    if (roomChanged) {
      const privatePath = `/${formData?.room || 'public'}`;
      navigate(privatePath);
    }

    if (typeof closeDialog === 'function') closeDialog();

    return null;
  }

  const handleBlur = useCallback(
    (event) => {
      setFormData((prevFormData) => ({
        ...prevFormData,
        displayName: event.target.value,
      }));
    },
    [formData]
  );

  const onEnterKey = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        setFormData((prevFormData) => ({
          ...prevFormData,
          displayName: event.target.value,
        }));
        handleSubmit(event);
      }
    },
    [formData, handleSubmit]
  );

  if (!formData.room) {
    return (
      <Box>
        <Typography variant="h2">
          <Trans i18nKey="Loading" />
          ...
        </Typography>
        <Typography variant="body1">
          <Trans i18nKey="clearStorage" />
        </Typography>
      </Box>
    );
  }

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
        defaultValue={user?.displayName || formData.displayName || ''}
        required
        autoFocus
        onBlur={handleBlur}
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
        <AppSettings formData={formData} setFormData={setFormData} boardUpdated={boardUpdated} />
      </TabPanel>

      <div className="flex-buttons">
        <Button variant="outlined" type="button" onClick={() => setOpenCustomTile(true)}>
          <Trans i18nKey="customTiles">Custom Tiles</Trans>
        </Button>
        <Button variant="contained" type="submit">
          <Trans i18nKey="update" />
        </Button>
      </div>
      {!!openCustomTile && (
        <CustomTileDialog
          open={openCustomTile}
          setOpen={setOpenCustomTile}
          boardUpdated={boardUpdated}
          actionsList={actionsList}
        />
      )}
      <ToastAlert open={!!alert} setOpen={setAlert} close={() => setAlert(null)}>
        {alert}
      </ToastAlert>
    </Box>
  );
}
