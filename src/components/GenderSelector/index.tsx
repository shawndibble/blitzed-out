import { useCallback } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';
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
      <InputLabel>{labelText}</InputLabel>
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
