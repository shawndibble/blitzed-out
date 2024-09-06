import { Box, Divider } from '@mui/material';
import BackgroundSelect from 'components/BackgroundSelect';
import React from 'react';
import { useTranslation } from 'react-i18next';
import GameSpeed from './GameSpeed';
import PlayerListOption from './PlayerListOption';
import RoomSwitch from 'components/GameForm/RoomSwitch';

export default function RoomSettings({ formData, setFormData }) {
  const { t } = useTranslation();

  const backgrounds = {
    app: t('appBackground'),
    custom: t('customURL'),
  };

  return (
    <Box sx={{ margin: '0.5rem' }}>
      <RoomSwitch formData={formData} setFormData={setFormData} />

      {formData.room.toUpperCase() !== 'PUBLIC' && (
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
