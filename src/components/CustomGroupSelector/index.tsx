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
import { CustomGroupSelectorProps } from '@/types/customGroups';
import { useEditorGroupsReactive } from '@/hooks/useGroupFiltering';
export default function CustomGroupSelector({
  value,
  onChange,
  locale,
  gameMode,
  includeDefault = true,
  disabled = false,
  refreshTrigger: _refreshTrigger = 0, // Keep for backward compatibility but no longer used
}: CustomGroupSelectorProps) {
  const { t } = useTranslation();

  // Use the new reactive hook for editor context (all groups) - automatically detects DB changes
  const { groups, loading, error } = useEditorGroupsReactive(gameMode, locale);

  // Filter by includeDefault if needed
  const filteredGroups = includeDefault ? groups : groups.filter((group) => !group.isDefault);

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
          {filteredGroups.length === 0 ? (
            <MenuItem value="" disabled>
              <Typography color="text.secondary">
                {error
                  ? t('customGroups.errorLoadingGroups')
                  : t('customGroups.noGroupsAvailable', { locale, gameMode })}
              </Typography>
            </MenuItem>
          ) : (
            filteredGroups.map((group) => (
              <MenuItem key={group.id} value={group.id}>
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
