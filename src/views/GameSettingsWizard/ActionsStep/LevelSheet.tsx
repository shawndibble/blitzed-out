import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  FormGroup,
  SwipeableDrawer,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface LevelSheetProps {
  open: boolean;
  groupLabel: string;
  availableLevels: number[];
  intensityNames: Record<number, string>;
  selectedLevels: number[];
  onChange: (levels: number[]) => void;
  onRemove: () => void;
  onClose: () => void;
}

/**
 * Bottom-sheet level editor for one group. Real level labels, non-contiguous
 * selection allowed — this is the editor of record; the spice dial only seeds.
 */
export default function LevelSheet({
  open,
  groupLabel,
  availableLevels,
  intensityNames,
  selectedLevels,
  onChange,
  onRemove,
  onClose,
}: LevelSheetProps): JSX.Element {
  const { t } = useTranslation();

  const toggleLevel = (level: number) => {
    const next = selectedLevels.includes(level)
      ? selectedLevels.filter((lvl) => lvl !== level)
      : [...selectedLevels, level].sort((a, b) => a - b);
    onChange(next);
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen
      slotProps={{
        paper: {
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            pb: 'env(safe-area-inset-bottom)',
          },
        },
      }}
    >
      <Box sx={{ p: 2, pb: 1 }}>
        <Box
          sx={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: 'divider',
            mx: 'auto',
            mb: 1.5,
          }}
        />
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
          {groupLabel}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
          {t('levelSheetHint', 'Pick any levels — they don’t have to be in a row.')}
        </Typography>
        <FormGroup>
          {availableLevels.map((level) => (
            <FormControlLabel
              key={level}
              control={
                <Checkbox
                  checked={selectedLevels.includes(level)}
                  onChange={() => toggleLevel(level)}
                />
              }
              label={
                <Typography variant="body1">
                  {intensityNames[level] || t('levelNumber', { level })}
                </Typography>
              }
            />
          ))}
        </FormGroup>
      </Box>
      <Divider />
      <Box sx={{ display: 'flex', gap: 1, p: 2 }}>
        <Button color="error" onClick={onRemove}>
          {t('remove')}
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          onClick={onClose}
          disabled={selectedLevels.length === 0}
          size="large"
        >
          {t('done', 'Done')}
        </Button>
      </Box>
    </SwipeableDrawer>
  );
}
