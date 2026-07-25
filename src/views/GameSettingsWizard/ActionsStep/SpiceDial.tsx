import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { SPICE_LEVELS, SpiceLevel } from './spiceBand';

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
