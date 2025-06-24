import { Box, Button, Tab, Tabs, TextField, Typography } from '@mui/material';
import TabPanel from '@/components/TabPanel';
import ToastAlert from '@/components/ToastAlert';
import { a11yProps } from '@/helpers/strings';
import useAuth from '@/context/hooks/useAuth';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useCallback, useState, FormEvent, KeyboardEvent, ReactNode, FocusEvent, JSX } from 'react';
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
import { Settings } from '@/types/Settings';

interface GameSettingsProps {
  closeDialog?: () => void;
  initialTab?: number;
}

export default function GameSettings({ closeDialog, initialTab = 0 }: GameSettingsProps): JSX.Element {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [settings, updateSettings] = useLocalStorage<Settings>('gameSettings');
  const [value, setValue] = useState<number>(initialTab);
  const [alert, setAlert] = useState<string | null>(null);
  const [openCustomTile, setOpenCustomTile] = useState<boolean>(false);
  const [formData, setFormData] = useSettingsToFormData();
  const navigate = useRoomNavigate();

  const submitSettings = useSubmitGameSettings();
  const { isLoading, actionsList } = useActionList(formData?.gameMode);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number): void => {
    setValue(newValue);
    navigate(formData.room);
  };

  const boardUpdated = (): void => updateSettings({ ...settings, boardUpdated: true });

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<null> {
    event.preventDefault();
    const { displayName, ...gameOptions } = formData; // we don't want to validate the displayName
    void displayName; // Intentionally excluded from validation

    const validationMessage = validateFormData(gameOptions, actionsList);
    if (validationMessage) {
      setAlert(t(validationMessage));
      return null;
    }

    submitSettings(formData, actionsList);

    if (typeof closeDialog === 'function') closeDialog();

    return null;
  }

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      setFormData((prevFormData) => ({
        ...prevFormData,
        displayName: event.target.value,
      }));
    },
    [setFormData]
  );

  const onEnterKey = useCallback(
    (event: KeyboardEvent<HTMLInputElement>): void => {
      if (event.key === 'Enter') {
        setFormData((prevFormData) => ({
          ...prevFormData,
          displayName: (event.target as HTMLInputElement).value,
        }));
        handleSubmit(event as unknown as FormEvent<HTMLFormElement>);
      }
    },
    [handleSubmit, setFormData]
  );

  if (!formData.room || isLoading) {
    return (
      <Box>
        <Typography variant="h2">
          <Trans i18nKey="loading" />
          ...
        </Typography>
        <Typography variant="body1">
          <Trans i18nKey="clearStorage" />
        </Typography>
      </Box>
    );
  }

  return (
    <Box component="form" method="post" onSubmit={handleSubmit} className="settings-box">
      <TextField
        fullWidth
        id="displayName"
        label={t('displayName')}
        defaultValue={user?.displayName || formData.displayName || ''}
        required
        autoFocus
        onBlur={handleBlur}
        onKeyDown={onEnterKey}
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
      <ToastAlert open={!!alert} close={() => setAlert(null)}>
        {alert as ReactNode}
      </ToastAlert>
    </Box>
  );
}
