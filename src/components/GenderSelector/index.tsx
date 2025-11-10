import { useCallback } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { PlayerGender } from '@/types/localPlayers';

interface GenderSelectorProps {
  /** Currently selected anatomy */
  selectedGender?: PlayerGender;
  /** Callback when anatomy selection changes */
  onGenderChange: (gender: PlayerGender) => void;
  /** Label for the form control */
  label?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

const GENDER_OPTIONS = [
  { value: 'male', labelKey: 'localPlayers.gender.male' },
  { value: 'female', labelKey: 'localPlayers.gender.female' },
  { value: 'non-binary', labelKey: 'localPlayers.gender.nonBinary' },
] as const satisfies ReadonlyArray<{ value: PlayerGender; labelKey: string }>;

/**
 * GenderSelector component for privacy-focused anatomy selection
 * Used to personalize action text with appropriate anatomy terms
 */
export default function GenderSelector({
  selectedGender = 'non-binary',
  onGenderChange,
  label,
  disabled = false,
}: GenderSelectorProps): JSX.Element {
  const { t } = useTranslation();

  const handleChange = useCallback(
    (event: SelectChangeEvent<PlayerGender>) => {
      onGenderChange(event.target.value as PlayerGender);
    },
    [onGenderChange]
  );

  const genderOptions = GENDER_OPTIONS;

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
