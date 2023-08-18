import { Divider, FormControlLabel, Switch } from '@mui/material';
import { useTranslation } from 'react-i18next';
import LanguageSelect from './LanguageSelect';
import BackgroundSelect from './BackgroundSelect';

export default function AppSettings({
  formData, setFormData, settings, boardUpdated,
}) {
  const { t } = useTranslation();

  return (
    <>
      <LanguageSelect boardUpdated={boardUpdated} />
      <Divider />
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
      <FormControlLabel
        control={(
          <Switch
            checked={formData.readRoll}
            onChange={(event) => setFormData({ ...formData, readRoll: event.target.checked })}
          />
        )}
        label={t('readRoll')}
        labelPlacement="start"
        className="settings-switch"
      />
      <Divider />
      <BackgroundSelect settings={settings} setFormData={setFormData} />
      <Divider />
    </>
  );
}
