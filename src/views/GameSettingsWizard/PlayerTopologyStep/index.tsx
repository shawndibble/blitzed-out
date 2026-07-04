import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Tooltip,
  Typography,
  Chip,
} from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import ButtonRow from '@/components/ButtonRow';
import { customAlphabet } from 'nanoid';
import { useEffect, useState } from 'react';
import { isOffline } from '@/helpers/networkStatus';
import type { FormData } from '@/types';
import type { Settings } from '@/types/Settings';

interface PlayerTopologyStepProps {
  formData: FormData & Partial<Settings>;
  setFormData: React.Dispatch<React.SetStateAction<FormData & Partial<Settings>>>;
  nextStep: (count?: number) => void;
}

const generateRoomCode = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 5);

export default function PlayerTopologyStep({
  formData,
  setFormData,
  nextStep,
}: PlayerTopologyStepProps): JSX.Element {
  const { t } = useTranslation();
  const [offline, setOffline] = useState(isOffline());

  useEffect(() => {
    const updateOffline = () => setOffline(isOffline());

    window.addEventListener('online', updateOffline);
    window.addEventListener('offline', updateOffline);

    return () => {
      window.removeEventListener('online', updateOffline);
      window.removeEventListener('offline', updateOffline);
    };
  }, []);

  const selectSolo = () => {
    setFormData((prev) => {
      // Preserve an existing private solo room; a missing/empty room is public.
      const keepPrivate = prev.gameMode === 'solo' && !!prev.room && prev.room !== 'PUBLIC';
      return {
        ...prev,
        gameMode: 'solo',
        soloPlay: true,
        room: keepPrivate ? prev.room : 'PUBLIC',
        roomRealtime: keepPrivate ? false : true,
        hasLocalPlayers: false,
        localPlayersData: undefined,
        localPlayerSessionSettings: undefined,
      };
    });
  };

  const handleNext = () => {
    // Solo skips the room/local-players screen entirely.
    if (formData.gameMode === 'solo') {
      nextStep(2);
    } else {
      nextStep();
    }
  };

  const selectSharedDevice = () => {
    setFormData((prev) => {
      // Re-tapping the already-selected card must not mint a fresh code — the
      // user may have already shared it. Only generate when there's no usable
      // room code for this mode yet.
      const keepRoom = prev.gameMode === 'local' && !!prev.room && prev.room !== 'PUBLIC';
      return {
        ...prev,
        gameMode: 'local',
        soloPlay: false,
        room: keepRoom ? prev.room : generateRoomCode(),
        roomRealtime: false,
      };
    });
  };

  const selectIndividualDevices = () => {
    if (offline) return;

    setFormData((prev) => {
      const keepRoom = prev.gameMode === 'online' && !!prev.room && prev.room !== 'PUBLIC';
      return {
        ...prev,
        gameMode: 'online',
        soloPlay: true,
        room: keepRoom ? prev.room : generateRoomCode(),
        roomRealtime: false,
        hasLocalPlayers: false,
        localPlayersData: undefined,
        localPlayerSessionSettings: undefined,
      };
    });
  };

  const cards = [
    {
      id: 'solo',
      title: t('playerTopology.solo.title', 'Just Me'),
      description: t('playerTopology.solo.description', 'Play solo on this device.'),
      selected: formData.gameMode === 'solo',
      onClick: selectSolo,
    },
    {
      id: 'local',
      title: t('playerTopology.shared.title', 'Pass & Play'),
      description: t(
        'playerTopology.shared.description',
        'One device, 2-4 players, pass it around.'
      ),
      selected: formData.gameMode === 'local',
      onClick: selectSharedDevice,
    },
    {
      id: 'online',
      title: t('playerTopology.online.title', 'Party Room'),
      description: t('playerTopology.online.description', 'Everyone joins from their own phone.'),
      selected: formData.gameMode === 'online',
      disabled: offline,
      onClick: selectIndividualDevices,
    },
  ];

  return (
    <Box sx={{ minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          textAlign: 'center',
          fontWeight: 600,
          mb: 1,
        }}
      >
        {t('playerTopology.title', 'How are you playing tonight?')}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: 'text.secondary',
          textAlign: 'center',
          mb: 3,
        }}
      >
        {t('playerTopology.subtitle', 'Pick one to jump in — you can fine-tune everything later.')}
      </Typography>
      <Grid container spacing={2}>
        {cards.map((card) => {
          const content = (
            <Card
              role="button"
              tabIndex={card.disabled ? -1 : 0}
              aria-disabled={card.disabled}
              onClick={card.onClick}
              onKeyDown={(event) => {
                if (!card.disabled && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  card.onClick();
                }
              }}
              sx={{
                cursor: card.disabled ? 'not-allowed' : 'pointer',
                border: card.selected ? '3px solid' : '1px solid',
                borderColor: card.selected ? 'primary.main' : 'divider',
                backgroundColor: card.selected ? 'action.selected' : 'background.paper',
                opacity: card.disabled ? 0.55 : 1,
                transition: 'all 0.2s ease-in-out',
                height: '100%',
                '&:hover': card.disabled
                  ? {}
                  : {
                      borderColor: 'primary.main',
                      transform: 'translateY(-2px)',
                      boxShadow: 2,
                    },
              }}
            >
              <CardContent sx={{ p: 3, height: '100%' }}>
                <Stack
                  spacing={1.5}
                  sx={{
                    alignItems: 'center',
                    textAlign: 'center',
                    height: '100%',
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {card.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                    }}
                  >
                    {card.description}
                  </Typography>
                  {card.selected && (
                    <Chip label={t('selected')} color="primary" size="small" sx={{ mt: 'auto' }} />
                  )}
                </Stack>
              </CardContent>
            </Card>
          );

          return (
            <Grid size={{ xs: 12, md: 4 }} key={card.id}>
              {card.disabled ? (
                <Tooltip
                  title={t(
                    'playerTopology.online.offlineTooltip',
                    'Individual devices require an internet connection.'
                  )}
                >
                  <Box>{content}</Box>
                </Tooltip>
              ) : (
                content
              )}
            </Grid>
          );
        })}
      </Grid>
      <Box sx={{ flexGrow: 1 }} />
      <ButtonRow justifyContent="center">
        <Button
          variant="contained"
          onClick={handleNext}
          data-testid="next"
          disabled={!formData.gameMode}
          size="large"
        >
          <Trans i18nKey="next" />
        </Button>
      </ButtonRow>
    </Box>
  );
}
