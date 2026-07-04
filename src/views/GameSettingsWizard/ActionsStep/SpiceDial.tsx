import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

export type SpiceLevel = 'mild' | 'medium' | 'spicy' | 'filthy';

export const SPICE_LEVELS: SpiceLevel[] = ['mild', 'medium', 'spicy', 'filthy'];

/**
 * Map a spice level to a cumulative band of a group's ACTUAL intensity values.
 * Bands scale by percentile so 3-, 4-, 5- and 6-level ladders all get a
 * sensible default. Returns real intensity values (not 1..k positions) so
 * sparse ladders (e.g. [1, 2, 4, 5]) never select phantom levels downstream.
 */
export function spiceBand(spice: SpiceLevel, ladder: number[]): number[] {
  const fractions: Record<SpiceLevel, number> = {
    mild: 0.25,
    medium: 0.5,
    spicy: 0.75,
    filthy: 1,
  };
  const sorted = [...ladder].sort((a, b) => a - b);
  if (sorted.length === 0) return [];
  const top = Math.max(1, Math.round(sorted.length * fractions[spice]));
  return sorted.slice(0, Math.min(top, sorted.length));
}

interface SpiceDialProps {
  value: SpiceLevel;
  onChange: (value: SpiceLevel) => void;
}

/**
 * Global spice selector. It is a defaults generator, not a setting: it only
 * seeds levels for groups the user hasn't hand-edited (the step tracks those),
 * so it can never silently escalate a group someone tuned deliberately.
 */
export default function SpiceDial({ value, onChange }: SpiceDialProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Box sx={{ textAlign: 'center' }}>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_, newValue: SpiceLevel | null) => {
          if (newValue) onChange(newValue);
        }}
        size="small"
        color="primary"
        sx={{ flexWrap: 'wrap', justifyContent: 'center' }}
        aria-label={t('spiceLevel', 'Spice level')}
      >
        {SPICE_LEVELS.map((level) => (
          <ToggleButton key={level} value={level} sx={{ px: 2 }}>
            {t(`spice.${level}`)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
        {t('spice.hint', "Suggests levels for groups you haven't customized.")}
      </Typography>
    </Box>
  );
}
