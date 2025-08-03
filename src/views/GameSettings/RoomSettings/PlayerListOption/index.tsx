import { Help } from '@mui/icons-material';
import { Box, FormControlLabel, Stack, Switch, Tooltip, Typography } from '@mui/material';
import { t } from 'i18next';
import { useCallback } from 'react';
import { Trans } from 'react-i18next';
import { Settings } from '@/types/Settings';

interface PlayerListOptionProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
}

export default function PlayerListOption({
  formData,
  setFormData,
}: PlayerListOptionProps): JSX.Element {
  const togglePlayerListOption = useCallback(() => {
    setFormData({
      ...formData,
      roomRealtime: !formData.roomRealtime,
      roomUpdated: true,
    });
  }, [formData, setFormData]);

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
        <Trans i18nKey="playerListOptions" />
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              <Trans i18nKey="realtime" />
            </Typography>
            <Tooltip
              title={
                <Typography variant="subtitle2">
                  <Trans i18nKey="realtimeTooltip" />
                </Typography>
              }
              arrow
            >
              <Help sx={{ fontSize: 16, color: 'text.secondary' }} />
            </Tooltip>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={!!formData.roomRealtime}
                onChange={togglePlayerListOption}
                inputProps={{ 'aria-label': t('playerList') }}
              />
            }
            label=""
            sx={{ margin: 0 }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              <Trans i18nKey="delayed" />
            </Typography>
            <Tooltip
              title={
                <Typography variant="subtitle2">
                  <Trans i18nKey="delayedTooltip" />
                </Typography>
              }
              arrow
            >
              <Help sx={{ fontSize: 16, color: 'text.secondary' }} />
            </Tooltip>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
