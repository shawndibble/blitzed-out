import {
  FormControl, InputLabel, MenuItem, Select, TextField,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function BackgroundSelect({
  formData, setFormData, backgrounds, backgroundKey = 'background', backgroundURLKey = 'backgroundURL',
}) {
  const { t } = useTranslation();
  const [background, setBackground] = useState(
    formData?.[backgroundKey] || Object.keys(backgrounds)[0],
  );

  const options = () => Object.entries(backgrounds).map(([file, label]) => (
    <MenuItem value={file} key={file}>{label}</MenuItem>
  ));

  const backgroundSelection = (event) => {
    setFormData({ ...formData, [backgroundKey]: event.target.value });
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
          value={formData?.[backgroundURLKey]}
          fullWidth
          onChange={(event) => setFormData({
            ...formData,
            [backgroundKey]: 'custom',
            [backgroundURLKey]: event.target.value,
          })}
          helperText={t('fileExtension')}
        />
      )}
    </>
  );
}
