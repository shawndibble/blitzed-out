import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  People as PeopleIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayArrowIcon,
  Edit as EditIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { Trans, useTranslation } from 'react-i18next';
import { useLocalPlayers } from '@/hooks/useLocalPlayers';
import LocalPlayerSetup from '@/components/LocalPlayerSetup';
import type { LocalPlayer, LocalSessionSettings } from '@/types';

interface LocalPlayerSettingsProps {
  roomId?: string;
  isPrivateRoom?: boolean;
}

/**
 * LocalPlayerSettings provides standalone local player management within the main settings interface
 * Allows users to view, edit, and manage their local player configuration
 */
export default function LocalPlayerSettings({
  roomId = 'PRIVATE',
  isPrivateRoom = true,
}: LocalPlayerSettingsProps): JSX.Element {
  const { t } = useTranslation();
  const {
    localPlayers,
    hasLocalPlayers,
    session,
    sessionSettings,
    clearLocalSession,
    updateSettings,
  } = useLocalPlayers();

  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
    setError(null);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setError(null);
  }, []);

  const handleSetupComplete = useCallback(
    async (_players: LocalPlayer[], _settings: LocalSessionSettings) => {
      try {
        setIsEditing(false);
        setError(null);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : 'Failed to save local player configuration'
        );
      }
    },
    []
  );

  const handleClearSession = useCallback(async () => {
    try {
      await clearLocalSession();
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to clear local session');
    }
  }, [clearLocalSession]);

  const handleSettingChange = useCallback(
    async (settingKey: keyof LocalSessionSettings, value: boolean) => {
      if (!sessionSettings) return;

      try {
        const updatedSettings = {
          ...sessionSettings,
          [settingKey]: value,
        };
        await updateSettings(updatedSettings);
        setError(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to update settings');
      }
    },
    [sessionSettings, updateSettings]
  );

  // Show setup component when editing
  if (isEditing) {
    return (
      <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <LocalPlayerSetup
          roomId={roomId}
          isPrivateRoom={isPrivateRoom}
          onComplete={handleSetupComplete}
          onCancel={handleCancelEdit}
          initialPlayers={localPlayers}
          initialSettings={sessionSettings}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <PeopleIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h6" component="h3">
          <Trans i18nKey="localPlayerSettings.title" />
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!hasLocalPlayers ? (
        /* No Local Players State */
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <PeopleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary" paragraph>
                <Trans i18nKey="localPlayerSettings.noPlayers.description" />
              </Typography>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={handleStartEdit}
                size="large"
              >
                <Trans i18nKey="localPlayerSettings.noPlayers.setupButton" />
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        /* Active Local Players State */
        <Box>
          {/* Session Overview */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Typography variant="subtitle1" component="h4">
                  <Trans i18nKey="localPlayerSettings.session.title" />
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                {localPlayers.map((player) => (
                  <Box
                    key={player.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1,
                      borderRadius: 1,
                      bgcolor: player.isActive ? 'primary.50' : 'background.default',
                      border: player.isActive ? '1px solid' : '1px solid transparent',
                      borderColor: player.isActive ? 'primary.main' : 'transparent',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        #{player.order + 1}
                      </Typography>
                      <Typography variant="body1" fontWeight={player.isActive ? 'bold' : 'normal'}>
                        {player.name}
                      </Typography>
                      <Chip label={t(`roles.${player.role}`)} size="small" variant="outlined" />
                    </Box>
                    {player.isActive && (
                      <Chip
                        label={t('localPlayerSettings.players.currentTurn')}
                        color="primary"
                        size="small"
                      />
                    )}
                  </Box>
                ))}
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleStartEdit}
                  size="small"
                >
                  <Trans i18nKey="localPlayerSettings.session.editButton" />
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<ClearIcon />}
                  onClick={handleClearSession}
                  size="small"
                >
                  <Trans i18nKey="localPlayerSettings.session.clearButton" />
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Session Settings */}
          {session?.settings && (
            <Card variant="outlined" sx={{ mt: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <SettingsIcon sx={{ color: 'text.secondary' }} />
                  <Typography variant="subtitle1" component="h4">
                    <Trans i18nKey="localPlayerSettings.settings.title" />
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={session.settings.showTurnTransitions}
                        onChange={(e) =>
                          handleSettingChange('showTurnTransitions', e.target.checked)
                        }
                      />
                    }
                    label={t('localPlayerSettings.settings.showTurnTransitions')}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={session.settings.enableTurnSounds}
                        onChange={(e) => handleSettingChange('enableTurnSounds', e.target.checked)}
                      />
                    }
                    label={t('localPlayerSettings.settings.playTurnSounds')}
                  />
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      )}
    </Box>
  );
}
