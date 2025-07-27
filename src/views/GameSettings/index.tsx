import './styles.css';

import { Box, Button, Tab, Tabs, TextField, Typography } from '@mui/material';
import { FocusEvent, FormEvent, JSX, KeyboardEvent, ReactNode, useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import AppSettings from './AppSettings';
import BoardSettings from './BoardSettings';
import CustomTileDialog from '@/views/CustomTileDialog';
import RoomSettings from './RoomSettings';
import TabPanel from '@/components/TabPanel';
import ToastAlert from '@/components/ToastAlert';
import { a11yProps } from '@/helpers/strings';
import useAuth from '@/context/hooks/useAuth';
import { useSettings } from '@/stores/settingsStore';
import useSettingsToFormData from '@/hooks/useSettingsToFormData';
import useSubmitGameSettings from '@/hooks/useSubmitGameSettings';
import useUnifiedActionList from '@/hooks/useUnifiedActionList';
import validateFormData from './validateForm';

interface GameSettingsProps {
  closeDialog?: () => void;
  initialTab?: number;
  onOpenSetupWizard?: () => void;
}

export default function GameSettings({
  closeDialog,
  initialTab = 0,
  onOpenSetupWizard,
}: GameSettingsProps): JSX.Element {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [settings, updateSettings] = useSettings();
  const [value, setValue] = useState<number>(initialTab);
  const [alert, setAlert] = useState<string | null>(null);
  const [openCustomTile, setOpenCustomTile] = useState<boolean>(false);
  const [formData, setFormData] = useSettingsToFormData();

  const submitSettings = useSubmitGameSettings();
  const { isLoading, actionsList } = useUnifiedActionList(formData?.gameMode);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number): void => {
    setValue(newValue);
  };

  const boardUpdated = (): void => updateSettings({ ...settings, boardUpdated: true });

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<null> => {
      event.preventDefault();
      const { displayName, ...gameOptions } = formData; // we don't want to validate the displayName
      void displayName; // Intentionally excluded from validation

      const validationMessage = validateFormData(gameOptions, actionsList);
      if (validationMessage) {
        setAlert(t(validationMessage));
        return null;
      }

      await submitSettings(formData, actionsList);

      if (typeof closeDialog === 'function') {
        closeDialog();
      }

      return null;
    },
    [formData, actionsList, t, setAlert, submitSettings, closeDialog]
  );

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
        <Tabs value={value} onChange={handleTabChange} aria-label={t('gameSettings')} centered>
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
        <div className="left-buttons">
          {onOpenSetupWizard && (
            <Button variant="outlined" type="button" onClick={onOpenSetupWizard}>
              <Trans i18nKey="setupWizard" />
            </Button>
          )}
          {value === 0 && (
            <Button variant="outlined" type="button" onClick={() => setOpenCustomTile(true)}>
              <Trans i18nKey="customTilesLabel">Game Tiles</Trans>
            </Button>
          )}
        </div>
        <Button variant="contained" type="submit">
          <Trans i18nKey="update" />
        </Button>
      </div>
      {openCustomTile && (
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
