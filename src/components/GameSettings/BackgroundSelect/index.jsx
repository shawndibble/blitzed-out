import {
  FormControl, InputLabel, MenuItem, Select, TextField,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function BackgroundSelect({ settings, setFormData }) {
  const { t } = useTranslation();
  const [background, setBackground] = useState(settings.background);

  const backgrounds = {
    color: t('color'),
    gray: t('gray'),
    'metronome.gif': t('hypnoDick'),
    'pink-spiral.gif': t('pinkSpiral'),
    'bw-spiral.mp4': t('bwSpiral'),
    custom: t('customURL'),
  };

  const options = () => Object.entries(backgrounds).map(([file, label]) => (
    <MenuItem value={file} key={file}>{label}</MenuItem>
  ));

  const backgroundSelection = (event) => {
    setFormData({ ...settings, background: event.target.value });
    setBackground(event.target.value);
  };

  return (
    <>
      <FormControl fullWidth margin="normal">
        <InputLabel id="background-label">{t('background')}</InputLabel>
        <Select
          labelId="background-label"
          id="background"
          label={t('background')}
          value={background}
          onChange={backgroundSelection}
        >
          {options()}
        </Select>
      </FormControl>
      {background === 'custom' && (
        <TextField
          sx={{ mt: 2 }}
          label={t('url')}
          value={settings.backgroundURL}
          fullWidth
          onChange={(event) => setFormData({
            ...settings,
            background: 'custom',
            backgroundURL: event.target.value,
          })}
          helperText={t('fileExtension')}
        />
      )}
    </>
  );
}
