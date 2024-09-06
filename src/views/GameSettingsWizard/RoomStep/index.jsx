import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Trans } from 'react-i18next';
import RoomSwitch from 'components/GameForm/RoomSwitch';
import ButtonRow from 'components/ButtonRow';

export default function RoomStep({ formData, setFormData, nextStep }) {
  return (
    <Box sx={{ m: 1 }}>
      <Typography variant="h6">
        <Trans i18nKey="publicOrPrivate" />
      </Typography>
      <Box sx={{ margin: '0.5rem' }}>
        <RoomSwitch formData={formData} setFormData={setFormData} />
      </Box>
      <ButtonRow>
        <Button variant="contained" onClick={() => nextStep(formData.room === 'PUBLIC' ? 2 : 1)}>
          <Trans i18nKey={formData.room === 'PUBLIC' ? 'nextSkip' : 'next'} />
        </Button>
      </ButtonRow>
    </Box>
  );
}
