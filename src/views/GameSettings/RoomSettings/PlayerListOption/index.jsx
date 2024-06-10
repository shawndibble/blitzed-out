import { Help } from '@mui/icons-material';
import { Stack, Switch, Tooltip, Typography } from '@mui/material';
import { t } from 'i18next';
import React from 'react';
import { useCallback } from 'react';
import { Trans } from 'react-i18next';

export default function PlayerListOption({ formData, setFormData }) {
  const togglePlayerListOption = useCallback(() => {
    setFormData({
      ...formData,
      roomRealtime: !formData.roomRealtime,
      roomUpdated: true,
    });
  }, [formData, setFormData]);

  return (
    <>
      <Typography>
        <Trans i18nKey="playerListOptions" />
      </Typography>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="center"
        sx={{ width: '100%' }}
      >
        <Typography>
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
          <Help sx={{ fontSize: 15 }} />
        </Tooltip>
        <Switch
          id="showPrivate"
          checked={!!formData.roomRealtime}
          onChange={togglePlayerListOption}
          inputProps={{ 'aria-label': t('playerList') }}
        />
        <Typography>
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
          <Help sx={{ fontSize: 15 }} />
        </Tooltip>
      </Stack>
    </>
  );
}
