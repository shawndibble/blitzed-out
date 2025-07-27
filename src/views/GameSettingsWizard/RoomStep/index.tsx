import { Box, Button, Typography, Stack, TextField } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import ButtonRow from '@/components/ButtonRow';
import ValueProposition from '../components/ValueProposition';
import useRoomNavigate from '@/hooks/useRoomNavigate';
import { isPublicRoom } from '@/helpers/strings';
import { customAlphabet } from 'nanoid';
import { useState, useCallback, ChangeEvent, KeyboardEvent } from 'react';
import { Settings } from '@/types/Settings';
import { getDatabase, ref, get } from 'firebase/database';

interface RoomStepProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
  nextStep: (step: number) => void;
}

export default function RoomStep({ formData, setFormData, nextStep }: RoomStepProps): JSX.Element {
  const navigate = useRoomNavigate();
  const { t } = useTranslation();
  const [showPrivateRoomField, setShowPrivateRoomField] = useState(!isPublicRoom(formData.room));
  const [roomInputValue, setRoomInputValue] = useState(formData.room?.toUpperCase() || '');

  // Function to check if a room ID exists
  const checkRoomExists = async (roomId: string): Promise<boolean> => {
    try {
      const database = getDatabase();
      const roomRef = ref(database, `rooms/${roomId}/uids`);
      const snapshot = await get(roomRef);
      return snapshot.exists();
    } catch (error) {
      console.warn('Error checking room existence:', error);
      return false; // Assume room doesn't exist if we can't check
    }
  };

  // Generate a unique room ID
  const generateUniqueRoomId = useCallback(async (): Promise<string> => {
    const nanoid = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 5);
    let roomId: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      roomId = nanoid();
      attempts++;

      if (attempts >= maxAttempts) {
        console.warn('Max attempts reached for room ID generation, using generated ID');
        break;
      }
    } while (await checkRoomExists(roomId));

    return roomId;
  }, []);

  const handlePublicRoomSelect = useCallback(() => {
    setFormData({
      ...formData,
      room: 'PUBLIC',
      gameMode: 'online',
    });
    setShowPrivateRoomField(false);
  }, [formData, setFormData]);

  const handlePrivateRoomSelect = useCallback(async () => {
    if (isPublicRoom(formData.room)) {
      const roomId = await generateUniqueRoomId();
      setFormData({
        ...formData,
        room: roomId,
      });
      setRoomInputValue(roomId.toUpperCase());
    }
    setShowPrivateRoomField(true);
  }, [formData, setFormData, generateUniqueRoomId]);

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
    const upperCaseValue = event.target.value.toUpperCase();
    setRoomInputValue(upperCaseValue);
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

      {showPrivateRoomField && (
        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: 'primary.50',
            mb: 2,
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            {t('privateRoomCode')}
          </Typography>
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
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, textAlign: 'center' }}>
            {t('privateRoomCodeHelp')}
          </Typography>
        </Box>
      )}

      <ButtonRow>
        <Button variant="contained" onClick={handleNext} size="large">
          <Trans i18nKey={isPublic ? 'nextSkip' : 'next'} />
        </Button>
      </ButtonRow>
    </Box>
  );
}
