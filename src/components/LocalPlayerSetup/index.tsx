import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, Typography, Box, Button, Alert, Fab } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Trans, useTranslation } from 'react-i18next';
import type { LocalPlayer, LocalSessionSettings } from '@/types';
import type { PlayerRole } from '@/types/Settings';
import PlayerCard from './PlayerCard';
import PlayerForm from './PlayerForm';

interface LocalPlayerSetupProps {
  /** Room ID for the session */
  roomId: string;
  /** Whether this is a private room (required for local players) */
  isPrivateRoom: boolean;
  /** Callback when setup is completed successfully */
  onComplete: (players: LocalPlayer[], settings: LocalSessionSettings) => void;
  /** Callback when setup is cancelled */
  onCancel: () => void;
  /** Initial players data to restore from previous setup */
  initialPlayers?: LocalPlayer[];
  /** Initial session settings to restore from previous setup */
  initialSettings?: LocalSessionSettings;
}

/**
 * Setup wizard for configuring local players in single-device multiplayer mode
 * Only available in private rooms to maintain social nature of local play
 */
export default function LocalPlayerSetup({
  roomId,
  isPrivateRoom,
  onComplete,
  onCancel,
  initialPlayers = [],
  initialSettings,
}: LocalPlayerSetupProps): JSX.Element {
  const { t } = useTranslation();

  // roomId will be used in Phase 2 for session creation - stored for future use
  console.debug('Setting up local players for room:', roomId);

  // Component state for player management
  const [players, setPlayers] = useState<LocalPlayer[]>(initialPlayers);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Player form state
  const [isPlayerFormOpen, setIsPlayerFormOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<LocalPlayer | null>(null);

  // Session settings state (setSessionSettings will be used in advanced settings)
  const [sessionSettings] = useState<LocalSessionSettings>(
    initialSettings || {
      showTurnTransitions: true,
      enableTurnSounds: true,
      showPlayerAvatars: true,
    }
  );

  // Validation logic
  const validateSetup = useCallback(() => {
    const isValidPlayerCount = players.length >= 2 && players.length <= 4;
    const hasAllNames = players.every((player) => player.name.trim().length > 0);
    const hasUniqueNames =
      new Set(players.map((p) => p.name.toLowerCase())).size === players.length;

    const valid = isValidPlayerCount && hasAllNames && hasUniqueNames;
    setIsValid(valid);

    // Set appropriate error message
    if (players.length < 2) {
      setError(t('localPlayers.errors.minimumPlayers'));
    } else if (players.length > 4) {
      setError(t('localPlayers.errors.maximumPlayers'));
    } else if (!hasAllNames) {
      setError(t('localPlayers.errors.emptyNames'));
    } else if (!hasUniqueNames) {
      setError(t('localPlayers.errors.duplicateNames'));
    } else {
      setError(null);
    }

    return valid;
  }, [players, t]);

  // Initialize players state only once when component mounts
  useEffect(() => {
    if (initialPlayers.length > 0) {
      setPlayers(initialPlayers);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update validation when players change
  useEffect(() => {
    validateSetup();
  }, [validateSetup]);

  // Helper functions for player management
  const generatePlayerId = useCallback(() => {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const generateDefaultName = useCallback(() => {
    return t('localPlayers.defaultPlayerName', { number: players.length + 1 });
  }, [players.length, t]);

  const addPlayer = useCallback(() => {
    if (players.length >= 4) return;

    // Open form for new player
    setEditingPlayer(null);
    setIsPlayerFormOpen(true);
  }, [players.length]);

  const removePlayer = useCallback((playerId: string) => {
    setPlayers((prev) => {
      const filtered = prev.filter((p) => p.id !== playerId);
      // Reorder remaining players
      return filtered.map((player, index) => ({
        ...player,
        order: index,
        isActive: index === 0, // First player is active
      }));
    });
  }, []);

  const updatePlayer = useCallback((playerId: string, updates: Partial<LocalPlayer>) => {
    setPlayers((prev) =>
      prev.map((player) => (player.id === playerId ? { ...player, ...updates } : player))
    );
  }, []);

  const handlePlayerRoleChange = useCallback(
    (playerId: string, role: PlayerRole) => {
      updatePlayer(playerId, { role });
    },
    [updatePlayer]
  );

  const handlePlayerEdit = useCallback((player: LocalPlayer) => {
    setEditingPlayer(player);
    setIsPlayerFormOpen(true);
  }, []);

  // Handle form submission
  const handlePlayerFormSubmit = useCallback(
    async (playerData: Partial<LocalPlayer>) => {
      if (editingPlayer) {
        // Update existing player
        updatePlayer(editingPlayer.id, playerData);
      } else {
        // Create new player
        const newPlayer: LocalPlayer = {
          id: generatePlayerId(),
          name: playerData.name || generateDefaultName(),
          role: playerData.role || 'vers',
          order: players.length,
          isActive: players.length === 0, // First player is active
          deviceId: 'current_device',
          location: 0, // Start at beginning of board
          isFinished: false, // Not finished yet
        };
        setPlayers((prev) => [...prev, newPlayer]);
      }

      // Close form
      setIsPlayerFormOpen(false);
      setEditingPlayer(null);
    },
    [editingPlayer, updatePlayer, generatePlayerId, generateDefaultName, players.length]
  );

  // Handle form cancellation
  const handlePlayerFormCancel = useCallback(() => {
    setIsPlayerFormOpen(false);
    setEditingPlayer(null);
  }, []);

  // Handle completion
  const handleComplete = useCallback(async () => {
    if (!validateSetup()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Call parent completion handler with players and settings
      await onComplete(players, sessionSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('localPlayers.errors.sessionCreation'));
    } finally {
      setIsLoading(false);
    }
  }, [players, sessionSettings, validateSetup, onComplete, t]);

  // Handle cancellation
  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  // If not a private room, show error message
  if (!isPrivateRoom) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">
            <Typography>
              <Trans i18nKey="localPlayers.privateRoomRequired" />
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Typography variant="h5" component="h2">
            <Trans i18nKey="localPlayers.setupTitle" />
          </Typography>
        }
        subheader={
          <Typography variant="body2" color="text.secondary">
            <Trans i18nKey="localPlayers.setupSubtitle" />
          </Typography>
        }
      />
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Player list */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="h6">
              <Trans i18nKey="localPlayers.playersTitle" />
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('localPlayers.playersCount', { count: players.length })}
            </Typography>
          </Box>

          {players.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 4,
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'action.hover',
              }}
            >
              <Typography variant="body1" color="text.secondary" gutterBottom>
                <Trans i18nKey="localPlayers.noPlayersYet" />
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={addPlayer}>
                <Trans i18nKey="localPlayers.addFirstPlayer" />
              </Button>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {players.map((player, index) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    index={index}
                    isActive={player.isActive}
                    canEdit={true}
                    canDelete={players.length > 1}
                    onEdit={handlePlayerEdit}
                    onDelete={removePlayer}
                    onRoleChange={handlePlayerRoleChange}
                  />
                ))}
              </Box>

              {players.length < 4 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Fab size="small" color="primary" onClick={addPlayer} aria-label="Add player">
                    <AddIcon />
                  </Fab>
                </Box>
              )}
            </>
          )}
        </Box>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={handleCancel} disabled={isLoading}>
            <Trans i18nKey="cancel" />
          </Button>
          <Button variant="contained" onClick={handleComplete} disabled={!isValid || isLoading}>
            {isLoading ? (
              <Trans i18nKey="localPlayers.creatingSession" />
            ) : (
              <Trans i18nKey="localPlayers.startSession" />
            )}
          </Button>
        </Box>
      </CardContent>

      {/* Player Form Dialog */}
      <PlayerForm
        open={isPlayerFormOpen}
        player={editingPlayer}
        existingPlayers={players}
        onSubmit={handlePlayerFormSubmit}
        onCancel={handlePlayerFormCancel}
      />
    </Card>
  );
}
