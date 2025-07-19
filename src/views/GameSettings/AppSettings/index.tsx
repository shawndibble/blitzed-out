import { Divider, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import BackgroundSelect from '@/components/BackgroundSelect';
import LanguageSelect from './LanguageSelect';
import AppBoolSwitch from './AppBoolSwitch';
import { useSettings } from '@/stores/settingsStore';
import { Settings } from '@/types/Settings';
import { ChangeEvent } from 'react';

interface AppSettingsProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
  boardUpdated: () => void;
}

export default function AppSettings({
  formData,
  setFormData,
  boardUpdated,
}: AppSettingsProps): JSX.Element {
  const [settings, updateSettings] = useSettings();

  const { t } = useTranslation();
  const backgrounds: Record<string, string> = {
    color: t('color'),
    gray: t('gray'),
    'metronome.gif': t('hypnoDick'),
    'pink-spiral.gif': t('pinkSpiral'),
    custom: t('customURL'),
  };

  function handleSwitch(event: ChangeEvent<HTMLInputElement>, field: string): void {
    setFormData({ ...formData, [field]: event.target.checked });
    // normally we wouldn't update settings as it can be very slow, but for switch toggles,
    // I want to ensure the local storage is updated immediately
    updateSettings({ ...settings, [field]: event.target.checked });
  }

  return (
    <>
      <LanguageSelect boardUpdated={boardUpdated} />

      <Typography variant="h5">
        <Trans i18nKey="dialog" />
      </Typography>

      <AppBoolSwitch field="playerDialog" formData={formData} handleSwitch={handleSwitch} />
      <AppBoolSwitch field="othersDialog" formData={formData} handleSwitch={handleSwitch} />

      <Divider />

      <Typography variant="h5" sx={{ mt: 2 }}>
        <Trans i18nKey="sounds" />
      </Typography>

      <AppBoolSwitch field="mySound" formData={formData} handleSwitch={handleSwitch} />
      <AppBoolSwitch field="otherSound" formData={formData} handleSwitch={handleSwitch} />
      <AppBoolSwitch field="chatSound" formData={formData} handleSwitch={handleSwitch} />
      <AppBoolSwitch field="readRoll" formData={formData} handleSwitch={handleSwitch} />

      <Divider />

      <Typography variant="h5" sx={{ mt: 2, textTransform: 'capitalize' }}>
        <Trans i18nKey="misc" />
      </Typography>

      <AppBoolSwitch field="hideBoardActions" formData={formData} handleSwitch={handleSwitch} />
      <AppBoolSwitch field="advancedSettings" formData={formData} handleSwitch={handleSwitch} />

      <BackgroundSelect formData={formData} setFormData={setFormData} backgrounds={backgrounds} />
      <Divider />
    </>
  );
}
