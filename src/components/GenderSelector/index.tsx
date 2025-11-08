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

  const genderOptions: { value: PlayerGender; labelKey: string; descriptionKey: string }[] = [
    {
      value: 'male',
      labelKey: 'localPlayers.gender.male',
      descriptionKey: 'localPlayers.gender.maleDescription',
    },
    {
      value: 'female',
      labelKey: 'localPlayers.gender.female',
      descriptionKey: 'localPlayers.gender.femaleDescription',
    },
    {
      value: 'non-binary',
      labelKey: 'localPlayers.gender.nonBinary',
      descriptionKey: 'localPlayers.gender.nonBinaryDescription',
    },
    {
      value: 'prefer-not-say',
      labelKey: 'localPlayers.gender.preferNotSay',
      descriptionKey: 'localPlayers.gender.preferNotSayDescription',
    },
  ];

  return (
    <FormControl fullWidth disabled={disabled}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <InputLabel>{label || t('localPlayers.form.genderLabel')}</InputLabel>
        {showInfoTooltip && (
          <Tooltip
            title={
              <Typography variant="body2">
                {t('localPlayers.gender.whyWeAsk')}
              </Typography>
            }
            arrow
            placement="top"
          >
            <IconButton size="small" sx={{ p: 0.5 }}>
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Select
        value={selectedGender}
        onChange={handleChange}
        label={label || t('localPlayers.form.genderLabel')}
      >
        {genderOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            <Box>
              <Typography variant="body1">{t(option.labelKey)}</Typography>
              <Typography variant="caption" color="text.secondary">
                {t(option.descriptionKey)}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
