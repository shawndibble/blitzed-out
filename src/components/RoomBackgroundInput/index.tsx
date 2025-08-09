import { ChangeEvent } from 'react';
import { TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Settings } from '@/types/Settings';

interface RoomBackgroundInputProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
}

export default function RoomBackgroundInput({
  formData,
  setFormData,
}: RoomBackgroundInputProps): JSX.Element {
  const { t } = useTranslation();

  const handleURLChange = (event: ChangeEvent<HTMLInputElement>) => {
    const data = {
      ...formData,
      roomBackgroundURL: event.target.value,
      roomUpdated: true,
    } as Settings;

    setFormData(data);
  };

  return (
    <TextField
      sx={{ mt: 2 }}
      label={t('roomBackgroundURL')}
      value={formData?.roomBackgroundURL || ''}
      fullWidth
      onChange={handleURLChange}
      helperText={t('supportedSites')}
      placeholder={t('roomBackgroundPlaceholder')}
    />
  );
}
