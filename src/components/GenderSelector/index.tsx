import { useCallback } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Tooltip,
  IconButton,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useTranslation } from 'react-i18next';
import type { PlayerGender } from '@/types/localPlayers';

interface GenderSelectorProps {
  /** Currently selected gender */
  selectedGender?: PlayerGender;
  /** Callback when gender selection changes */
  onGenderChange: (gender: PlayerGender) => void;
  /** Label for the form control */
  label?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Show info tooltip explaining why we ask */
  showInfoTooltip?: boolean;
}

/**
 * GenderSelector component for privacy-focused gender selection
 * Used to personalize action text with appropriate anatomy terms
 */
export default function GenderSelector({
  selectedGender = 'prefer-not-say',
  onGenderChange,
  label,
  disabled = false,
  showInfoTooltip = true,
}: GenderSelectorProps): JSX.Element {
  const { t } = useTranslation();

  const handleChange = useCallback(
    (event: any) => {
      const value = event.target.value as PlayerGender;
      onGenderChange(value);
    },
    [onGenderChange]
  );

  const genderOptions: { value: PlayerGender; labelKey: string }[] = [
    {
      value: 'male',
      labelKey: 'localPlayers.gender.male',
    },
    {
      value: 'female',
      labelKey: 'localPlayers.gender.female',
    },
    {
      value: 'prefer-not-say',
      labelKey: 'localPlayers.gender.preferNotSay',
    },
  ];

  const labelText = label || t('localPlayers.form.genderLabel');

  return (
    <FormControl fullWidth disabled={disabled}>
      <InputLabel shrink={selectedGender !== 'prefer-not-say'}>
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
          {labelText}
          {showInfoTooltip && (
            <Tooltip
              title={<Typography variant="body2">{t('localPlayers.gender.whyWeAsk')}</Typography>}
              arrow
              placement="top"
            >
              <InfoOutlinedIcon sx={{ fontSize: 16, cursor: 'help' }} />
            </Tooltip>
          )}
        </Box>
      </InputLabel>
      <Select value={selectedGender} onChange={handleChange} label={labelText}>
        {genderOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            <Typography variant="body1">{t(option.labelKey)}</Typography>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
