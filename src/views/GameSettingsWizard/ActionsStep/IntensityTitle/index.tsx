import { Help } from '@mui/icons-material';
import { Tooltip, Typography } from '@mui/material';
import { Trans } from 'react-i18next';

export default function IntensityTitle(): JSX.Element {
  return (
    <Typography variant="h6" sx={{ mt: 2 }}>
      <Trans i18nKey="setIntensityLevel" />
      <Tooltip
        title={
          <Typography variant="body1">
            <Trans i18nKey="intensityTooltip" />
          </Typography>
        }
        arrow
        sx={{ ml: 1 }}
      >
        <Help sx={{ ml: 0.5, fontSize: 15 }} />
      </Tooltip>
    </Typography>
  );
}
