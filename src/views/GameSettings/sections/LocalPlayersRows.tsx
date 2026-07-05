import { Box, Button, Chip, IconButton, Switch, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { JSX, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingGroup, SettingRow } from '../components/SettingRow';
import PlayerForm from '@/components/LocalPlayerSetup/PlayerForm';
import PlayerGenderAvatar from '@/components/PlayerGenderAvatar';
import { useLocalPlayers } from '@/hooks/useLocalPlayers';
import type { LocalPlayer, LocalSessionSettings } from '@/types';

const DEFAULT_SESSION_SETTINGS: LocalSessionSettings = {
  showTurnTransitions: true,
  enableTurnSounds: true,
  showPlayerAvatars: true,
};

const MIN_PLAYERS = 2;

interface LocalPlayersRowsProps {
  roomId: string;
}

/**
 * Inline shared-device player management: every player is a row, add/edit
 * happens in place, and changes save as you make them — no setup-wizard
 * ceremony (Finalize/Cancel) inside the settings page.
 */
export default function LocalPlayersRows({ roomId }: LocalPlayersRowsProps): JSX.Element {
  const { t } = useTranslation();
  const { localPlayers, sessionSettings, createLocalSession, clearLocalSession } =
    useLocalPlayers();

  // Draft mirrors the stored session; edits below the minimum player count
  // stay local so nothing half-configured hits the store.
  const [draft, setDraft] = useState<LocalPlayer[]>(localPlayers);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<LocalPlayer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const settings = sessionSettings ?? DEFAULT_SESSION_SETTINGS;

  const persist = useCallback(
    async (players: LocalPlayer[], nextSettings: LocalSessionSettings = settings) => {
      setDraft(players);
      setError(null);
      try {
        if (players.length >= MIN_PLAYERS) {
          await createLocalSession(roomId, players, nextSettings);
        } else if (players.length === 0) {
          await clearLocalSession();
        }
        // 1 player: keep as draft only; the caption explains the minimum.
      } catch (persistError) {
        setError(persistError instanceof Error ? persistError.message : t('localPlayersSaveError'));
      }
    },
    [roomId, settings, createLocalSession, clearLocalSession, t]
  );

  const reorder = (players: LocalPlayer[]): LocalPlayer[] =>
    players.map((player, index) => ({ ...player, order: index }));

  const handleFormSubmit = (playerData: Partial<LocalPlayer>): void => {
    let next: LocalPlayer[];
    if (editingPlayer) {
      next = draft.map((player) =>
        player.id === editingPlayer.id ? { ...player, ...playerData } : player
      );
    } else {
      const newPlayer: LocalPlayer = {
        id: `local-${Date.now()}-${draft.length}`,
        name: playerData.name || '',
        gender: playerData.gender,
        role: playerData.role || 'vers',
        order: draft.length,
        isActive: draft.length === 0,
        ...playerData,
      } as LocalPlayer;
      next = [...draft, newPlayer];
    }
    setFormOpen(false);
    setEditingPlayer(null);
    persist(reorder(next));
  };

  const handleRemove = (id: string): void => {
    persist(reorder(draft.filter((player) => player.id !== id)));
  };

  const handleMove = (index: number, direction: -1 | 1): void => {
    const target = index + direction;
    if (target < 0 || target >= draft.length) return;
    const next = [...draft];
    [next[index], next[target]] = [next[target], next[index]];
    persist(reorder(next));
  };

  const handleSettingChange = (key: keyof LocalSessionSettings, value: boolean): void => {
    persist(draft, { ...settings, [key]: value });
  };

  return (
    <>
      <SettingGroup>
        {draft.map((player, index) => (
          <Box
            key={player.id}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1 }}
          >
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums', minWidth: 18 }}
            >
              #{index + 1}
            </Typography>
            <PlayerGenderAvatar gender={player.gender} isActive={player.isActive} size={28} />
            <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 0, flex: 1 }} noWrap>
              {player.name}
            </Typography>
            <Chip label={t(`roles.${player.role}`)} size="small" variant="outlined" />
            {player.isActive && (
              <Chip
                label={t('localPlayerSettings.players.currentTurn')}
                color="primary"
                size="small"
              />
            )}
            <IconButton
              size="small"
              onClick={() => handleMove(index, -1)}
              disabled={index === 0}
              aria-label={t('movePlayerUp', { name: player.name })}
            >
              <ArrowUpwardIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleMove(index, 1)}
              disabled={index === draft.length - 1}
              aria-label={t('movePlayerDown', { name: player.name })}
            >
              <ArrowDownwardIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <Tooltip title={t('editPlayer', { name: player.name })}>
              <IconButton
                size="small"
                onClick={() => {
                  setEditingPlayer(player);
                  setFormOpen(true);
                }}
                aria-label={t('editPlayer', { name: player.name })}
              >
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('removePlayer', { name: player.name })}>
              <IconButton
                size="small"
                onClick={() => handleRemove(player.id)}
                aria-label={t('removePlayer', { name: player.name })}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        ))}

        <Box sx={{ px: 2, py: 1 }}>
          <Button
            fullWidth
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingPlayer(null);
              setFormOpen(true);
            }}
            sx={{ border: '1px dashed', borderColor: 'primary.main', borderRadius: 2, py: 0.75 }}
          >
            {t('addPlayer')}
          </Button>
          {draft.length < MIN_PLAYERS && (
            <Typography
              variant="caption"
              sx={{ color: 'warning.main', display: 'block', mt: 0.75 }}
            >
              {t('minPlayersHint', { count: MIN_PLAYERS })}
            </Typography>
          )}
          {error && (
            <Typography variant="caption" sx={{ color: 'error.main', display: 'block', mt: 0.5 }}>
              {error}
            </Typography>
          )}
        </Box>

        <SettingRow label={t('localPlayerSettings.settings.showTurnTransitions')}>
          <Switch
            checked={settings.showTurnTransitions}
            onChange={(event) => handleSettingChange('showTurnTransitions', event.target.checked)}
            slotProps={{
              input: { 'aria-label': t('localPlayerSettings.settings.showTurnTransitions') },
            }}
          />
        </SettingRow>
        <SettingRow label={t('localPlayerSettings.settings.playTurnSounds')}>
          <Switch
            checked={settings.enableTurnSounds}
            onChange={(event) => handleSettingChange('enableTurnSounds', event.target.checked)}
            slotProps={{
              input: { 'aria-label': t('localPlayerSettings.settings.playTurnSounds') },
            }}
          />
        </SettingRow>
      </SettingGroup>

      <PlayerForm
        open={formOpen}
        player={editingPlayer}
        existingPlayers={draft}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setFormOpen(false);
          setEditingPlayer(null);
        }}
      />
    </>
  );
}
