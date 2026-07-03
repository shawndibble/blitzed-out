import { Box, Card, CardContent, Grid, Stack, Tooltip, Typography, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
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
      // Preserve an existing private solo room; default newcomers to PUBLIC.
      const keepPrivate = prev.gameMode === 'solo' && prev.room !== 'PUBLIC';
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
    // Solo skips the room/local-players screen entirely.
    nextStep(2);
  };

  const selectSharedDevice = () => {
    setFormData((prev) => ({
      ...prev,
      gameMode: 'local',
      soloPlay: false,
      room: generateRoomCode(),
      roomRealtime: false,
    }));
    nextStep();
  };

  const selectIndividualDevices = () => {
    if (offline) return;

    setFormData((prev) => ({
      ...prev,
      gameMode: 'online',
      soloPlay: true,
      room: generateRoomCode(),
      roomRealtime: false,
      hasLocalPlayers: false,
      localPlayersData: undefined,
      localPlayerSessionSettings: undefined,
    }));
    nextStep();
  };

  const cards = [
    {
      id: 'solo',
      title: t('playerTopology.solo.title', 'Solo'),
      description: t('playerTopology.solo.description', 'Play by yourself on this device.'),
      selected: formData.gameMode === 'solo',
      onClick: selectSolo,
    },
    {
      id: 'local',
      title: t('playerTopology.shared.title', 'Shared Device'),
      description: t(
        'playerTopology.shared.description',
        'Pass one device around with 2-4 local players.'
      ),
      selected: formData.gameMode === 'local',
      onClick: selectSharedDevice,
    },
    {
      id: 'online',
      title: t('playerTopology.online.title', 'Individual Devices'),
      description: t(
        'playerTopology.online.description',
        'Each player joins from their own phone, tablet, or computer.'
      ),
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
        {t('playerTopology.title', 'How are you playing?')}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: 'text.secondary',
          textAlign: 'center',
          mb: 3,
        }}
      >
        {t(
          'playerTopology.subtitle',
          'Choose the player setup first. Room settings come next when needed.'
        )}
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
    </Box>
  );
}
