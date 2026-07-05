import { Box, Card, Slider, Typography } from '@mui/material';
import { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import { Settings } from '@/types/Settings';

interface FinishRangeRowProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
}

/**
 * Dual-handle finish-range control. The rail is painted as three zones
 * (no orgasm / ruined / normal) so the split reads at a glance; the labels
 * under the rail carry the exact percentages.
 */
export default function FinishRangeRow({
  formData,
  setFormData,
}: FinishRangeRowProps): JSX.Element {
  const { t } = useTranslation();
  const [start, end] = formData?.finishRange || [30, 70];

  const handleChange = (_: Event, newValue: number | number[]): void => {
    setFormData({ ...formData, finishRange: newValue as [number, number], boardUpdated: true });
  };

  return (
    <Card variant="outlined" sx={{ px: 2, py: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {t('finishOptions')}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}
        >
          {start} / {end}
        </Typography>
      </Box>
      <Slider
        value={[start, end]}
        onChange={handleChange}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => `${value}%`}
        aria-label={t('finishOptions')}
        sx={{
          mt: 0.5,
          '& .MuiSlider-rail': {
            opacity: 1,
            background: `linear-gradient(90deg,
              #475569 0% ${start}%,
              #7dd3fc ${start}% ${end}%,
              #22d3ee ${end}% 100%)`,
          },
          '& .MuiSlider-track': { background: 'transparent', border: 'none' },
        }}
      />
      <Box sx={{ display: 'flex', fontSize: '0.7rem', color: 'text.secondary' }}>
        <Box sx={{ width: `${start}%`, minWidth: 70 }}>
          {t('noCum')} · {start}%
        </Box>
        <Box sx={{ width: `${end - start}%`, minWidth: 70, textAlign: 'center' }}>
          {t('ruined')} · {end - start}%
        </Box>
        <Box sx={{ flex: 1, textAlign: 'right', minWidth: 70 }}>
          {t('cum')} · {100 - end}%
        </Box>
      </Box>
    </Card>
  );
}
