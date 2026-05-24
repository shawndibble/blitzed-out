import { Box, Button, Typography, TextField } from '@mui/material';
import { Trans } from 'react-i18next';
import ButtonRow from '@/components/ButtonRow';
import RoomQRCode from '@/components/RoomQRCode';
import { useState, useCallback, ChangeEvent, KeyboardEvent, useEffect } from 'react';
import { Settings } from '@/types/Settings';

interface RoomStepProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
  nextStep: (step: number) => void;
  prevStep: () => void;
}

export default function RoomStep({
  formData,
  setFormData,
  nextStep,
  prevStep,
}: RoomStepProps): JSX.Element {
  const [localInputValue, setLocalInputValue] = useState('');

  const roomCode = formData.room?.toUpperCase() || '';
  const roomInputValue = localInputValue || roomCode;

  useEffect(() => {
    setLocalInputValue('');
  }, [roomCode]);

  const updateRoomData = useCallback(
    (newRoomValue: string) => {
      setFormData({
        ...formData,
        room: newRoomValue,
        boardUpdated: true,
      });
    },
    [formData, setFormData]
  );

  const handleRoomChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setLocalInputValue(event.target.value.toUpperCase());
  }, []);

  const handleRoomBlur = useCallback(() => {
    updateRoomData(roomInputValue);
  }, [updateRoomData, roomInputValue]);

  const handleRoomKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        updateRoomData(roomInputValue);
      }
    },
    [updateRoomData, roomInputValue]
  );

  return (
    <Box sx={{ m: 1 }}>
      <Typography variant="h5" gutterBottom textAlign="center">
        <Trans i18nKey="chooseRoomType" />
      </Typography>

      <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
        <Trans i18nKey="roomTypeDescription" />
      </Typography>

      <Box
        sx={{
          p: 3,
          borderRadius: 2,
          backgroundColor: 'primary.50',
          mb: 2,
        }}
      >
        <TextField
          fullWidth
          id="privateRoom"
          value={roomInputValue}
          onBlur={handleRoomBlur}
          onKeyDown={handleRoomKeyDown}
          onChange={handleRoomChange}
          inputProps={{
            style: {
              textTransform: 'uppercase',
              fontFamily: 'monospace',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              textAlign: 'center',
              letterSpacing: '0.2em',
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'background.paper',
              '& fieldset': {
                borderColor: 'divider',
                borderWidth: 2,
              },
              '&:hover fieldset': {
                borderColor: 'primary.main',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
                borderWidth: 2,
              },
            },
          }}
        />
        <RoomQRCode roomCode={roomInputValue} />
      </Box>

      <ButtonRow>
        <Button onClick={prevStep}>
          <Trans i18nKey="previous" />
        </Button>
        <Button variant="contained" onClick={() => nextStep(1)} size="large">
          <Trans i18nKey="next" />
        </Button>
      </ButtonRow>
    </Box>
  );
}
