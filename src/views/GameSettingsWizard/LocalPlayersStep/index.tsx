import { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Alert, Button, Fab } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Trans, useTranslation } from 'react-i18next';
import ButtonRow from '@/components/ButtonRow';
import PlayerCard from '@/components/LocalPlayerSetup/PlayerCard';
import PlayerForm from '@/components/LocalPlayerSetup/PlayerForm';
import type { LocalPlayer, LocalSessionSettings } from '@/types';
import type { PlayerRole } from '@/types/Settings';

interface LocalPlayersStepProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  nextStep: () => void;
  prevStep: () => void;
}

export default function LocalPlayersStep({
  formData,
  setFormData,
  nextStep,
  prevStep,
}: LocalPlayersStepProps): JSX.Element {
  const { t } = useTranslation();

  const [players, setPlayers] = useState<LocalPlayer[]>((formData as any).localPlayersData || []);
  const [error, setError] = useState<string | null>(null);
  const [isPlayerFormOpen, setIsPlayerFormOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<LocalPlayer | null>(null);

  const sessionSettings: LocalSessionSettings = (formData as any).localPlayerSessionSettings || {
    showTurnTransitions: true,
    enableTurnSounds: true,
    showPlayerAvatars: true,
  };

  const isValidPlayerCount = players.length >= 2 && players.length <= 4;
  const hasAllNames = players.every((p) => p.name.trim().length > 0);
  const hasUniqueNames =
    new Set(players.map((p) => p.name.trim().toLowerCase())).size === players.length;
  const isValid = isValidPlayerCount && hasAllNames && hasUniqueNames;

  useEffect(() => {
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
  }, [players, hasAllNames, hasUniqueNames, t]);

  const generatePlayerId = useCallback(() => {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const generateDefaultName = useCallback(() => {
    return t('localPlayers.defaultPlayerName', { number: players.length + 1 });
  }, [players.length, t]);

  const addPlayer = useCallback(() => {
    if (players.length >= 4) return;
    setEditingPlayer(null);
    setIsPlayerFormOpen(true);
  }, [players.length]);

  const removePlayer = useCallback((playerId: string) => {
    setPlayers((prev) => {
      const filtered = prev.filter((p) => p.id !== playerId);
      return filtered.map((player, index) => ({
        ...player,
        order: index,
        isActive: index === 0,
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

  const handlePlayerFormSubmit = useCallback(
    async (playerData: Partial<LocalPlayer>) => {
      if (editingPlayer) {
        updatePlayer(editingPlayer.id, playerData);
      } else {
        const newPlayer: LocalPlayer = {
          id: generatePlayerId(),
          name: playerData.name || generateDefaultName(),
          role: playerData.role || 'vers',
          gender: playerData.gender || 'non-binary',
          order: players.length,
          isActive: players.length === 0,
          deviceId: 'current_device',
          location: 0,
          isFinished: false,
          sound: playerData.sound,
        };
        setPlayers((prev) => [...prev, newPlayer]);
      }
      setIsPlayerFormOpen(false);
      setEditingPlayer(null);
    },
    [editingPlayer, updatePlayer, generatePlayerId, generateDefaultName, players.length]
  );

  const handlePlayerFormCancel = useCallback(() => {
    setIsPlayerFormOpen(false);
    setEditingPlayer(null);
  }, []);

  const handleNext = useCallback(() => {
    if (!isValid) return;
    setFormData((prev: any) => ({
      ...prev,
      localPlayersData: players,
      localPlayerSessionSettings: sessionSettings,
      hasLocalPlayers: true,
    }));
    nextStep();
  }, [isValid, players, sessionSettings, setFormData, nextStep]);

  return (
    <Box sx={{ minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
        <Trans i18nKey="localPlayersStep.title" />
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          mb: 3,
        }}
      >
        <Trans i18nKey="localPlayersStep.subtitle" />
      </Typography>
      {error && (
        <Alert severity={players.length === 0 ? 'info' : 'error'} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            <Trans i18nKey="localPlayers.playersTitle" />
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
            }}
          >
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
            <Typography
              variant="body1"
              gutterBottom
              sx={{
                color: 'text.secondary',
              }}
            >
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
                <Fab
                  size="small"
                  color="primary"
                  onClick={addPlayer}
                  aria-label={t('localPlayers.addFirstPlayer')}
                >
                  <AddIcon />
                </Fab>
              </Box>
            )}
          </>
        )}
      </Box>
      <Box sx={{ flexGrow: 1 }} />
      <ButtonRow>
        <Button onClick={prevStep}>
          <Trans i18nKey="previous" />
        </Button>
        <Button variant="contained" disabled={!isValid} onClick={handleNext}>
          <Trans i18nKey="next" />
        </Button>
      </ButtonRow>
      <PlayerForm
        open={isPlayerFormOpen}
        player={editingPlayer}
        existingPlayers={players}
        onSubmit={handlePlayerFormSubmit}
        onCancel={handlePlayerFormCancel}
      />
    </Box>
  );
}
