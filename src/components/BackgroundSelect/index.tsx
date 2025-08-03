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

  // Set intelligent defaults based on context
  const getDefaultBackground = () => {
    if (isRoom) {
      // Room background defaults to "useAppBackground"
      return 'useAppBackground';
    } else {
      // App background - check if we're in a private room with room background
      // For now, default to "color" - the resolution logic will handle "useRoomBackground"
      return 'color';
    }
  };

  const defaultBackground = getDefaultBackground();

  // Always ensure we have a valid background value - never undefined or empty
  const currentBackground = formData?.[backgroundKey] || defaultBackground;
  const [background, setBackground] = useState<string>(currentBackground);

  // Initialize formData with default value if not set
  useEffect(() => {
    if (!formData?.[backgroundKey]) {
      setFormData({ ...formData, [backgroundKey]: defaultBackground });
    }
  }, [formData, backgroundKey, defaultBackground, setFormData]);

  const options = () =>
    Object.entries(backgrounds).map(([file, label]) => (
      <MenuItem value={file} key={file}>
        {label}
      </MenuItem>
    ));

  const backgroundSelection = (event: SelectChangeEvent<string>) => {
    setFormData({ ...formData, [backgroundKey]: event.target.value });
    setBackground(event.target.value);
  };

  useEffect(() => {
    if (background !== currentBackground) {
      setBackground(currentBackground);
    }
  }, [background, currentBackground]);

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
