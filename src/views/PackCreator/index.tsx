import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { Add, ArrowBack, Close, Edit, Publish } from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';

import CopyToClipboard from '@/components/CopyToClipboard';
import CustomGroupDialog from '@/views/CustomGroupDialog';
import {
  buildPackContents,
  getPack,
  listMyPacks,
  listPublishableGroups,
  parsePack,
  publishPack,
  republishPack,
} from '@/services/contentPacks';
import { addCustomTile, getTiles } from '@/stores/customTiles';
import { getCustomGroups } from '@/stores/customGroups';
import { validateCustomTileWithGroups } from '@/services/validationService';
import { normalizePlaceholders } from '@/services/placeholderAliasService';
import { analytics } from '@/services/analytics';
import useAuth from '@/context/hooks/useAuth';
import { useGameSettings } from '@/stores/settingsStore';
import { getContentGameMode } from '@/helpers/strings';
import { GAME_MODES } from '@/services/migration/constants';
import type { ContentPackDoc, PackVisibility } from '@/types/contentPacks';
import type { CustomTile } from '@/types/customTiles';

function buildShareLink(packId: string): string {
  const url = new URL(window.location.origin);
  url.pathname = '/PUBLIC';
  url.searchParams.set('importPack', packId);
  return url.toString();
}

/** Minimal inline tile author so a blank-start pack never needs another dialog. */
function QuickTileAdd({ locale, gameMode }: { locale: string; gameMode: string }) {
  const { t } = useTranslation();
  const groups =
    useLiveQuery(() => getCustomGroups({ locale, gameMode }), [locale, gameMode]) ?? [];
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [intensity, setIntensity] = useState<number | ''>('');
  const [action, setAction] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const group = groups.find((g) => g.name === groupName);

  const handleAdd = async () => {
    if (!group || intensity === '' || !action.trim()) return;
    setSaving(true);
    setFeedback(null);
    try {
      // Mirror the canonical author path: normalize localized placeholder
      // tokens to canonical English before validation, dedup, and storage.
      const normalizedAction = normalizePlaceholders(action.trim(), locale);
      const tile = {
        group_id: group.id,
        intensity: Number(intensity),
        action: normalizedAction,
        tags: [],
        isCustom: 1,
      } as CustomTile;
      const result = await validateCustomTileWithGroups(tile, locale, gameMode);
      if (!result.isValid) {
        setFeedback({ ok: false, message: result.errors.join(' ') });
        return;
      }
      // Reject a duplicate (same group + intensity + action) rather than
      // silently writing a second identical tile.
      const existing = await getTiles({ group_id: group.id, intensity: Number(intensity) });
      if (existing.some((existingTile) => existingTile.action === normalizedAction)) {
        setFeedback({ ok: false, message: t('actionExists') });
        return;
      }
      await addCustomTile(tile);
      setAction('');
      setFeedback({ ok: true, message: t('packCreator.tileAdded') });
    } catch (e) {
      setFeedback({ ok: false, message: e instanceof Error ? e.message : String(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Button size="small" startIcon={<Add />} onClick={() => setOpen((v) => !v)}>
        {t('packCreator.quickAddTile')}
      </Button>
      <Collapse in={open}>
        <Stack spacing={1.5} sx={{ mt: 1.5 }}>
          {feedback && (
            <Alert severity={feedback.ok ? 'success' : 'error'}>{feedback.message}</Alert>
          )}
          <FormControl size="small" fullWidth>
            <InputLabel id="quick-tile-group">{t('group')}</InputLabel>
            <Select
              labelId="quick-tile-group"
              value={groupName}
              label={t('group')}
              onChange={(e) => {
                setGroupName(e.target.value);
                setIntensity('');
              }}
            >
              {groups.map((g) => (
                <MenuItem key={g.name} value={g.name}>
                  {g.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {group && (
            <FormControl size="small" fullWidth>
              <InputLabel id="quick-tile-intensity">{t('intensity')}</InputLabel>
              <Select
                labelId="quick-tile-intensity"
                value={intensity}
                label={t('intensity')}
                onChange={(e) => setIntensity(e.target.value as number)}
              >
                {group.intensities.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    {level.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <TextField
            label={t('action')}
            size="small"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            slotProps={{ htmlInput: { maxLength: 2000 } }}
          />
          <Button
            variant="outlined"
            onClick={handleAdd}
            disabled={saving || !group || intensity === '' || !action.trim()}
          >
            {saving ? <CircularProgress size={18} /> : t('packCreator.addAction')}
          </Button>
        </Stack>
      </Collapse>
    </Box>
  );
}

export default function PackCreator() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { settings } = useGameSettings();
  const { user, isAnonymous } = useAuth();
  const [editingPack, setEditingPack] = useState<ContentPackDoc | null>(null);
  // When republishing, the pack's own locale is authoritative — a pack authored
  // in another language must not be re-serialized under the current UI language
  // (that would export empty contents). New packs use the UI locale.
  const locale = editingPack?.locale || settings.locale || 'en';

  const [step, setStep] = useState(0);
  const [gameMode, setGameMode] = useState<string>(getContentGameMode(settings.gameMode));
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState<PackVisibility>(isAnonymous ? 'private' : 'public');
  const [myPacks, setMyPacks] = useState<ContentPackDoc[]>([]);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groups =
    useLiveQuery(() => listPublishableGroups(gameMode, locale), [gameMode, locale]) ?? [];

  useEffect(() => {
    analytics.trackPackEvent('pack_creation_started');
  }, []);

  useEffect(() => {
    if (isAnonymous) setVisibility('private');
  }, [isAnonymous]);

  // Republish path: my published packs are editable starting points.
  useEffect(() => {
    listMyPacks()
      .then(setMyPacks)
      .catch(() => setMyPacks([]));
  }, [user?.uid]);

  const enterEditMode = (pack: ContentPackDoc) => {
    setEditingPack(pack);
    setGameMode(pack.gameMode);
    setName(pack.name);
    setDescription(pack.description);
    setTags((pack.tags || []).join(', '));
    setVisibility(isAnonymous ? 'private' : pack.visibility);
    const parsed = parsePack(pack);
    // Extensions-only packs carry no customGroups entry for the default groups
    // they extend — seed those names too or the republish selection comes up
    // empty and the extensions are dropped.
    const packGroupNames = [
      ...(parsed?.data.data.customGroups || []).map((g) => g.name),
      ...(parsed?.data.data.groupExtensions || []).map((e) => e.groupName),
    ];
    setSelectedGroups(packGroupNames);
    setShareLink(null);
    setStep(0);
  };

  // Deep link: /packs/create?edit=<id> (author only)
  useEffect(() => {
    if (!editId || !user) return;
    getPack(editId).then((pack) => {
      if (pack && pack.author === user.uid) enterEditMode(pack);
    });
    // eslint-disable-next-line @eslint-react/exhaustive-deps
  }, [editId, user?.uid]);

  const toggleGroup = (groupName: string) =>
    setSelectedGroups((prev) =>
      prev.includes(groupName) ? prev.filter((g) => g !== groupName) : [...prev, groupName]
    );

  const selectedWithTiles = useMemo(
    () => groups.filter((g) => selectedGroups.includes(g.name)),
    [groups, selectedGroups]
  );

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);
    try {
      const { contents, contentHash } = await buildPackContents({
        locales: [locale],
        gameModes: [gameMode],
        groupNames: selectedGroups,
      });
      // Enforce anonymous-private at submit time, not just in the UI.
      const effectiveVisibility: PackVisibility = isAnonymous ? 'private' : visibility;
      const meta = {
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
      };
      let packId: string;
      if (editingPack) {
        await republishPack(editingPack.id, contents, contentHash, meta);
        packId = editingPack.id;
      } else {
        packId = await publishPack(meta, contents, contentHash);
      }
      analytics.trackPackEvent('pack_creation_completed', {
        group_count: selectedGroups.length,
        is_republish: editingPack ? 'true' : 'false',
      });
      setShareLink(buildShareLink(packId));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPublishing(false);
    }
  };

  const close = () => {
    navigate(`/${settings.room || 'PUBLIC'}`);
  };

  const steps = [
    t('packCreator.stepContent'),
    t('packCreator.stepDetails'),
    t('packCreator.stepPublish'),
  ];
  const nextDisabled =
    (step === 0 && selectedGroups.length === 0) || (step === 1 && name.trim().length === 0);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {editingPack
              ? t('packCreator.editTitle', { name: editingPack.name })
              : t('packCreator.title')}
          </Typography>
          <IconButton edge="end" onClick={close} aria-label={t('close')}>
            <Close />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 3, flexGrow: 1 }}>
        <Stepper activeStep={step} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {step === 0 && (
          <Stack spacing={2}>
            {myPacks.length > 0 && !editingPack && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t('packCreator.editExisting')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {myPacks.map((pack) => (
                    <Chip
                      key={pack.id}
                      icon={<Edit />}
                      label={pack.name}
                      variant="outlined"
                      onClick={() => enterEditMode(pack)}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {!editingPack && (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {GAME_MODES.map((mode) => (
                  <Chip
                    key={mode}
                    label={t(`gameMode.${mode}`)}
                    color={mode === gameMode ? 'primary' : 'default'}
                    variant={mode === gameMode ? 'filled' : 'outlined'}
                    onClick={() => {
                      setGameMode(mode);
                      setSelectedGroups([]);
                    }}
                  />
                ))}
              </Box>
            )}

            {groups.length === 0 ? (
              <Alert severity="info">{t('packCreator.noGroups')}</Alert>
            ) : (
              <Stack spacing={1}>
                {groups.map((g) => (
                  <Card
                    key={g.name}
                    variant="outlined"
                    sx={{
                      borderColor: selectedGroups.includes(g.name) ? 'primary.main' : 'divider',
                    }}
                  >
                    <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                      <FormControlLabel
                        sx={{ width: '100%', m: 0 }}
                        control={
                          <Checkbox
                            checked={selectedGroups.includes(g.name)}
                            onChange={() => toggleGroup(g.name)}
                          />
                        }
                        label={
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <Typography variant="body1">{g.label}</Typography>
                              {g.isExtension && (
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  label={t('packs.extendsDefault')}
                                />
                              )}
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {g.isExtension && g.addedIntensityCount > 0
                                ? `${t('packs.groupTileCount', { count: g.tileCount })} · ${t('packs.addedLevelCount', { count: g.addedIntensityCount })}`
                                : t('packs.groupTileCount', { count: g.tileCount })}
                            </Typography>
                          </Box>
                        }
                      />
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button size="small" startIcon={<Add />} onClick={() => setGroupDialogOpen(true)}>
                {t('packCreator.newGroup')}
              </Button>
              <QuickTileAdd locale={locale} gameMode={gameMode} />
            </Box>
          </Stack>
        )}

        {step === 1 && (
          <Stack spacing={2}>
            <TextField
              label={t('packs.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />
            <TextField
              label={t('packs.description')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              minRows={3}
              slotProps={{ htmlInput: { maxLength: 1000 } }}
            />
            <TextField
              label={t('packs.tags')}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              fullWidth
              placeholder={t('packs.tagsPlaceholder')}
            />
            <FormControl fullWidth>
              <InputLabel id="creator-visibility">{t('packs.visibility')}</InputLabel>
              <Select
                labelId="creator-visibility"
                value={visibility}
                label={t('packs.visibility')}
                onChange={(e) => setVisibility(e.target.value as PackVisibility)}
              >
                <MenuItem value="public" disabled={isAnonymous}>
                  {t('packs.visibilityPublic')}
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
          </Stack>
        )}

        {step === 2 && (
          <Stack spacing={2}>
            <Typography variant="h6">{name.trim()}</Typography>
            {description.trim() && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {description.trim()}
              </Typography>
            )}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('packCreator.reviewGroups', { count: selectedWithTiles.length })}
              </Typography>
              <Stack spacing={0.5}>
                {selectedWithTiles.map((g) => (
                  <Typography key={g.name} variant="body2">
                    • {g.label} — {t('packs.groupTileCount', { count: g.tileCount })}
                  </Typography>
                ))}
              </Stack>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {visibility === 'public' && !isAnonymous
                ? t('packCreator.willBePublic')
                : t('packCreator.willBePrivate')}
              {editingPack &&
                ` · ${t('packCreator.willBumpVersion', { version: editingPack.packVersion + 1 })}`}
            </Typography>
            {shareLink ? (
              <Alert severity="success" sx={{ wordBreak: 'break-all' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{shareLink}</span>
                  <CopyToClipboard text={shareLink} />
                </Box>
              </Alert>
            ) : (
              <Button
                variant="contained"
                size="large"
                startIcon={publishing ? <CircularProgress size={18} /> : <Publish />}
                onClick={handlePublish}
                disabled={publishing || !name.trim() || selectedGroups.length === 0}
              >
                {editingPack ? t('packCreator.republish') : t('packs.publish')}
              </Button>
            )}
          </Stack>
        )}
      </Container>

      {/* Sticky bottom navigation */}
      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          borderTop: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          p: 2,
          pb: 'max(16px, env(safe-area-inset-bottom))',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        {step > 0 ? (
          <Button startIcon={<ArrowBack />} onClick={() => setStep(step - 1)}>
            {t('previous')}
          </Button>
        ) : (
          <Box />
        )}
        {step < 2 ? (
          <Button variant="contained" disabled={nextDisabled} onClick={() => setStep(step + 1)}>
            {t('next')}
          </Button>
        ) : shareLink ? (
          <Button variant="contained" onClick={close}>
            {t('done')}
          </Button>
        ) : (
          <Box />
        )}
      </Box>

      <CustomGroupDialog
        open={groupDialogOpen}
        onClose={() => setGroupDialogOpen(false)}
        onGroupCreated={(group) => {
          setSelectedGroups((prev) => [...prev, group.name]);
          setGroupDialogOpen(false);
        }}
        locale={locale}
        gameMode={gameMode}
      />
    </Box>
  );
}
