import {
  Box,
  Button,
  Typography,
  Stack,
  TextField,
  Card,
  CardContent,
  Grid,
  Chip,
} from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import ButtonRow from '@/components/ButtonRow';
import RoomQRCode from '@/components/RoomQRCode';
import ValueProposition from '../components/ValueProposition';
import { isPublicRoom } from '@/helpers/strings';
import { customAlphabet } from 'nanoid';
import { useState, useCallback, ChangeEvent, KeyboardEvent, useEffect, useMemo } from 'react';
import { Settings } from '@/types/Settings';
import { getDatabase, ref, get } from 'firebase/database';
import type { PlayerGender } from '@/types/localPlayers';
import { useParams } from 'react-router-dom';

interface RoomStepProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
  nextStep: (step: number) => void;
}

const genderOptions = [
  { value: 'male', labelKey: 'localPlayers.gender.male' },
  { value: 'female', labelKey: 'localPlayers.gender.female' },
  { value: 'non-binary', labelKey: 'localPlayers.gender.nonBinary' },
] as const;

export default function RoomStep({ formData, setFormData, nextStep }: RoomStepProps): JSX.Element {
  const { t } = useTranslation();
  const { id: urlRoom } = useParams<{ id: string }>();

  // Derive showPrivateRoomField from formData/urlRoom
  const currentRoom = formData.room || urlRoom;
  const showPrivateRoomField = useMemo(() => !isPublicRoom(currentRoom), [currentRoom]);

  // Use state key pattern to reset roomInputValue when currentRoom changes externally
  const roomInputKey = currentRoom;
  const [localInputValue, setLocalInputValue] = useState('');

  // Derive the displayed value (prioritize local input, fallback to currentRoom)
  const roomInputValue = localInputValue || currentRoom?.toUpperCase() || '';

  // Reset local input when currentRoom changes from external source
  useEffect(() => {
    setLocalInputValue('');
  }, [roomInputKey]);

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
  }, [formData, setFormData]);

  const handlePrivateRoomSelect = useCallback(async () => {
    const roomId = await generateUniqueRoomId();
    setFormData({
      ...formData,
      room: roomId,
      gameMode: 'online',
      roomRealtime: false,
    });
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
    setLocalInputValue(upperCaseValue);
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

      {/* Gender Selection */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
          <Trans i18nKey="yourGender" />
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          <Trans i18nKey="anatomyDescription" />
        </Typography>
        <Grid container spacing={2}>
          {genderOptions.map((option) => (
            <Grid size={{ xs: 12, sm: 4 }} key={option.value}>
              <Card
                role="button"
                tabIndex={0}
                sx={{
                  cursor: 'pointer',
                  border: formData.gender === option.value ? '2px solid' : '1px solid',
                  borderColor: formData.gender === option.value ? 'primary.main' : 'divider',
                  backgroundColor:
                    formData.gender === option.value ? 'primary.50' : 'background.paper',
                  transition: 'all 0.2s ease-in-out',
                  height: '100%',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                  },
                }}
                onClick={() =>
                  setFormData({
                    ...formData,
                    gender: option.value as PlayerGender,
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setFormData({
                      ...formData,
                      gender: option.value as PlayerGender,
                    });
                  }
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Stack spacing={1} alignItems="center" textAlign="center">
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {t(option.labelKey)}
                    </Typography>
                    {formData.gender === option.value && (
                      <Chip label={t('selected')} color="primary" size="small" sx={{ mt: 1 }} />
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

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
          <RoomQRCode roomCode={roomInputValue} />
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
