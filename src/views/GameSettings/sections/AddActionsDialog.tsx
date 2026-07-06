import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  TextField,
  Typography,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import { JSX, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import useBreakpoint from '@/hooks/useBreakpoint';

interface AddActionsDialogProps {
  open: boolean;
  onClose: () => void;
  /** Catalog for the current mode, already filtered to pickable types. */
  availableGroups: Record<string, any>;
  /** Keys already enabled — excluded from the list. */
  enabledKeys: string[];
  onAdd: (groupKey: string) => void;
}

/**
 * Full catalog picker for the actions loadout. Stays open on add so hosts can
 * grab several groups in one visit; search + type filters absorb catalog
 * growth from content packs.
 */
export default function AddActionsDialog({
  open,
  onClose,
  availableGroups,
  enabledKeys,
  onAdd,
}: AddActionsDialogProps): JSX.Element {
  const { t } = useTranslation();
  const isMobile = useBreakpoint();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const candidates = useMemo(() => {
    const search = query.trim().toLowerCase();
    return Object.entries(availableGroups)
      .filter(([key]) => !enabledKeys.includes(key))
      .filter(([, group]) => typeFilter === 'all' || group?.type === typeFilter)
      .filter(
        ([key, group]) =>
          !search ||
          String(group?.label || key)
            .toLowerCase()
            .includes(search)
      )
      .sort(([, a], [, b]) => String(a?.label).localeCompare(String(b?.label)));
  }, [availableGroups, enabledKeys, typeFilter, query]);

  const presentTypes = useMemo(() => {
    const types = new Set<string>();
    Object.values(availableGroups).forEach((group: any) => {
      if (group?.type) types.add(group.type);
    });
    return Array.from(types);
  }, [availableGroups]);

  const grouped = useMemo(() => {
    const byType: Record<string, [string, any][]> = {};
    candidates.forEach(([key, group]) => {
      const type = group?.type || 'other';
      (byType[type] ??= []).push([key, group]);
    });
    return byType;
  }, [candidates]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      fullWidth
      maxWidth="sm"
      slotProps={{
        transition: {
          // The dialog stays mounted between visits; clear the previous
          // search/filter once it has closed so reopening starts fresh.
          onExited: () => {
            setQuery('');
            setTypeFilter('all');
          },
        },
      }}
    >
      <DialogTitle>{t('addActions')}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={t('searchActions')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          sx={{ mb: 1.5 }}
          slotProps={{ htmlInput: { 'aria-label': t('searchActions') } }}
        />
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
          <Chip
            label={t('all')}
            size="small"
            variant={typeFilter === 'all' ? 'filled' : 'outlined'}
            color={typeFilter === 'all' ? 'primary' : 'default'}
            onClick={() => setTypeFilter('all')}
          />
          {presentTypes.map((type) => (
            <Chip
              key={type}
              label={t(type)}
              size="small"
              variant={typeFilter === type ? 'filled' : 'outlined'}
              color={typeFilter === type ? 'primary' : 'default'}
              onClick={() => setTypeFilter(type)}
            />
          ))}
        </Box>

        {candidates.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', py: 3, textAlign: 'center' }}>
            {t('noActionsFound')}
          </Typography>
        ) : (
          <List dense disablePadding>
            {Object.entries(grouped).map(([type, groups]) => (
              <Box key={type}>
                <ListSubheader disableSticky sx={{ bgcolor: 'transparent', lineHeight: 2.5 }}>
                  {t(type)}
                </ListSubheader>
                {groups.map(([key, group]) => {
                  const levelCount = Object.keys(group?.intensities ?? {}).length;
                  return (
                    <ListItemButton key={key} onClick={() => onAdd(key)} sx={{ borderRadius: 1 }}>
                      <ListItemText
                        primary={group?.label || key}
                        secondary={t('levelsCount', { count: levelCount })}
                      />
                      <AddCircleOutlineIcon fontSize="small" sx={{ color: 'primary.main' }} />
                    </ListItemButton>
                  );
                })}
              </Box>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          {t('done')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
