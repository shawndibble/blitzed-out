import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  SelectChangeEvent,
} from '@mui/material';
import { useEffect, useState, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings } from '@/types/Settings';

interface BackgroundSelectProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
  backgrounds: Record<string, string>;
  isRoom?: boolean;
}

export default function BackgroundSelect({
  formData,
  setFormData,
  backgrounds,
  isRoom = false,
}: BackgroundSelectProps): JSX.Element {
  const { t } = useTranslation();
  const backgroundKey = !isRoom ? 'background' : 'roomBackground';
  const backgroundURLKey = !isRoom ? 'backgroundURL' : 'roomBackgroundURL';
  const [background, setBackground] = useState<string>(
    formData?.[backgroundKey] || Object.keys(backgrounds)[0]
  );

  const options = () =>
    Object.entries(backgrounds).map(([file, label]) => (
      <MenuItem value={file} key={file}>
        {label}
      </MenuItem>
    ));

  const backgroundSelection = (event: SelectChangeEvent<string>) => {
    const data = { ...formData, [backgroundKey]: event.target.value };
    if (backgroundKey === 'roomBackground' && event.target.value === 'app') {
      data.roomBackgroundURL = '';
      data.roomUpdated = true;
    }
    setFormData(data);
    setBackground(event.target.value);
  };

  useEffect(() => {
    if (background !== formData?.[backgroundKey]) {
      setBackground(formData?.[backgroundKey] || '');
    }
  }, [formData, background, backgroundKey]);

  const handleURLChange = (event: ChangeEvent<HTMLInputElement>) => {
    const data = {
      ...formData,
      [backgroundKey]: 'custom',
      [backgroundURLKey]: event.target.value,
    } as Settings;

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
          value={formData?.[backgroundURLKey] || ''}
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
