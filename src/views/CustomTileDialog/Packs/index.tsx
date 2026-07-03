import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Accordion from '@/components/Accordion';
import AccordionSummary from '@/components/Accordion/Summary';
import AccordionDetails from '@/components/Accordion/Details';
import PackImportDialog from './PackImportDialog';
import { getPack } from '@/services/contentPacks';
import type { ContentPackDoc } from '@/types/contentPacks';

interface PacksProps {
  expanded: string;
  handleChange: (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => void;
  // Game mode is owned by the parent so this tab and the directory pane stay in sync.
  gameMode: string;
  onGameModeChange: (mode: string) => void;
  onImported?: (packName: string, pack?: ContentPackDoc) => void;
}

/**
 * Packs tab: import a pack by code/link, or jump to the route-level pack
 * creator. Publishing moved to /packs/create (PackCreator) — one linear flow
 * instead of a form buried in an accordion.
 */
export default function Packs({ expanded, handleChange, onImported }: PacksProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [importing, setImporting] = useState(false);
  const [pendingPack, setPendingPack] = useState<ContentPackDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  function extractPackId(input: string): string {
    const trimmed = input.trim();
    try {
      const url = new URL(trimmed);
      return url.searchParams.get('importPack') || trimmed;
    } catch {
      return trimmed;
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

  return (
    <>
      <Accordion
        expanded={expanded === 'ctPacks'}
        onChange={handleChange('ctPacks')}
        className="about-accordion"
      >
        <AccordionSummary aria-controls="ctPacks-content" id="ctPacks-header">
          <Typography className="accordion-title">{t('packs.title')}</Typography>
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

            {/* Create / edit packs in the dedicated flow */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('packs.publishTitle')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                {t('packCreator.tabTeaser')}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AutoAwesome />}
                onClick={() => navigate('/packs/create')}
              >
                {t('packCreator.openCta')}
              </Button>
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
