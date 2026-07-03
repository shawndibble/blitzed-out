import { Box, Chip, Tooltip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Option } from '@/types/index';

/** Compact human summary of a level selection: [1,2,3] → "1–3", [1,3] → "1,3". */
export function formatLevels(levels: number[]): string {
  if (!levels.length) return '';
  const sorted = [...levels].sort((a, b) => a - b);
  const isContiguous = sorted.every((lvl, i) => i === 0 || lvl === sorted[i - 1] + 1);
  if (sorted.length === 1) return String(sorted[0]);
  if (isContiguous) return `${sorted[0]}–${sorted[sorted.length - 1]}`;
  return sorted.join(',');
}

interface GroupChipsProps {
  title: string;
  options: Option[];
  selected: Record<string, number[]>; // group name → selected levels
  customized: Set<string>;
  max: number;
  onSelect: (name: string) => void;
  onEdit: (name: string) => void;
  onRemove: (name: string) => void;
}

/**
 * Tap-to-pick group grid. Unselected chip → selects with dial defaults;
 * selected chip → opens the level sheet; the X on a selected chip removes it.
 */
export default function GroupChips({
  title,
  options,
  selected,
  customized,
  max,
  onSelect,
  onEdit,
  onRemove,
}: GroupChipsProps): JSX.Element {
  const { t } = useTranslation();
  const selectedCount = Object.keys(selected).length;
  const atCap = selectedCount >= max;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6">{title}</Typography>
        <Typography
          variant="caption"
          sx={{ color: atCap ? 'warning.main' : 'text.secondary', fontWeight: 600 }}
        >
          {t('pickedCount', { count: selectedCount, max })}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {options.map((option) => {
          const levels = selected[option.value];
          const isSelected = !!levels;
          const disabled = !isSelected && atCap;

          if (isSelected) {
            const badge = formatLevels(levels);
            const isCustom = customized.has(option.value);
            return (
              <Chip
                key={option.value}
                color="primary"
                label={`${option.label} · ${badge}${isCustom ? ' ●' : ''}`}
                onClick={() => onEdit(option.value)}
                onDelete={() => onRemove(option.value)}
                sx={{ fontWeight: 600 }}
              />
            );
          }

          const chip = (
            <Chip
              key={option.value}
              variant="outlined"
              label={option.label}
              disabled={disabled}
              onClick={() => onSelect(option.value)}
            />
          );

          return disabled ? (
            <Tooltip key={option.value} title={t('pickedCountMax', { max })}>
              <span>{chip}</span>
            </Tooltip>
          ) : (
            chip
          );
        })}
      </Box>
    </Box>
  );
}
