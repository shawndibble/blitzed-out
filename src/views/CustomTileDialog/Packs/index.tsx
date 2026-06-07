import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Delete, Inventory, Publish, Update } from '@mui/icons-material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import Accordion from '@/components/Accordion';
import AccordionSummary from '@/components/Accordion/Summary';
import AccordionDetails from '@/components/Accordion/Details';
import CopyToClipboard from '@/components/CopyToClipboard';
import PackImportDialog from './PackImportDialog';
import { buildPackContents, getPack, publishPack, unsubscribePack } from '@/services/contentPacks';
import { getSubscriptions } from '@/stores/packSubscriptions';
import { useGameSettings } from '@/stores/settingsStore';
import type { ContentPackDoc } from '@/types/contentPacks';

interface PacksProps {
  expanded: string;
  handleChange: (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => void;
  onImported?: () => void;
}

export default function Packs({ expanded, handleChange, onImported }: PacksProps) {
  const { t } = useTranslation();
  const { settings } = useGameSettings();
  const gameMode = settings.gameMode || 'online';
  const locale = settings.locale || 'en';

  const subscriptions = useLiveQuery(() => getSubscriptions(), []) ?? [];

  // Publish form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [consent, setConsent] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Import-by-code
  const [code, setCode] = useState('');
  const [importing, setImporting] = useState(false);
  const [pendingPack, setPendingPack] = useState<ContentPackDoc | null>(null);

  function buildShareLink(packId: string): string {
    const url = new URL(window.location.href);
    url.searchParams.set('importPack', packId);
    return url.toString();
  }

  function extractPackId(input: string): string {
    const trimmed = input.trim();
    try {
      const url = new URL(trimmed);
      return url.searchParams.get('importPack') || trimmed;
    } catch {
      return trimmed;
    }
  }

  async function handlePublish(): Promise<void> {
    setPublishing(true);
    setError(null);
    setShareLink(null);
    try {
      const { contents, contentHash } = await buildPackContents({
        locales: [locale],
        gameModes: [gameMode],
        includeDisabledDefaults: false,
      });
      const packId = await publishPack(
        {
          name: name.trim(),
          description: description.trim(),
          gameMode,
          locale,
          tags: tags
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 20),
        },
        contents,
        contentHash
      );
      setShareLink(buildShareLink(packId));
      setName('');
      setDescription('');
      setTags('');
      setConsent(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPublishing(false);
    }
  }

  async function handleImportByCode(): Promise<void> {
    const id = extractPackId(code);
    if (!id) return;
    setImporting(true);
    setError(null);
    try {
      const pack = await getPack(id);
      if (!pack) {
        setError(t('packs.notFound'));
        return;
      }
      setPendingPack(pack);
      setCode('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setImporting(false);
    }
  }

  async function handleUpdate(packId: string): Promise<void> {
    setError(null);
    try {
      const pack = await getPack(packId);
      if (pack) setPendingPack(pack);
      else setError(t('packs.notFound'));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleUnsubscribe(packId: string): Promise<void> {
    setError(null);
    try {
      await unsubscribePack(packId);
      onImported?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const canPublish = name.trim().length > 0 && consent && !publishing;

  return (
    <>
      <Accordion expanded={expanded === 'ctPacks'} onChange={handleChange('ctPacks')}>
        <AccordionSummary aria-controls="ctPacks-content" id="ctPacks-header">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <Inventory color="primary" />
            <Typography className="accordion-title">{t('packs.title')}</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}

            {/* Import by code / link */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('packs.importByCode')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t('packs.codePlaceholder')}
                  slotProps={{ htmlInput: { 'aria-label': t('packs.importByCode') } }}
                />
                <Button
                  variant="outlined"
                  onClick={handleImportByCode}
                  disabled={importing || !code.trim()}
                >
                  {importing ? <CircularProgress size={18} /> : t('packs.import')}
                </Button>
              </Box>
            </Box>

            <Divider />

            {/* Publish */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('packs.publishTitle', { gameMode, locale })}
              </Typography>
              <Stack spacing={1.5}>
                <TextField
                  label={t('packs.name')}
                  size="small"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  slotProps={{ htmlInput: { maxLength: 100 } }}
                />
                <TextField
                  label={t('packs.description')}
                  size="small"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                  slotProps={{ htmlInput: { maxLength: 1000 } }}
                />
                <TextField
                  label={t('packs.tags')}
                  size="small"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  fullWidth
                  placeholder={t('packs.tagsPlaceholder')}
                />
                <FormControlLabel
                  control={
                    <Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                  }
                  label={<Typography variant="caption">{t('packs.consent')}</Typography>}
                />
                <Button
                  variant="contained"
                  startIcon={publishing ? <CircularProgress size={16} /> : <Publish />}
                  onClick={handlePublish}
                  disabled={!canPublish}
                >
                  {t('packs.publish')}
                </Button>
                {shareLink && (
                  <Alert severity="success" sx={{ wordBreak: 'break-all' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{shareLink}</span>
                      <CopyToClipboard text={shareLink} />
                    </Box>
                  </Alert>
                )}
              </Stack>
            </Box>

            <Divider />

            {/* My subscriptions */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('packs.mySubscriptions')}
              </Typography>
              {subscriptions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t('packs.noSubscriptions')}
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {subscriptions.map((sub) => (
                    <Box key={sub.packId} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" noWrap>
                          {sub.name}
                        </Typography>
                        <Chip size="small" label={`v${sub.packVersion}`} sx={{ mt: 0.5 }} />
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => handleUpdate(sub.packId)}
                        aria-label={t('packs.checkUpdate')}
                      >
                        <Update fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleUnsubscribe(sub.packId)}
                        aria-label={t('packs.unsubscribe')}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {pendingPack && (
        <PackImportDialog
          pack={pendingPack}
          open={!!pendingPack}
          onClose={() => setPendingPack(null)}
          onImported={onImported}
        />
      )}
    </>
  );
}
