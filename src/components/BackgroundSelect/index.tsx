import { ChangeEvent, useEffect, useState } from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from '@mui/material';
import {
  filterBackgroundOptions,
  getBackgroundKey,
  getBackgroundURLKey,
} from '@/utils/backgroundUtils';

import { Settings } from '@/types/Settings';
import { useTranslation } from 'react-i18next';

interface BackgroundSelectProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
  backgrounds: Record<string, string>;
  isRoom?: boolean;
  isPrivateRoom?: boolean;
  onBackgroundChange?: (
    backgroundKey: string,
    backgroundValue: string,
    backgroundURLKey?: string,
    backgroundURLValue?: string
  ) => void;
}

export default function BackgroundSelect({
  formData,
  setFormData,
  backgrounds,
  isRoom = false,
  isPrivateRoom = false,
  onBackgroundChange,
}: BackgroundSelectProps): JSX.Element {
  const { t } = useTranslation();
  const backgroundKey = getBackgroundKey(isRoom);
  const backgroundURLKey = getBackgroundURLKey(isRoom);
  const filteredBackgrounds = filterBackgroundOptions(backgrounds, isRoom, isPrivateRoom);

  // No defaults - let background be undefined/null if not set
  const currentBackground = formData?.[backgroundKey];
  const [background, setBackground] = useState<string>(currentBackground || '');

  const options = () => {
    const menuItems = [
      ...Object.entries(filteredBackgrounds).map(([file, label]) => (
        <MenuItem value={file} key={file}>
          {label}
        </MenuItem>
      )),
    ];
    return menuItems;
  };

  const backgroundSelection = (event: SelectChangeEvent<string>) => {
    const value = event.target.value as string;
    const data = { ...formData, [backgroundKey]: value } as Settings;

    // Clear stale URL when switching away from custom
    if (value !== 'custom') {
      // Type-safe property assignment using computed property syntax
      const updatedData = {
        ...data,
        [backgroundURLKey]: '',
      } as Settings;

      if (isRoom) {
        updatedData.roomUpdated = true;
      }

      setFormData(updatedData);
      setBackground(value);

      // Update settings immediately
      onBackgroundChange?.(backgroundKey, value, backgroundURLKey, '');
      return;
    }

    if (isRoom) {
      data.roomUpdated = true;
    }
    setFormData(data);
    setBackground(value);

    // Update settings immediately for custom background
    onBackgroundChange?.(backgroundKey, value);
  };

  useEffect(() => {
    // Handle special case where useRoomBackground is the selected value but not in filteredBackgrounds
    const validBackground = (() => {
      if (!currentBackground) return '';

      // If it's useRoomBackground and we're in a private room, it's valid even if not in filteredBackgrounds
      if (currentBackground === 'useRoomBackground' && isPrivateRoom) {
        return currentBackground;
      }

      // Otherwise, check if it exists in filteredBackgrounds
      return filteredBackgrounds[currentBackground] ? currentBackground : '';
    })();

    if (background !== validBackground) {
      setBackground(validBackground);
    }
  }, [background, currentBackground, filteredBackgrounds, isPrivateRoom]);

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

    // Update settings immediately for URL changes
    onBackgroundChange?.(backgroundKey, 'custom', backgroundURLKey, event.target.value);
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
          displayEmpty
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
