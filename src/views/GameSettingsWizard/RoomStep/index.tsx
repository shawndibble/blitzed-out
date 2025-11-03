import { Box, Button, Typography, Stack, TextField } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import ButtonRow from '@/components/ButtonRow';
import ValueProposition from '../components/ValueProposition';
import { isPublicRoom } from '@/helpers/strings';
import { customAlphabet } from 'nanoid';
import { useState, useCallback, ChangeEvent, KeyboardEvent, useEffect } from 'react';
import { Settings } from '@/types/Settings';
import { getDatabase, ref, get } from 'firebase/database';
import { useParams } from 'react-router-dom';

interface RoomStepProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
  nextStep: (step: number) => void;
}

export default function RoomStep({ formData, setFormData, nextStep }: RoomStepProps): JSX.Element {
  const { t } = useTranslation();
  const { id: urlRoom } = useParams<{ id: string }>();
  const [showPrivateRoomField, setShowPrivateRoomField] = useState(
    !isPublicRoom(formData.room || urlRoom)
  );
  const [roomInputValue, setRoomInputValue] = useState(formData.room?.toUpperCase() || '');

  // Update UI state when URL or formData.room changes
  useEffect(() => {
    // Use formData.room as the source of truth for the current room state
    // Only fall back to urlRoom if formData.room is not set
    const currentRoom = formData.room || urlRoom;
    const shouldShowPrivateField = !isPublicRoom(currentRoom);
    const newRoomInputValue = currentRoom?.toUpperCase() || '';

    queueMicrotask(() => {
      if (shouldShowPrivateField !== showPrivateRoomField) {
        setShowPrivateRoomField(shouldShowPrivateField);
      }
      if (newRoomInputValue !== roomInputValue) {
        setRoomInputValue(newRoomInputValue);
      }
    });
  }, [urlRoom, formData.room, showPrivateRoomField, roomInputValue]);

  const checkRoomExists = async (roomId: string): Promise<boolean> => {
    try {
      const database = getDatabase();
      const roomRef = ref(database, `rooms/${roomId}/uids`);
      const snapshot = await get(roomRef);
      return snapshot.exists();
    } catch {
      return false;
    }
  };

  const generateUniqueRoomId = useCallback(async (): Promise<string> => {
    const nanoid = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 5);
    let roomId: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      roomId = nanoid();
      attempts++;

      if (attempts >= maxAttempts) {
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
      roomRealtime: true,
    });
    setShowPrivateRoomField(false);
  }, [formData, setFormData]);

  const handlePrivateRoomSelect = useCallback(async () => {
    const roomId = await generateUniqueRoomId();
    setFormData({
      ...formData,
      room: roomId,
      gameMode: 'online',
      roomRealtime: false,
    });
    setRoomInputValue(roomId.toUpperCase());
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

  const isPublic = isPublicRoom(formData.room || urlRoom);

  function handleNext(): void {
    nextStep(isPublic ? 3 : 1);
  }

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
          <Trans i18nKey="next" />
        </Button>
      </ButtonRow>
    </Box>
  );
}
