import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import type { QueryDocumentSnapshot } from 'firebase/firestore';
import PackImportDialog from '../Packs/PackImportDialog';
import { listPublicPacks } from '@/services/contentPacks';
import { getImportedPackIds } from '@/stores/customGroups';
import { useGameSettings } from '@/stores/settingsStore';
import { GAME_MODES } from '@/services/migration/constants';
import type { ContentPackDoc } from '@/types/contentPacks';

interface PackDirectoryProps {
  // Game mode is owned by the parent so this pane and the publish form stay in sync.
  gameMode: string;
  onGameModeChange: (mode: string) => void;
  onImported?: (packName: string) => void;
}

export default function PackDirectory({
  gameMode,
  onGameModeChange,
  onImported,
}: PackDirectoryProps) {
  const { t } = useTranslation();
  const { settings } = useGameSettings();
  const locale = settings.locale || 'en';

  const [packs, setPacks] = useState<ContentPackDoc[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedPack, setSelectedPack] = useState<ContentPackDoc | null>(null);
  // Source-pack ids already present locally; reactive so badges update on import.
  const importedPackIds = useLiveQuery(() => getImportedPackIds(), [], new Set<string>());

  const loadPage = useCallback(
    async (reset: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const result = await listPublicPacks({
          gameMode,
          locale,
          cursor: reset ? undefined : cursor,
        });
        setPacks((prev) => (reset ? result.packs : [...prev, ...result.packs]));
        setCursor(result.nextCursor);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [gameMode, locale, cursor]
  );

  // Reset and reload whenever the gameMode/locale filter changes.
  useEffect(() => {
    loadPage(true);
    // loadPage closes over `cursor`, but a filter change must always start fresh.
    // eslint-disable-next-line @eslint-react/exhaustive-deps
  }, [gameMode, locale]);

  // Client-side name/tag substring filter over the loaded page (v1: no full-text search).
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return packs;
    return packs.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [packs, search]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('packs.directoryTitle')}
      </Typography>

      <Stack spacing={1.5}>
        <TextField
          size="small"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('packs.searchPlaceholder')}
          slotProps={{ htmlInput: { 'aria-label': t('packs.searchPlaceholder') } }}
        />
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {GAME_MODES.map((mode) => (
            <Chip
              key={mode}
              label={t(`gameMode.${mode}`)}
              color={mode === gameMode ? 'primary' : 'default'}
              variant={mode === gameMode ? 'filled' : 'outlined'}
              onClick={() => onGameModeChange(mode)}
            />
          ))}
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        {!loading && filtered.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            {t('packs.directoryEmpty')}
          </Typography>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1.5,
          }}
        >
          {filtered.map((pack) => {
            const imported = importedPackIds.has(pack.id);
            return (
              <Card
                key={pack.id}
                variant="outlined"
                sx={imported ? { borderColor: 'success.main' } : undefined}
              >
                <CardActionArea onClick={() => setSelectedPack(pack)} sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="subtitle1" noWrap sx={{ flex: 1 }}>
                        {pack.name}
                      </Typography>
                      {imported && (
                        <Chip
                          size="small"
                          color="success"
                          variant="outlined"
                          icon={<CheckCircle />}
                          label={t('packs.imported')}
                        />
                      )}
                    </Box>
                    {pack.authorName && (
                      <Typography variant="caption" color="text.secondary">
                        {t('packs.by')} {pack.authorName}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', my: 0.75 }}>
                      <Chip size="small" label={t(`gameMode.${pack.gameMode}`)} />
                      <Chip size="small" label={pack.locale} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {t('packs.summary', { groups: pack.groupCount, tiles: pack.tileCount })}
                    </Typography>
                    {pack.tags?.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.75 }}>
                        {pack.tags.slice(0, 5).map((tag) => (
                          <Chip key={tag} size="small" variant="outlined" label={tag} />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {cursor && !loading && (
          <Button variant="outlined" onClick={() => loadPage(false)}>
            {t('packs.loadMore')}
          </Button>
        )}
      </Stack>

      {selectedPack && (
        <PackImportDialog
          pack={selectedPack}
          open={!!selectedPack}
          onClose={() => setSelectedPack(null)}
          onImported={onImported}
        />
      )}
    </Box>
  );
}
