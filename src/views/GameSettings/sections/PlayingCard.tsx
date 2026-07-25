import {
  Box,
  IconButton,
  Popover,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';
import { useTranslation } from 'react-i18next';
import { isPublicRoom } from '@/helpers/strings';
import { GameMode, Settings } from '@/types/Settings';
import { JSX, MouseEvent, useState } from 'react';
import { SettingGroup, SettingRow } from '../components/SettingRow';

interface PlayingCardProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
  /** Supplies the room to join when a group mode needs one: the user's last
   * private room if they have one this visit, else a fresh code. */
  getPrivateRoom: () => string;
}

/**
 * Players & Devices — title, explainer, and the Solo/With Others/Shared
 * Device control, all in one card, styled identically to every other
 * settings row (SettingGroup/SettingRow) so type sizes, control sizing, and
 * the label-left/control-right layout match exactly. Sticky below the page
 * header: every section below filters its rows to whichever mode is
 * selected here, so it stays reachable while scrolling instead of only
 * living inline in place.
 *
 * Topology invariant: only Solo may use the public room. Selecting a group
 * mode from a public room generates a private room on the spot — the Room
 * section states the result instead of asking.
 */
export default function PlayingCard({
  formData,
  setFormData,
  getPrivateRoom,
}: PlayingCardProps): JSX.Element {
  const { t } = useTranslation();
  const [infoAnchor, setInfoAnchor] = useState<HTMLElement | null>(null);

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
        position: 'sticky',
        // Matches the page header's own height (title bar, + chip row on mobile).
        top: { xs: 96, sm: 72 },
        zIndex: 5,
        // Pulled up to match the gap between consecutive SettingGroup cards
        // elsewhere on the page (RoomSection's gap: 2), not the section's
        // larger between-section spacing.
        mt: -2,
        mb: 3,
      }}
    >
      <SettingGroup>
        <SettingRow
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {t('playing')}
              <IconButton
                size="small"
                aria-label={t('playersDevicesInfoLabel')}
                onClick={(event: MouseEvent<HTMLElement>) => setInfoAnchor(event.currentTarget)}
              >
                <HelpOutlineIcon fontSize="inherit" />
              </IconButton>
              <Popover
                open={Boolean(infoAnchor)}
                anchorEl={infoAnchor}
                onClose={() => setInfoAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              >
                <Stack spacing={1} sx={{ p: 2, maxWidth: 320 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {t('modeBarHint')}
                  </Typography>
                  <Typography variant="body2">{t('playersDevicesSoloDesc')}</Typography>
                  <Typography variant="body2">{t('playersDevicesWithOthersDesc')}</Typography>
                  <Typography variant="body2">{t('playersDevicesSharedDeviceDesc')}</Typography>
                </Stack>
              </Popover>
            </Box>
          }
        >
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
        </SettingRow>
      </SettingGroup>
    </Box>
  );
}
