import { Help } from '@mui/icons-material';
import { Tooltip, Typography } from '@mui/material';
import { Trans } from 'react-i18next';
import React from 'react';

export default function IntensityTitle(): JSX.Element {
  return (
    <Typography variant="h6" sx={{ mt: 2 }}>
      <Trans i18nKey="setIntensityLevel" />
      <Tooltip title={<Trans i18nKey="intensityTooltip" />} arrow sx={{ ml: 1 }}>
        <Help fontSize="15" />
      </Tooltip>
    </Typography>
  );
}
