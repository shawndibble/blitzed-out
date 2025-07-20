import { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { IntensitySelectorProps, CustomGroupIntensity } from '@/types/customGroups';
import { getGroupIntensities } from '@/stores/customGroups';

export default function IntensitySelector({
  groupName,
  value,
  onChange,
  locale,
  gameMode,
  disabled = false,
}: IntensitySelectorProps) {
  const { t } = useTranslation();
  const [intensities, setIntensities] = useState<CustomGroupIntensity[]>([]);
  const [loading, setLoading] = useState(false);

  // Load intensities when group changes
  useEffect(() => {
    const loadIntensities = async () => {
      if (!groupName) {
        setIntensities([]);
        return;
      }

      setLoading(true);
      try {
        const groupIntensities = await getGroupIntensities(groupName, locale, gameMode);
        setIntensities(groupIntensities);
      } catch (error) {
        console.error('Error loading group intensities:', error);
        setIntensities([]);
      } finally {
        setLoading(false);
      }
    };

    loadIntensities();
  }, [groupName, locale, gameMode]);

  // Validate current value when intensities change
  useEffect(() => {
    if (intensities.length > 0 && value && !intensities.some((i) => i.value === value)) {
      const firstIntensity = intensities.sort((a, b) => a.value - b.value)[0];
      if (firstIntensity) {
        onChange(firstIntensity.value);
      }
    }
  }, [intensities, value, onChange]);

  if (!groupName) {
    return (
      <FormControl fullWidth disabled>
        <InputLabel>{t('intensity')}</InputLabel>
        <Select value="">
          <MenuItem value="" disabled>
            <Typography color="text.secondary">{t('customGroups.selectGroupFirst')}</Typography>
          </MenuItem>
        </Select>
      </FormControl>
    );
  }

  if (loading) {
    return (
      <FormControl fullWidth disabled>
        <InputLabel>{t('customGroups.loadingIntensities')}</InputLabel>
        <Select value="">
          <MenuItem value="">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <span>{t('customGroups.loadingIntensities')}</span>
            </Box>
          </MenuItem>
        </Select>
      </FormControl>
    );
  }

  if (intensities.length === 0) {
    return (
      <FormControl fullWidth disabled>
        <InputLabel>{t('intensity')}</InputLabel>
        <Select value="">
          <MenuItem value="" disabled>
            <Typography color="text.secondary">
              {t('customGroups.noIntensitiesAvailable', { groupName })}
            </Typography>
          </MenuItem>
        </Select>
      </FormControl>
    );
  }

  return (
    <Box>
      <FormControl fullWidth disabled={disabled}>
        <InputLabel>{t('intensity')}</InputLabel>
        <Select
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value))}
          label={t('intensity')}
        >
          {intensities
            .sort((a, b) => a.value - b.value)
            .map((intensity) => (
              <MenuItem key={intensity.id} value={intensity.value}>
                {intensity.label}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
    </Box>
  );
}
