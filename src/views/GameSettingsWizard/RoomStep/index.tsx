import { Box, Button, Typography, Stack, TextField } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import ButtonRow from '@/components/ButtonRow';
import ValueProposition from '../components/ValueProposition';
import useRoomNavigate from '@/hooks/useRoomNavigate';
import { isPublicRoom } from '@/helpers/strings';
import { customAlphabet } from 'nanoid';
import { useState, useCallback, ChangeEvent, KeyboardEvent, FocusEvent } from 'react';
import { Settings } from '@/types/Settings';

interface RoomStepProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
  nextStep: (step: number) => void;
}

export default function RoomStep({ formData, setFormData, nextStep }: RoomStepProps): JSX.Element {
  const navigate = useRoomNavigate();
  const { t } = useTranslation();
  const [showPrivateRoomField, setShowPrivateRoomField] = useState(!isPublicRoom(formData.room));

  const handlePublicRoomSelect = useCallback(() => {
    setFormData({
      ...formData,
      room: 'PUBLIC',
      gameMode: 'online',
    });
    setShowPrivateRoomField(false);
  }, [formData, setFormData]);

  const handlePrivateRoomSelect = useCallback(() => {
    if (isPublicRoom(formData.room)) {
      const roomId = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 5)();
      setFormData({
        ...formData,
        room: roomId.toUpperCase(),
      });
    }
    setShowPrivateRoomField(true);
  }, [formData, setFormData]);

  const handleRoomChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const upperCaseValue = event.target.value.toUpperCase();
    event.target.value = upperCaseValue;
  }, []);

  const handleRoomBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      setFormData({
        ...formData,
        room: event.currentTarget.value,
        boardUpdated: true,
      });
    },
    [formData, setFormData]
  );

  const handleRoomKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        setFormData({
          ...formData,
          room: event.currentTarget.value,
          boardUpdated: true,
        });
      }
    },
    [formData, setFormData]
  );

  function handleNext(): void {
    navigate(formData.room);
    nextStep(isPublicRoom(formData.room) ? 2 : 1);
  }

  const isPublic = isPublicRoom(formData.room);

  return (
    <Box sx={{ m: 1 }}>
      <Typography variant="h5" gutterBottom textAlign="center">
        <Trans i18nKey="chooseRoomType" />
      </Typography>

      <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
        <Trans i18nKey="roomTypeDescription" />
      </Typography>

      <Stack spacing={2} sx={{ mb: 3 }}>
        <ValueProposition isPublic={true} onClick={handlePublicRoomSelect} isSelected={isPublic} />
        <ValueProposition
          isPublic={false}
          onClick={handlePrivateRoomSelect}
          isSelected={!isPublic}
        />
      </Stack>

      {showPrivateRoomField && !isPublic && (
        <TextField
          fullWidth
          id="privateRoom"
          label={t('privateRoomCode')}
          defaultValue={formData.room?.toUpperCase()}
          margin="normal"
          onBlur={handleRoomBlur}
          onKeyDown={handleRoomKeyDown}
          onChange={handleRoomChange}
          inputProps={{ style: { textTransform: 'uppercase' } }}
          helperText={t('privateRoomCodeHelp')}
          sx={{ mb: 2 }}
        />
      )}

      <ButtonRow>
        <Button variant="contained" onClick={handleNext} size="large">
          <Trans i18nKey={isPublic ? 'nextSkip' : 'next'} />
        </Button>
      </ButtonRow>
    </Box>
  );
}
