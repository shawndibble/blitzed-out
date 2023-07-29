import {
  FormControl, InputLabel, MenuItem, Select,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function BackgroundSelect({ settings, setFormData }) {
  const { t } = useTranslation();

  const backgrounds = {
    color: t('color'),
    gray: t('gray'),
    metronome: t('hypnoDick'),
    pinkSpiral: t('pinkSpiral'),
    bwSpiral: t('bwSpiral'),
  };

  const options = () => Object.entries(backgrounds).map(([file, label]) => (
    <MenuItem value={file} key={file}>{label}</MenuItem>
  ));

  return (
    <FormControl fullWidth margin="normal">
      <InputLabel id="background-label">{t('background')}</InputLabel>
      <Select
        labelId="background-label"
        id="background"
        label={t('background')}
        value={settings.background}
        onChange={(event) => setFormData({ ...settings, background: event.target.value })}
      >
        {options()}
      </Select>
    </FormControl>
  );
}
