import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Publish } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import Accordion from '@/components/Accordion';
import AccordionSummary from '@/components/Accordion/Summary';
import AccordionDetails from '@/components/Accordion/Details';
import CopyToClipboard from '@/components/CopyToClipboard';
import PackImportDialog from './PackImportDialog';
import {
  buildPackContents,
  getPack,
  listPublishableGroups,
  publishPack,
} from '@/services/contentPacks';
import useAuth from '@/context/hooks/useAuth';
import { useGameSettings } from '@/stores/settingsStore';
import { GAME_MODES } from '@/services/migration/constants';
import type { ContentPackDoc, PackVisibility } from '@/types/contentPacks';

interface PacksProps {
  expanded: string;
  handleChange: (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => void;
  // Game mode is owned by the parent so the publish form and the directory pane stay in sync.
  gameMode: string;
  onGameModeChange: (mode: string) => void;
  onImported?: (packName: string) => void;
}

export default function Packs({
  expanded,
  handleChange,
  gameMode,
  onGameModeChange,
  onImported,
}: PacksProps) {
  const { t } = useTranslation();
  const { settings } = useGameSettings();
  const { isAnonymous } = useAuth();
  const locale = settings.locale || 'en';

  const groups =
    useLiveQuery(() => listPublishableGroups(gameMode, locale), [gameMode, locale]) ?? [];

  // Publish form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<PackVisibility>('public');
  const [publishing, setPublishing] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Anonymous accounts can only publish privately; force the choice.
  useEffect(() => {
    if (isAnonymous) setVisibility('private');
  }, [isAnonymous]);

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
        groupNames: selectedGroups,
      });
      // Enforce the anonymous-private constraint at submit time so a publish
      // fired before the visibility effect settles can't slip through as public.
      const effectiveVisibility: PackVisibility = isAnonymous ? 'private' : visibility;
      const packId = await publishPack(
        {
          name: name.trim(),
          description: description.trim(),
          gameMode,
          locale,
          visibility: effectiveVisibility,
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
      setSelectedGroups([]);
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

  const canPublish = name.trim().length > 0 && selectedGroups.length > 0 && !publishing;

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

            {/* Publish */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('packs.publishTitle')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
                {GAME_MODES.map((mode) => (
                  <Chip
                    key={mode}
                    label={t(`gameMode.${mode}`)}
                    color={mode === gameMode ? 'primary' : 'default'}
                    variant={mode === gameMode ? 'filled' : 'outlined'}
                    onClick={() => {
                      onGameModeChange(mode);
                      setSelectedGroups([]);
                    }}
                  />
                ))}
              </Box>
              {groups.length === 0 ? (
                <Alert severity="info">
                  <AlertTitle>{t('packs.noGroupsTitle')}</AlertTitle>
                  {t('packs.noGroupsBody')}
                </Alert>
              ) : (
                <Stack spacing={1.5}>
                  <FormControl size="small" fullWidth>
                    <InputLabel id="pack-groups-label">{t('packs.selectGroups')}</InputLabel>
                    <Select
                      labelId="pack-groups-label"
                      multiple
                      value={selectedGroups}
                      onChange={(e) =>
                        setSelectedGroups(
                          typeof e.target.value === 'string'
                            ? e.target.value.split(',')
                            : e.target.value
                        )
                      }
                      input={<OutlinedInput label={t('packs.selectGroups')} />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const g = groups.find((gr) => gr.name === value);
                            return <Chip key={value} size="small" label={g?.label ?? value} />;
                          })}
                        </Box>
                      )}
                    >
                      {groups.length === 0 && (
                        <MenuItem disabled value="">
                          {t('packs.noGroups')}
                        </MenuItem>
                      )}
                      {groups.map((g) => (
                        <MenuItem key={g.name} value={g.name}>
                          <Checkbox checked={selectedGroups.includes(g.name)} />
                          <ListItemText
                            primary={
                              g.isExtension ? (
                                <Box
                                  component="span"
                                  sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
                                >
                                  {g.label}
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    label={t('packs.extendsDefault')}
                                  />
                                </Box>
                              ) : (
                                g.label
                              )
                            }
                            secondary={
                              g.isExtension && g.addedIntensityCount > 0
                                ? `${t('packs.groupTileCount', { count: g.tileCount })} · ${t('packs.addedLevelCount', { count: g.addedIntensityCount })}`
                                : t('packs.groupTileCount', { count: g.tileCount })
                            }
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
                  <FormControl size="small" fullWidth>
                    <InputLabel id="pack-visibility-label">{t('packs.visibility')}</InputLabel>
                    <Select
                      labelId="pack-visibility-label"
                      value={visibility}
                      label={t('packs.visibility')}
                      onChange={(e) => setVisibility(e.target.value as PackVisibility)}
                    >
                      <MenuItem value="public" disabled={isAnonymous}>
                        {isAnonymous ? (
                          <Tooltip title={t('packs.publicNeedsAccount')} placement="right">
                            <Box component="span" sx={{ pointerEvents: 'auto' }}>
                              {t('packs.visibilityPublic')}
                            </Box>
                          </Tooltip>
                        ) : (
                          t('packs.visibilityPublic')
                        )}
                      </MenuItem>
                      <MenuItem value="private">{t('packs.visibilityPrivate')}</MenuItem>
                    </Select>
                    {isAnonymous ? (
                      <FormHelperText>{t('packs.anonymousPrivateOnly')}</FormHelperText>
                    ) : (
                      visibility === 'public' && (
                        <FormHelperText>{t('packs.publicHelper')}</FormHelperText>
                      )
                    )}
                  </FormControl>
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
