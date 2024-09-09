import { Divider, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import BackgroundSelect from 'components/BackgroundSelect';
import LanguageSelect from './LanguageSelect';
import AppBoolSwitch from './AppBoolSwitch';
import useLocalStorage from 'hooks/useLocalStorage';

export default function AppSettings({ formData, setFormData, boardUpdated }) {
  const [settings, updateSettings] = useLocalStorage('gameSettings');

  const { t } = useTranslation();
  const backgrounds = {
    color: t('color'),
    gray: t('gray'),
    'metronome.gif': t('hypnoDick'),
    'pink-spiral.gif': t('pinkSpiral'),
    custom: t('customURL'),
  };

  function handleSwitch(event, field) {
    setFormData({ ...formData, [field]: event.target.checked });
    // normally we wouldn't update settings as it can be very slow, but for switch toggles,
    // I want to ensure the local storage is updated immediately
    updateSettings({ ...settings, [field]: event.target.checked });
  }

  return (
    <>
      <LanguageSelect boardUpdated={boardUpdated} />

      <Typography variant="h3">
        <Trans i18nKey="dialog" />
      </Typography>

      <AppBoolSwitch field="playerDialog" formData={formData} handleSwitch={handleSwitch} />
      <AppBoolSwitch field="othersDialog" formData={formData} handleSwitch={handleSwitch} />

      <Divider />

      <Typography variant="h3" sx={{ mt: 2 }}>
        <Trans i18nKey="sounds" />
      </Typography>

      <AppBoolSwitch field="mySound" formData={formData} handleSwitch={handleSwitch} />
      <AppBoolSwitch field="otherSound" formData={formData} handleSwitch={handleSwitch} />
      <AppBoolSwitch field="chatSound" formData={formData} handleSwitch={handleSwitch} />
      <AppBoolSwitch field="readRoll" formData={formData} handleSwitch={handleSwitch} />

      <Divider />

      <Typography variant="h3" sx={{ mt: 2, textTransform: 'capitalize' }}>
        <Trans i18nKey="miscellaneous" />
      </Typography>

      <AppBoolSwitch field="visibleBoardActions" formData={formData} handleSwitch={handleSwitch} />
      <AppBoolSwitch field="advancedSettings" formData={formData} handleSwitch={handleSwitch} />

      <BackgroundSelect formData={formData} setFormData={setFormData} backgrounds={backgrounds} />
      <Divider />
    </>
  );
}
