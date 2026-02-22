import { Box, Typography } from '@mui/material';
import { Trans } from 'react-i18next';

interface StatCardProps {
  value: string | number;
  labelKey: string;
}

export default function StatCard({ value, labelKey }: StatCardProps): JSX.Element {
  return (
    <Box sx={{ textAlign: 'center', py: 1 }}>
      <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        <Trans i18nKey={labelKey as never} />
      </Typography>
    </Box>
  );
}
