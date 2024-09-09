import { Help } from '@mui/icons-material';
import { Tooltip, Typography } from '@mui/material';
import { Trans } from 'react-i18next';

export default function IntensityTitle() {
  return (
    <Typography variant="h6" sx={{ mt: 2 }}>
      <Trans i18nKey="setIntensityLevel" />
      <Tooltip title={<Trans i18nKey="intensityTooltip" />} arrow sx={{ ml: 1 }}>
        <Help fontSize="15" />
      </Tooltip>
    </Typography>
  );
}
