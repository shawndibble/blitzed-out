import { FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import React from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function BackgroundSelect({ formData, setFormData, backgrounds, isRoom = false }) {
  const { t } = useTranslation();
  const backgroundKey = !isRoom ? 'background' : 'roomBackground';
  const backgroundURLKey = !isRoom ? 'backgroundURL' : 'roomBackgroundURL';
  const [background, setBackground] = useState(
    formData?.[backgroundKey] || Object.keys(backgrounds)[0]
  );

  const options = () =>
    Object.entries(backgrounds).map(([file, label]) => (
      <MenuItem value={file} key={file}>
        {label}
      </MenuItem>
    ));

  const backgroundSelection = (event) => {
    setFormData({ ...formData, [backgroundKey]: event.target.value });
    setBackground(event.target.value);
  };

  useEffect(() => {
    if (background !== formData?.[backgroundKey]) {
      setBackground(formData?.[backgroundKey]);
    }
  }, [formData?.[backgroundKey]]);

  const handleURLChange = (event) => {
    const data = {
      ...formData,
      [backgroundKey]: 'custom',
      [backgroundURLKey]: event.target.value,
    };
    if (isRoom) {
      data.roomUpdated = true;
    }
    setFormData(data);
  };

  return (
    <>
      <FormControl fullWidth margin="normal">
        <InputLabel id="background-label">{t('background')}</InputLabel>
        <Select
          labelId="background-label"
          id="background"
          label={t('background')}
          value={background || ''}
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
          onChange={handleURLChange}
          helperText={
            <>
              {t('supportedSites')}
              <br />
              {t('requiresEmbeddedUrl')}
            </>
          }
        />
      )}
    </>
  );
}
