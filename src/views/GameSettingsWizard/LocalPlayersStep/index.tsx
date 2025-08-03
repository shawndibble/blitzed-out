import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Fade,
  Grid,
  Stack,
} from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import ButtonRow from '@/components/ButtonRow';
import LocalPlayerSetup from '@/components/LocalPlayerSetup';
import { useLocalPlayers } from '@/hooks/useLocalPlayers';
import type { LocalPlayer, LocalSessionSettings } from '@/types';

interface LocalPlayersStepProps {
  formData: any; // Using any to avoid type conflicts with Settings intersection
  setFormData: (data: any) => void; // Using any to avoid type conflicts
  nextStep: () => void;
  prevStep: () => void;
}

/**
 * LocalPlayersStep allows users to optionally set up local players for single-device multiplayer
 * Only appears in private rooms and provides option to skip
 */
export default function LocalPlayersStep({
  formData,
  setFormData,
  nextStep,
  prevStep,
}: LocalPlayersStepProps): JSX.Element {
  const { t } = useTranslation();
  const { hasLocalPlayers, clearLocalSession } = useLocalPlayers();

  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  // Check if this is a private room
  const isPrivateRoom = formData.room !== 'PUBLIC';

  const handleStartLocalSetup = useCallback(() => {
    setIsSetupOpen(true);
    setSetupError(null);
  }, []);

  const handleSkipLocalPlayers = useCallback(() => {
    // Clear any existing local session
    if (hasLocalPlayers) {
      clearLocalSession();
    }

    // Explicitly clear all local player configuration to ensure single-player flow
    setFormData((prev: any) => ({
      ...prev,
      hasLocalPlayers: false,
      localPlayersData: undefined,
      localPlayerSessionSettings: undefined,
      // Also ensure we don't have any lingering local mode settings that would skip questions
      gameMode: prev.gameMode === 'local' ? 'online' : prev.gameMode,
    }));

    nextStep();
  }, [hasLocalPlayers, clearLocalSession, nextStep, setFormData]);

  const handleLocalSetupComplete = useCallback(
    async (players: LocalPlayer[], settings: LocalSessionSettings) => {
      try {
        // Store local player configuration in form data for later use
        setFormData({
          ...formData,
          localPlayersData: players,
          localPlayerSessionSettings: settings,
          hasLocalPlayers: true,
        });

        setIsSetupOpen(false);
        nextStep();
      } catch (error) {
        setSetupError(
          error instanceof Error ? error.message : 'Failed to save local player configuration'
        );
      }
    },
    [formData, setFormData, nextStep]
  );

  const handleLocalSetupCancel = useCallback(() => {
    setIsSetupOpen(false);
    setSetupError(null);
  }, []);

  // Auto-advance for non-private rooms, but with a delay to prevent navigation conflicts
  useEffect(() => {
    if (!isPrivateRoom) {
      const timer = setTimeout(() => {
        nextStep();
      }, 100); // Small delay to prevent render conflicts

      return () => clearTimeout(timer);
    }
  }, [isPrivateRoom, nextStep]);

  // If not a private room, show a loading message
  if (!isPrivateRoom) {
    return (
      <Box
        sx={{
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" color="text.secondary">
          {t(
            'localPlayersStep.publicRoomMessage',
            'Local players are not available for public rooms. Continuing...'
          )}
        </Typography>
      </Box>
    );
  }

  // Show the local player setup component when open
  if (isSetupOpen) {
    return (
      <Fade in={true}>
        <Box>
          {setupError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {setupError}
            </Alert>
          )}

          <LocalPlayerSetup
            roomId={formData.room || 'PRIVATE'}
            isPrivateRoom={isPrivateRoom}
            onComplete={handleLocalSetupComplete}
            onCancel={handleLocalSetupCancel}
            initialPlayers={(formData as any).localPlayersData}
            initialSettings={(formData as any).localPlayerSessionSettings}
          />
        </Box>
      </Fade>
    );
  }

  // Show the choice screen
  return (
    <Box sx={{ minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        <Trans i18nKey="localPlayersStep.title" />
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        <Trans i18nKey="localPlayersStep.subtitle" />
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Option 1: Set up local players - Now deselected by default */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card
            sx={{
              cursor: 'pointer',
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.paper',
              transition: 'all 0.2s ease-in-out',
              height: '100%',
              '&:hover': {
                borderColor: 'primary.main',
                transform: 'translateY(-2px)',
                boxShadow: 2,
              },
            }}
            onClick={handleStartLocalSetup}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={1} alignItems="center" textAlign="center">
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  <Trans i18nKey="localPlayersStep.setupOption.title" />
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <Trans i18nKey="localPlayersStep.setupOption.description" />
                </Typography>

                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  sx={{ mt: 2 }}
                  data-testid="localPlayersStep.setupOption.button"
                >
                  {t('localPlayersStep.setupOption.button')}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Option 2: Skip local players - Remove "selected" status but keep it as an option */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card
            sx={{
              cursor: 'pointer',
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.paper',
              transition: 'all 0.2s ease-in-out',
              height: '100%',
              '&:hover': {
                borderColor: 'primary.main',
                transform: 'translateY(-2px)',
                boxShadow: 2,
              },
            }}
            onClick={handleSkipLocalPlayers}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={1} alignItems="center" textAlign="center">
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  <Trans i18nKey="localPlayersStep.skipOption.title" />
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <Trans i18nKey="localPlayersStep.skipOption.description" />
                </Typography>

                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  sx={{ mt: 2 }}
                  data-testid="localPlayersStep.skipOption.button"
                >
                  {t('localPlayersStep.skipOption.button')}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Current local player status */}
      {hasLocalPlayers && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <Trans i18nKey="localPlayersStep.currentStatus.hasPlayers" />
          </Typography>
        </Alert>
      )}

      <Box sx={{ flexGrow: 1 }} />
      <ButtonRow>
        <Button onClick={prevStep}>
          <Trans i18nKey="previous" />
        </Button>
        <Button variant="contained" onClick={handleSkipLocalPlayers}>
          <Trans i18nKey="skip" />
        </Button>
      </ButtonRow>
    </Box>
  );
}
