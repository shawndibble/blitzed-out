import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  TextField,
  IconButton,
  Alert,
  Stack,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import { useTranslation } from 'react-i18next';
import type { CustomGroupPull, CustomGroupIntensity } from '@/types/customGroups';
import { updateCustomGroup } from '@/stores/customGroups';
import { getTiles } from '@/stores/customTiles';
import { appendIntensities } from '@/services/intensityMerge';
import {
  validateGroupExtension,
  MAX_INTENSITIES_COUNT,
  MAX_INTENSITY_VALUE,
} from '@/services/validationService';

export interface ExtendDefaultGroupDialogProps {
  open: boolean;
  group: CustomGroupPull | null;
  onClose: () => void;
  onSaved: (updated: CustomGroupPull) => void;
}

/**
 * Append-only editor for a DEFAULT group's intensity ladder. Built-in levels
 * render locked; the user can add new levels after the ladder and remove
 * previously added ones that have no tiles yet. Never touches label, type,
 * game mode, or the default levels themselves.
 */
export default function ExtendDefaultGroupDialog({
  open,
  group,
  onClose,
  onSaved,
}: ExtendDefaultGroupDialogProps) {
  const { t } = useTranslation();

  const [newLabels, setNewLabels] = useState<string[]>([]);
  const [removedValues, setRemovedValues] = useState<Set<number>>(new Set());
  const [tileCountByValue, setTileCountByValue] = useState<Record<number, number>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const defaultLevels = useMemo(
    () => (group?.intensities ?? []).filter((i) => i.isDefault),
    [group]
  );
  const existingCustomLevels = useMemo(
    () => (group?.intensities ?? []).filter((i) => !i.isDefault),
    [group]
  );

  // Reset form and load per-level tile counts (removal guard) when a group opens.
  useEffect(() => {
    if (!open || !group) return;
    setNewLabels([]);
    setRemovedValues(new Set());
    setErrors([]);

    let cancelled = false;
    (async () => {
      const counts: Record<number, number> = {};
      await Promise.all(
        group.intensities
          .filter((i) => !i.isDefault)
          .map(async (level) => {
            const tiles = await getTiles({ group_id: group.id, intensity: level.value });
            counts[level.value] = tiles.length;
          })
      );
      if (!cancelled) setTileCountByValue(counts);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, group]);

  if (!group) return null;

  const keptLevels: CustomGroupIntensity[] = [
    ...defaultLevels,
    ...existingCustomLevels.filter((i) => !removedValues.has(i.value)),
  ].sort((a, b) => a.value - b.value);

  const totalLevels = keptLevels.length + newLabels.length;
  // Two independent ceilings: the level COUNT cap, and the VALUE cap — since
  // values are allocated strictly above the current highest (never reusing a
  // freed gap), the next value must still fit within MAX_INTENSITY_VALUE.
  const highestValue = keptLevels.reduce((max, i) => Math.max(max, i.value), 0);
  const valueCeilingReached = highestValue + newLabels.length >= MAX_INTENSITY_VALUE;
  const ladderFull = totalLevels >= MAX_INTENSITIES_COUNT || valueCeilingReached;

  const handleAdd = () => {
    if (ladderFull) return;
    setNewLabels((prev) => [...prev, '']);
  };

  const handleSave = async () => {
    const validation = validateGroupExtension(keptLevels, newLabels);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSaving(true);
    try {
      // Allocate strictly above the current highest value, never reusing a
      // gap left by a removed level. Append-only sync merges by value, so
      // reusing a freed value lets two devices bind the same value to
      // different labels — a permanent, unresolvable divergence.
      let nextValue = highestValue + 1;
      const additions = newLabels.map((label) => ({
        value: nextValue++,
        label: label.trim(),
      }));

      const { merged, added, skipped } = appendIntensities(keptLevels, additions, group.name);
      // Never report success while silently dropping a level (e.g. a value that
      // would exceed MAX_INTENSITY_VALUE). Surface it instead of closing.
      if (skipped.length > 0 || added.length !== newLabels.length) {
        setErrors([t('customGroups.ladderFull')]);
        return;
      }
      await updateCustomGroup(group.id, { intensities: merged });
      onSaved({ ...group, intensities: merged });
      onClose();
    } catch (error) {
      setErrors([t('customGroups.extendSaveFailed', { error: String(error) })]);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = newLabels.length > 0 || removedValues.size > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t('customGroups.extendGroupTitle', { label: group.label })}
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          {t('customGroups.extendGroupDescription')}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </Alert>
        )}

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t('customGroups.builtInLevels')}
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 2 }}>
          {defaultLevels.map((level) => (
            <Chip
              key={level.id}
              icon={<LockIcon />}
              label={`${level.value}. ${level.label}`}
              size="small"
            />
          ))}
        </Stack>

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t('customGroups.yourAddedLevels')}
        </Typography>

        {existingCustomLevels.map((level) => {
          const tileCount = tileCountByValue[level.value] ?? 0;
          const removed = removedValues.has(level.value);
          return (
            <Box key={level.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip
                label={`${level.value}. ${level.label}`}
                size="small"
                color={removed ? 'default' : 'secondary'}
                sx={removed ? { textDecoration: 'line-through' } : undefined}
              />
              {tileCount > 0 ? (
                <Tooltip title={t('customGroups.removeLevelBlocked', { count: tileCount })}>
                  <span>
                    <IconButton size="small" aria-label="remove level" disabled>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              ) : (
                <IconButton
                  size="small"
                  aria-label={removed ? 'restore level' : 'remove level'}
                  onClick={() =>
                    setRemovedValues((prev) => {
                      const next = new Set(prev);
                      if (next.has(level.value)) next.delete(level.value);
                      else next.add(level.value);
                      return next;
                    })
                  }
                  color={removed ? 'primary' : 'error'}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          );
        })}

        {newLabels.map((label, index) => (
          <Box key={`new-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <TextField
              value={label}
              onChange={(e) =>
                setNewLabels((prev) => prev.map((l, i) => (i === index ? e.target.value : l)))
              }
              placeholder={t('customGroups.newLevelPlaceholder')}
              size="small"
              fullWidth
              slotProps={{ htmlInput: { maxLength: 50 } }}
            />
            <IconButton
              size="small"
              aria-label="remove new level"
              onClick={() => setNewLabels((prev) => prev.filter((_, i) => i !== index))}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}

        <Button
          startIcon={<AddIcon />}
          onClick={handleAdd}
          disabled={ladderFull}
          size="small"
          sx={{ mt: 1 }}
        >
          {ladderFull ? t('customGroups.ladderFull') : t('customGroups.addLevel')}
        </Button>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          {t('cancel')}
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={!hasChanges || isSaving}>
          {isSaving ? t('customGroups.saving') : t('customGroups.saveLevels')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
