import {
  Box,
  Card,
  Chip,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionEntry } from '@/types';

interface ActionCardProps {
  groupKey: string;
  group: Record<string, any>;
  entry: ActionEntry;
  /** Role picker renders only for With Others group play on role-bearing groups. */
  showRole: boolean;
  /** Group exists in selections but not in the current mode's catalog. */
  unavailable: boolean;
  onLevelsChange: (groupKey: string, levels: number[]) => void;
  onFieldChange: (groupKey: string, field: 'role' | 'variation', value: string) => void;
  onRemove: (groupKey: string) => void;
}

const TYPE_LABEL_KEYS: Record<string, string> = {
  consumption: 'consumption',
  foreplay: 'foreplay',
  sex: 'sex',
  solo: 'solo',
};

/**
 * One enabled action group in the loadout: name + type tag + remove on the
 * first line, named intensity chips (with the consumption variation inline)
 * on the second, role toggle on a third in With Others. All levels stay
 * visible — wrap, never scroll — so the enabled state is glanceable.
 */
export default function ActionCard({
  groupKey,
  group,
  entry,
  showRole,
  unavailable,
  onLevelsChange,
  onFieldChange,
  onRemove,
}: ActionCardProps): JSX.Element {
  const { t } = useTranslation();

  const intensities: Record<number, string> = group?.intensities ?? {};
  const availableLevels = Object.keys(intensities)
    .map(Number)
    .sort((a, b) => a - b);
  const selectedLevels = entry.levels ?? [];
  const label = group?.label || groupKey;

  const toggleLevel = (level: number): void => {
    const next = selectedLevels.includes(level)
      ? selectedLevels.filter((selected) => selected !== level)
      : [...selectedLevels, level].sort((a, b) => a - b);
    onLevelsChange(groupKey, next);
  };

  const roleOptions = [
    { value: 'dom', label: group?.dom || t('dom') },
    { value: 'vers', label: t('vers') },
    { value: 'sub', label: group?.sub || t('sub') },
  ];

  return (
    <Card variant="outlined" sx={{ opacity: unavailable ? 0.55 : 1, px: 1.75, py: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 0, flex: 1 }}>
          {label}
        </Typography>
        {group?.type && (
          <Chip
            label={t(TYPE_LABEL_KEYS[group.type] ?? group.type)}
            size="small"
            variant="outlined"
            sx={{ height: 20, fontSize: '0.65rem', color: 'text.secondary' }}
          />
        )}
        <Tooltip title={t('removeAction', { label })}>
          <IconButton
            size="small"
            onClick={() => onRemove(groupKey)}
            aria-label={t('removeAction', { label })}
            sx={{ mr: -0.5 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {unavailable ? (
        <Typography variant="caption" sx={{ color: 'warning.main' }}>
          {t('notAvailableInMode')}
        </Typography>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75, mt: 1 }}>
            {availableLevels.map((level) => {
              const selected = selectedLevels.includes(level);
              return (
                <Chip
                  key={level}
                  label={intensities[level]}
                  onClick={() => toggleLevel(level)}
                  color={selected ? 'primary' : 'default'}
                  variant={selected ? 'filled' : 'outlined'}
                  sx={{ height: 28 }}
                />
              );
            })}
            {group?.type === 'consumption' && (
              <Select
                size="small"
                value={entry.variation || 'standalone'}
                onChange={(event: SelectChangeEvent<string>) =>
                  onFieldChange(groupKey, 'variation', event.target.value)
                }
                aria-label={`${label} ${t('variation')}`}
                sx={{ ml: 0.5, fontSize: '0.8rem', '& .MuiSelect-select': { py: 0.5 } }}
              >
                <MenuItem value="standalone">{t('standalone')}</MenuItem>
                <MenuItem value="appendSome">{t('appendSome')}</MenuItem>
                <MenuItem value="appendMost">{t('appendMost')}</MenuItem>
              </Select>
            )}
          </Box>
          {selectedLevels.length === 0 && (
            <Typography variant="caption" sx={{ color: 'warning.main', display: 'block', mt: 0.5 }}>
              {t('noLevelsSelected')}
            </Typography>
          )}
          {showRole && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.25 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('role')}
              </Typography>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={entry.role || 'sub'}
                onChange={(_, value: string | null) => {
                  if (value) onFieldChange(groupKey, 'role', value);
                }}
                aria-label={`${label} ${t('role')}`}
              >
                {roleOptions.map(({ value, label: roleLabel }) => (
                  <ToggleButton key={value} value={value} sx={{ py: 0.25, px: 1.25 }}>
                    {roleLabel}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          )}
        </>
      )}
    </Card>
  );
}
