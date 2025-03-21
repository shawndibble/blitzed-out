import { Box, Button, Tab, Tabs, TextField, Typography } from '@mui/material';
import TabPanel from '@/components/TabPanel';
import ToastAlert from '@/components/ToastAlert';
import { a11yProps } from '@/helpers/strings';
import useAuth from '@/context/hooks/useAuth';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import CustomTileDialog from '@/views/CustomTileDialog';
import AppSettings from './AppSettings';
import BoardSettings from './BoardSettings';
import RoomSettings from './RoomSettings';
import './styles.css';
import validateFormData from './validateForm';
import useSubmitGameSettings from '@/hooks/useSubmitGameSettings';
import useSettingsToFormData from '@/hooks/useSettingsToFormData';
import useRoomNavigate from '@/hooks/useRoomNavigate';
import useActionList from '@/hooks/useActionList';

export default function GameSettings({ closeDialog }) {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [settings, updateSettings] = useLocalStorage('gameSettings');
  const [value, setValue] = useState(0);
  const [alert, setAlert] = useState(null);
  const [openCustomTile, setOpenCustomTile] = useState(false);
  const [formData, setFormData] = useSettingsToFormData();
  const navigate = useRoomNavigate();

  const submitSettings = useSubmitGameSettings();
  const { isLoading, actionsList } = useActionList(formData?.gameMode);

  const handleTabChange = (_, newValue) => {
    setValue(newValue);
    navigate(formData.room);
  };

  const boardUpdated = () => updateSettings({ ...settings, boardUpdated: true });

  async function handleSubmit(event) {
    event.preventDefault();
    // eslint-disable-next-line no-unused-vars
    const { displayName, ...gameOptions } = formData; // we don't want to validate the displayName

    const validationMessage = validateFormData(gameOptions, actionsList);
    if (validationMessage) return setAlert(t(validationMessage));

    submitSettings(formData, actionsList);

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

  if (!formData.room || isLoading) {
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
          <Trans i18nKey="customTilesLabel">Game Tiles</Trans>
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
