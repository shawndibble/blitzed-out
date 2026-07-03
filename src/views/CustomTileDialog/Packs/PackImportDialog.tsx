import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { importPack, parsePack, reportPack } from '@/services/contentPacks';
import type { ContentPackDoc } from '@/types/contentPacks';
import type { ExportTile } from '@/types/importExport';

// Ordered easy→intense palette; intensities map to slots by their sorted position
// so colors stay consistent regardless of the raw `value` numbers a pack uses.
const INTENSITY_COLORS = [
  '#4caf50', // green
  '#26c6da', // cyan
  '#fdd835', // yellow
  '#fb8c00', // orange
  '#ef5350', // red
  '#ab47bc', // purple
  '#ec407a', // pink
];

interface PackImportDialogProps {
  pack: ContentPackDoc;
  open: boolean;
  onClose: () => void;
  onImported?: (packName: string, pack: ContentPackDoc) => void;
}

export default function PackImportDialog({
  pack,
  open,
  onClose,
  onImported,
}: PackImportDialogProps) {
  const { t } = useTranslation();
  const parsed = useMemo(() => parsePack(pack), [pack]);
  const [busy, setBusy] = useState(false);
  const [reported, setReported] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const groups = parsed?.data.data.customGroups ?? [];
  const tiles = parsed?.data.data.customTiles ?? [];
  const declaredExtensions = parsed?.data.data.groupExtensions ?? [];

  // Tiles can target default groups without a matching groupExtensions entry
  // (e.g. new actions at existing levels). Surface those as synthetic
  // extension sections so no tile is invisible in the preview.
  const extensions = useMemo(() => {
    const covered = new Set([
      ...groups.map((g) => g.name),
      ...declaredExtensions.map((e) => e.groupName),
    ]);
    const orphanNames = [...new Set(tiles.map((tile) => tile.groupName))].filter(
      (name) => !covered.has(name)
    );
    return [
      ...declaredExtensions,
      ...orphanNames.map((name) => ({
        groupName: name,
        groupLabel: name,
        locale: pack.locale,
        gameMode: pack.gameMode,
        addedIntensities: [],
        contentHash: '',
      })),
    ];
  }, [groups, declaredExtensions, tiles, pack.locale, pack.gameMode]);

  // Bucket tiles under their group for the per-group preview sections.
  const tilesByGroup = useMemo(() => {
    const map = new Map<string, ExportTile[]>();
    for (const tile of tiles) {
      const list = map.get(tile.groupName) ?? [];
      list.push(tile);
      map.set(tile.groupName, list);
    }
    return map;
  }, [tiles]);

  async function handleImport(): Promise<void> {
    setBusy(true);
    setFeedback(null);
    try {
      const result = await importPack(pack);
      if (!result.success) {
        setFeedback({ type: 'error', message: result.errors[0] || t('packs.importFailed') });
        return;
      }
      onImported?.(pack.name, pack);
      onClose();
    } catch (e) {
      setFeedback({ type: 'error', message: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  async function handleReport(): Promise<void> {
    try {
      await reportPack(pack.id, 'Reported from import preview');
      setReported(true);
      setFeedback({ type: 'success', message: t('packs.reported') });
    } catch {
      setFeedback({ type: 'error', message: t('packs.reportFailed') });
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          bgcolor: 'background.paper',
          px: 3,
          pt: 2.5,
          pb: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <IconButton
          aria-label={t('close')}
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
        <Typography variant="h6">{pack.name}</Typography>
        {pack.authorName && (
          <Typography variant="body2" color="text.secondary">
            {t('packs.by')} {pack.authorName}
          </Typography>
        )}
        {pack.description && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            {pack.description}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
          <Chip size="small" label={t(`gameMode.${pack.gameMode}`)} />
          <Chip size="small" label={pack.locale} />
          {pack.tags?.map((tag) => (
            <Chip key={tag} size="small" variant="outlined" label={tag} />
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {t('packs.summary', { groups: groups.length, tiles: tiles.length })}
          {extensions.length > 0 && ` · ${t('packs.extensionSummary', { count: extensions.length })}`}
        </Typography>
      </Box>

      <DialogContent>
        {!parsed ? (
          <Alert severity="error">{t('packs.invalidPack')}</Alert>
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            {groups.map((group) => {
              const groupTiles = tilesByGroup.get(group.name) ?? [];
              // Sort intensities low→high so palette slots run easy→intense.
              const ordered = [...group.intensities].sort((a, b) => a.value - b.value);
              const colorByValue = new Map(
                ordered.map((i, idx) => [i.value, INTENSITY_COLORS[idx % INTENSITY_COLORS.length]])
              );
              const countByValue = new Map<number, number>();
              for (const tile of groupTiles) {
                countByValue.set(tile.intensity, (countByValue.get(tile.intensity) ?? 0) + 1);
              }
              const colorFor = (value: number) => colorByValue.get(value) ?? 'primary.main';
              const intensityLabel = (value: number) =>
                group.intensities.find((i) => i.value === value)?.label ?? `L${value}`;
              return (
                <Box key={group.name}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 1,
                      flexWrap: 'wrap',
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle2">{group.label || group.name}</Typography>
                    {/* Color key: one chip per level with its tile count. */}
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 0.5,
                        flexWrap: 'wrap',
                        justifyContent: 'flex-end',
                      }}
                    >
                      {ordered.map((i) => {
                        const count = countByValue.get(i.value) ?? 0;
                        const color = colorFor(i.value);
                        return (
                          <Chip
                            key={i.value}
                            size="small"
                            variant="outlined"
                            label={`${i.label} · ${count}`}
                            sx={{
                              borderColor: color,
                              color,
                              opacity: count === 0 ? 0.5 : 1,
                              '& .MuiChip-label': { fontWeight: 500 },
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 1,
                    }}
                  >
                    {groupTiles.map((tile, idx) => {
                      const color = colorFor(tile.intensity);
                      return (
                        <Box
                          key={`${tile.action}-${idx}`}
                          sx={{
                            borderLeft: 3,
                            borderColor: color,
                            bgcolor: 'action.hover',
                            borderRadius: 1,
                            px: 1.25,
                            py: 0.75,
                          }}
                        >
                          <Typography variant="body2">{tile.action}</Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                            <Chip
                              size="small"
                              variant="outlined"
                              label={intensityLabel(tile.intensity)}
                              sx={{ borderColor: color, color }}
                            />
                            {tile.tags?.map((tag) => (
                              <Chip key={tag} size="small" variant="outlined" label={tag} />
                            ))}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                  <Divider sx={{ mt: 2 }} />
                </Box>
              );
            })}

            {/* Default-group extensions: tiles and/or added levels for groups
                the importer already has. */}
            {extensions.map((extension) => {
              const extensionTiles = tilesByGroup.get(extension.groupName) ?? [];
              const addedLabelByValue = new Map(
                extension.addedIntensities.map((i) => [i.value, i.label])
              );
              const distinctValues = [
                ...new Set([
                  ...extension.addedIntensities.map((i) => i.value),
                  ...extensionTiles.map((tile) => tile.intensity),
                ]),
              ].sort((a, b) => a - b);
              const colorByValue = new Map(
                distinctValues.map((value, idx) => [
                  value,
                  INTENSITY_COLORS[idx % INTENSITY_COLORS.length],
                ])
              );
              const colorFor = (value: number) => colorByValue.get(value) ?? 'primary.main';
              const intensityLabel = (value: number) =>
                addedLabelByValue.get(value) ?? `L${value}`;
              return (
                <Box key={`ext-${extension.groupName}`}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 1,
                      flexWrap: 'wrap',
                      mb: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Typography variant="subtitle2">
                        {t('packs.extendsGroup', {
                          label: extension.groupLabel || extension.groupName,
                        })}
                      </Typography>
                      <Chip size="small" variant="outlined" label={t('packs.extendsDefault')} />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('packs.extensionDetail', {
                        tiles: extensionTiles.length,
                        levels: extension.addedIntensities.length,
                      })}
                    </Typography>
                  </Box>
                  {extension.addedIntensities.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                      {extension.addedIntensities.map((i) => (
                        <Chip
                          key={i.value}
                          size="small"
                          variant="outlined"
                          label={t('packs.newLevelChip', { label: i.label })}
                          sx={{ borderColor: colorFor(i.value), color: colorFor(i.value) }}
                        />
                      ))}
                    </Box>
                  )}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 1,
                    }}
                  >
                    {extensionTiles.map((tile, idx) => {
                      const color = colorFor(tile.intensity);
                      return (
                        <Box
                          key={`${tile.action}-${idx}`}
                          sx={{
                            borderLeft: 3,
                            borderColor: color,
                            bgcolor: 'action.hover',
                            borderRadius: 1,
                            px: 1.25,
                            py: 0.75,
                          }}
                        >
                          <Typography variant="body2">{tile.action}</Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                            <Chip
                              size="small"
                              variant="outlined"
                              label={intensityLabel(tile.intensity)}
                              sx={{ borderColor: color, color }}
                            />
                            {tile.tags?.map((tag) => (
                              <Chip key={tag} size="small" variant="outlined" label={tag} />
                            ))}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                  <Divider sx={{ mt: 2 }} />
                </Box>
              );
            })}
          </Stack>
        )}
      </DialogContent>

      {feedback && (
        <Alert
          severity={feedback.type}
          onClose={() => setFeedback(null)}
          sx={{ mx: 3, mb: 1, borderRadius: 1 }}
        >
          {feedback.message}
        </Alert>
      )}

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          color="error"
          onClick={handleReport}
          disabled={busy || reported}
          sx={{ mr: 'auto' }}
        >
          {reported ? t('packs.reportedShort') : t('packs.report')}
        </Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={busy || !parsed}
          startIcon={busy ? <CircularProgress size={16} /> : undefined}
        >
          {t('packs.import')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
