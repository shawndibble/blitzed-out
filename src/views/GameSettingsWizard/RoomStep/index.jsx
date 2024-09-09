import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Trans } from 'react-i18next';
import RoomSwitch from 'components/GameForm/RoomSwitch';
import ButtonRow from 'components/ButtonRow';
import useRoomNavigate from 'hooks/useRoomNavigate';
import { isPublicRoom } from 'helpers/strings';

export default function RoomStep({ formData, setFormData, nextStep }) {
  const navigate = useRoomNavigate();

  function handleNext() {
    navigate(formData.room);
    nextStep(isPublicRoom(formData.room) ? 2 : 1);
  }

  return (
    <Box sx={{ m: 1 }}>
      <Typography variant="h6">
        <Trans i18nKey="publicOrPrivate" />
      </Typography>
      <Box sx={{ margin: '0.5rem' }}>
        <RoomSwitch formData={formData} setFormData={setFormData} />
      </Box>
      <ButtonRow>
        <Button variant="contained" onClick={handleNext}>
          <Trans i18nKey={isPublicRoom(formData.room) ? 'nextSkip' : 'next'} />
        </Button>
      </ButtonRow>
    </Box>
  );
}
