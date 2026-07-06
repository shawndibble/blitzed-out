import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { isPublicRoom } from '@/helpers/strings';
import { GameMode, Settings } from '@/types/Settings';
import { JSX } from 'react';

interface ModeBarProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
  /** Supplies the room to join when a group mode needs one: the user's last
   * private room if they have one this visit, else a fresh code. */
  getPrivateRoom: () => string;
}

/**
 * Global play-style selector. Pinned above all settings sections; every
 * section filters its rows to the selected mode.
 *
 * Topology invariant: only Solo may use the public room. Selecting a group
 * mode from a public room generates a private room on the spot — the Room
 * section states the result instead of asking.
 */
export default function ModeBar({
  formData,
  setFormData,
  getPrivateRoom,
}: ModeBarProps): JSX.Element {
  const { t } = useTranslation();

  const applyMode = (_: unknown, mode: GameMode | null): void => {
    if (!mode || mode === formData.gameMode) return;

    const needsPrivateRoom = mode !== 'solo' && isPublicRoom(formData.room);
    // First visit to With Others defaults to partnered play; an explicit
    // participation choice is remembered across mode switches.
    const needsParticipationDefault = mode === 'online' && formData.soloPlay === undefined;
    setFormData({
      ...formData,
      gameMode: mode,
      ...(needsPrivateRoom && { room: getPrivateRoom() }),
      ...(needsParticipationDefault && { soloPlay: false }),
      boardUpdated: true,
    });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap',
        py: 1,
        px: { xs: 2, sm: 3 },
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Typography
        variant="overline"
        sx={{ color: 'text.secondary', lineHeight: 1, letterSpacing: '0.1em' }}
      >
        {t('playing')}
      </Typography>
      <ToggleButtonGroup
        value={formData.gameMode}
        exclusive
        size="small"
        onChange={applyMode}
        aria-label={t('playing')}
      >
        <ToggleButton value="solo">{t('solo')}</ToggleButton>
        <ToggleButton value="online">{t('playStyleWithOthers')}</ToggleButton>
        <ToggleButton value="local">{t('playStyleSharedDevice')}</ToggleButton>
      </ToggleButtonGroup>
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', display: { xs: 'none', md: 'block' } }}
      >
        {t('modeBarHint')}
      </Typography>
    </Box>
  );
}
