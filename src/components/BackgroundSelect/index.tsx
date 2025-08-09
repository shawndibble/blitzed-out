import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import { Settings } from '@/types/Settings';
import {
  filterBackgroundOptions,
  getBackgroundKey,
  getBackgroundURLKey,
} from '@/utils/backgroundUtils';

interface BackgroundSelectProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
  backgrounds: Record<string, string>;
  isRoom?: boolean;
  isPrivateRoom?: boolean;
}

export default function BackgroundSelect({
  formData,
  setFormData,
  backgrounds,
  isRoom = false,
  isPrivateRoom = false,
}: BackgroundSelectProps): JSX.Element {
  const { t } = useTranslation();
  const backgroundKey = getBackgroundKey(isRoom);
  const backgroundURLKey = getBackgroundURLKey(isRoom);

  // Memoized background filtering to prevent unnecessary re-renders
  const filteredBackgrounds = useMemo(
    () => filterBackgroundOptions(backgrounds, isRoom, isPrivateRoom),
    [backgrounds, isRoom, isPrivateRoom]
  );

  // No defaults - let background be undefined/null if not set
  const currentBackground = formData?.[backgroundKey];
  const [background, setBackground] = useState<string>(currentBackground || '');

  const options = () =>
    Object.entries(filteredBackgrounds).map(([file, label]) => (
      <MenuItem value={file} key={file}>
        {label}
      </MenuItem>
    ));

  const backgroundSelection = (event: SelectChangeEvent<string>) => {
    const value = event.target.value as string;
    const data = { ...formData, [backgroundKey]: value } as Settings;
    if (isRoom) {
      data.roomUpdated = true;
      // Clear stale URL when switching away from custom
      if (value !== 'custom') {
        // Type-safe property assignment using computed property syntax
        const updatedData = {
          ...data,
          [backgroundURLKey]: '',
        } as Settings;
        setFormData(updatedData);
        setBackground(value);
        return;
      }
    }
    setFormData(data);
    setBackground(value);
  };

  useEffect(() => {
    if (background !== (currentBackground || '')) {
      setBackground(currentBackground || '');
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
