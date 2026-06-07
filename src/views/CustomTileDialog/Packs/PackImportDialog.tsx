import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { importPack, parsePack, reportPack } from '@/services/contentPacks';
import { analyzeImportConflicts } from '@/services/importExport';
import { upsertSubscription } from '@/stores/packSubscriptions';
import type { ContentPackDoc } from '@/types/contentPacks';

interface PackImportDialogProps {
  pack: ContentPackDoc;
  open: boolean;
  onClose: () => void;
  onImported?: () => void;
}

export default function PackImportDialog({
  pack,
  open,
  onClose,
  onImported,
}: PackImportDialogProps) {
  const { t } = useTranslation();
  // Memoize on stable pack identity so the conflict-analysis effect below isn't
  // retriggered by every parent re-render.
  const parsed = useMemo(() => parsePack(pack), [pack.id, pack.contents, pack.packVersion]);
  const [conflicts, setConflicts] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groupCount = parsed?.data.data.customGroups.length ?? 0;
  const tileCount = parsed?.data.data.customTiles.length ?? 0;

  useEffect(() => {
    if (!open || !parsed) return;
    let cancelled = false;
    analyzeImportConflicts(pack.contents, {
      packProvenance: { packId: pack.id, packVersion: pack.packVersion, packName: pack.name },
    })
      .then((res) => {
        if (cancelled) return;
        // Count only genuine local edits that an import would overwrite.
        setConflicts(res.tileConflicts.filter((c) => c.conflictType === 'contentMatch').length);
      })
      .catch(() => {
        if (!cancelled) setConflicts(null);
      });
    return () => {
      cancelled = true;
    };
    // `parsed` is memoized on stable pack identity; pack fields read here move with it.
    // eslint-disable-next-line @eslint-react/exhaustive-deps
  }, [open, parsed]);

  async function handleImport(subscribe: boolean): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const result = await importPack(pack);
      if (!result.success) {
        setError(result.errors[0] || t('packs.importFailed'));
        return;
      }
      if (subscribe) {
        await upsertSubscription({
          packId: pack.id,
          packVersion: pack.packVersion,
          name: pack.name,
          authorName: pack.authorName,
          gameMode: pack.gameMode,
          locale: pack.locale,
          subscribedAt: Date.now(),
        });
      }
      onImported?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleReport(): Promise<void> {
    try {
      await reportPack(pack.id, 'Reported from import preview');
      setError(t('packs.reported'));
    } catch {
      setError(t('packs.reportFailed'));
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('packs.importTitle')}</DialogTitle>
      <DialogContent>
        {!parsed ? (
          <Alert severity="error">{t('packs.invalidPack')}</Alert>
        ) : (
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <Typography variant="h6">{pack.name}</Typography>
            {pack.description && <Typography variant="body2">{pack.description}</Typography>}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip size="small" label={`v${pack.packVersion}`} />
              <Chip size="small" label={pack.gameMode} />
              <Chip size="small" label={pack.locale} />
              {pack.authorName && (
                <Chip size="small" label={`${t('packs.by')} ${pack.authorName}`} />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {t('packs.contains', { groups: groupCount, tiles: tileCount })}
            </Typography>
            {conflicts !== null && conflicts > 0 && (
              <Alert severity="warning">{t('packs.editConflicts', { count: conflicts })}</Alert>
            )}
            {error && <Alert severity="info">{error}</Alert>}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1, px: 3, pb: 2 }}>
        <Button color="error" onClick={handleReport} disabled={busy} sx={{ mr: 'auto' }}>
          {t('packs.report')}
        </Button>
        <Button onClick={onClose} disabled={busy}>
          {t('cancel')}
        </Button>
        <Button onClick={() => handleImport(false)} disabled={busy || !parsed}>
          {t('packs.importCopy')}
        </Button>
        <Button
          variant="contained"
          onClick={() => handleImport(true)}
          disabled={busy || !parsed}
          startIcon={busy ? <CircularProgress size={16} /> : undefined}
        >
          {t('packs.subscribe')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
