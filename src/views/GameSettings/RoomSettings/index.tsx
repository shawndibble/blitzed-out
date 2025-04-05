import { Box, Divider } from '@mui/material';
import BackgroundSelect from '@/components/BackgroundSelect';
import { useTranslation } from 'react-i18next';
import GameSpeed from './GameSpeed';
import PlayerListOption from './PlayerListOption';
import RoomSwitch from '@/components/GameForm/RoomSwitch';
import { isPublicRoom } from '@/helpers/strings';
import { Settings } from '@/types/Settings';
import { JSX } from 'react';

interface RoomSettingsProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
}

export default function RoomSettings({ formData, setFormData }: RoomSettingsProps): JSX.Element {
  const { t } = useTranslation();

  const backgrounds: Record<string, string> = {
    app: t('appBackground'),
    custom: t('customURL'),
  };

  return (
    <Box sx={{ margin: '0.5rem' }}>
      <RoomSwitch formData={formData} setFormData={setFormData} />

      {!isPublicRoom(formData.room) && (
        <>
          <Divider sx={{ my: 1 }} />
          <GameSpeed formData={formData} setFormData={setFormData} />
          <Divider sx={{ my: 1 }} />
          <PlayerListOption formData={formData} setFormData={setFormData} />
          <Divider sx={{ my: 1 }} />
          <BackgroundSelect
            formData={formData}
            setFormData={setFormData}
            backgrounds={backgrounds}
            isRoom={true}
          />
        </>
      )}
    </Box>
  );
}
