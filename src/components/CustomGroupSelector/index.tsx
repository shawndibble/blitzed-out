import { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { CustomGroupSelectorProps, CustomGroupPull } from '@/types/customGroups';
import { getAllAvailableGroups } from '@/stores/customGroups';

export default function CustomGroupSelector({
  value,
  onChange,
  locale,
  gameMode,
  includeDefault = true,
  disabled = false,
  refreshTrigger = 0,
}: CustomGroupSelectorProps) {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<CustomGroupPull[]>([]);
  const [loading, setLoading] = useState(true);

  // Load available groups
  useEffect(() => {
    const loadGroups = async () => {
      setLoading(true);
      try {
        // Migration is handled at app level - no need to check here

        // Get all available groups for the locale/gameMode
        const availableGroups = await getAllAvailableGroups(locale, gameMode);

        // Filter by includeDefault if needed
        const filteredGroups = includeDefault
          ? availableGroups
          : availableGroups.filter((group) => !group.isDefault);

        setGroups(filteredGroups);
      } catch (error) {
        console.error('Error loading custom groups:', error);
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, [locale, gameMode, includeDefault, refreshTrigger]);

  if (loading) {
    return (
      <FormControl fullWidth disabled>
        <InputLabel>{t('customGroups.loadingGroups')}</InputLabel>
        <Select value="">
          <MenuItem value="">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <span>{t('customGroups.loadingGroups')}</span>
            </Box>
          </MenuItem>
        </Select>
      </FormControl>
    );
  }

  return (
    <Box>
      <FormControl fullWidth disabled={disabled}>
        <InputLabel id="group-label">{t('group')}</InputLabel>
        <Select
          labelId="group-label"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          label={t('group')}
        >
          {groups.length === 0 ? (
            <MenuItem value="" disabled>
              <Typography color="text.secondary">
                {t('customGroups.noGroupsAvailable', { locale, gameMode })}
              </Typography>
            </MenuItem>
          ) : (
            groups.map((group) => (
              <MenuItem key={group.id} value={group.name}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{group.label}</span>
                  {group.isDefault && <Chip label={t('default')} size="small" variant="outlined" />}
                </Box>
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>
    </Box>
  );
}
