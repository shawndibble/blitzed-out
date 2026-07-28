import { AddCustomTileProps } from '@/types/customTiles';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Collapse,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { ExpandMore, HelpOutlined } from '@mui/icons-material';
import { FocusEvent, KeyboardEvent, useLayoutEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import Accordion from '@/components/Accordion';
import AccordionDetails from '@/components/Accordion/Details';
import AccordionSummary from '@/components/Accordion/Summary';
import CustomGroupDialog from '@/views/CustomGroupDialog';
import CustomTilePreview from './CustomTilePreview';
import { CustomGroupPull } from '@/types/customGroups';
import CustomGroupSelector from '@/components/CustomGroupSelector';
import { insertPlaceholderToken } from './insertPlaceholderToken';
import { localizePlaceholders } from '@/services/placeholderAliasService';
import { MAX_ACTION_LENGTH } from '@/services/validationService';
import { ANATOMY_PLACEHOLDERS, AnatomyPlaceholder } from '@/types/localPlayers';
import { useGameSettings } from '@/stores/settingsStore';

interface TokenChip {
  token: string;
  /** camelCase key under customTiles.placeholderHelp (tokens are snake_case). */
  helpKey: string;
}

const ROLE_TOKENS: TokenChip[] = [
  { token: 'player', helpKey: 'player' },
  { token: 'dom', helpKey: 'dom' },
  { token: 'sub', helpKey: 'sub' },
];

// One chip per ANATOMY_PLACEHOLDERS entry — the Record key makes a new token a
// type error here until it gets a chip and a placeholderHelp string, rather
// than silently missing from the panel.
const ANATOMY_HELP_KEYS: Record<AnatomyPlaceholder, string> = {
  genital: 'genital',
  tip: 'tip',
  hole: 'hole',
  chest: 'chest',
  pronoun_subject: 'pronounSubject',
  pronoun_object: 'pronounObject',
  pronoun_possessive: 'pronounPossessive',
  pronoun_reflexive: 'pronounReflexive',
};

const ANATOMY_TOKENS: (TokenChip & { token: AnatomyPlaceholder })[] = ANATOMY_PLACEHOLDERS.map(
  (token) => ({ token, helpKey: ANATOMY_HELP_KEYS[token] })
);

export default function AddCustomTile({
  lifecycle,
  expanded,
  handleChange,
  tagList,
}: AddCustomTileProps) {
  const { t } = useTranslation();
  const { settings } = useGameSettings();

  const {
    sharedFilters,
    setSharedFilters,
    editTarget,
    clearEdit,
    draft,
    setDraftAction,
    setDraftTags,
    addDraftTag,
    tagInputValue,
    setTagInputValue,
    validationMessage,
    groups,
    selectedGroup,
    groupsRefreshTrigger,
    bumpGroupsRefresh,
    submitTile,
  } = lifecycle;

  const updateTileId = editTarget.tileId;

  // Chips show — and insert — the token in the same locale the save path
  // normalizes from (settings.locale), so a chip can never write an alias
  // that normalizePlaceholders would leave uncanonicalized. Unknown locale
  // maps degrade to canonical English, which is what the pipeline wants anyway.
  const locale = settings.locale || 'en';
  const tokenLabel = (key: string): string => localizePlaceholders(`{${key}}`, locale);

  // UI state local to this view.
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [placeholderHelpOpen, setPlaceholderHelpOpen] = useState(false);
  const [insertBlocked, setInsertBlocked] = useState(false);

  const actionInputRef = useRef<HTMLInputElement | null>(null);
  // Caret/selection snapshot for when the action field is *not* focused at
  // insert time: touch browsers drop focus before the chip's click handler
  // runs, and a keyboard-activated chip holds focus itself.
  const lastSelectionRef = useRef<[number, number] | null>(null);
  // Caret to restore once React commits the inserted token; null = nothing pending.
  const pendingCaretRef = useRef<number | null>(null);

  // True when some *other* text field holds focus.
  const otherFieldHasFocus = (element: Element | null): boolean =>
    element !== null &&
    element !== actionInputRef.current &&
    (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA');

  const restoreCaret = (caret: number): void => {
    const input = actionInputRef.current;
    if (!input) return;
    lastSelectionRef.current = [caret, caret];
    // Focus belongs to whatever text field the author is actually in; stealing
    // it would blur the tags input and commit a half-typed tag.
    if (!otherFieldHasFocus(document.activeElement)) input.focus({ preventScroll: true });
    if (document.activeElement === input) input.setSelectionRange(caret, caret);
  };

  // The action field is controlled, so the browser resets the caret to the end
  // on commit. Reapply the intended caret after that commit, not during the click.
  // No dep array: an insertion that leaves the text byte-identical must not
  // strand a pending caret for some later, unrelated render to apply.
  useLayoutEffect(() => {
    const caret = pendingCaretRef.current;
    if (caret === null) return;
    pendingCaretRef.current = null;
    restoreCaret(caret);
  });

  const insertToken = (key: string): void => {
    const input = actionInputRef.current;
    const focused = input !== null && document.activeElement === input;
    const selection = focused
      ? ([input.selectionStart, input.selectionEnd] as [number | null, number | null])
      : lastSelectionRef.current;
    const { text, caret, clamped } = insertPlaceholderToken(
      draft.action,
      selection?.[0] ?? null,
      selection?.[1] ?? null,
      tokenLabel(key),
      MAX_ACTION_LENGTH
    );

    setInsertBlocked(clamped);
    if (text === draft.action) {
      // Nothing changed (clamped, or the selection already held this token), so
      // the layout effect will not fire — put the caret back from here.
      restoreCaret(caret);
      return;
    }

    pendingCaretRef.current = caret;
    setDraftAction(text);
  };

  const renderTokenChip = ({ token, helpKey }: TokenChip) => (
    <Chip
      key={token}
      component="button"
      type="button"
      label={tokenLabel(token)}
      size="small"
      sx={{ fontFamily: 'monospace' }}
      aria-label={`${tokenLabel(token)} — ${t(`customTiles.placeholderHelp.${helpKey}`)}`}
      // Keep focus (and therefore the caret) in the action field on mouse click.
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => insertToken(token)}
    />
  );

  // Handle custom group creation
  const handleGroupCreated = (group: CustomGroupPull) => {
    setSharedFilters({
      ...sharedFilters,
      groupName: group.name, // Use group name for shared filters
      intensity: '', // Reset intensity when group changes
    });
    setGroupDialogOpen(false);
    bumpGroupsRefresh();
  };

  // Handle custom group updates/deletions
  const handleGroupUpdated = () => {
    bumpGroupsRefresh();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    switch (event.key) {
      case ',':
      case 'Enter': {
        event.preventDefault();
        event.stopPropagation();
        if (event.currentTarget.value.length > 0) {
          addDraftTag(event.currentTarget.value);
          setTagInputValue('');
        }
        break;
      }
      default:
    }
  };

  const handleTagInputBlur = (event: FocusEvent<HTMLInputElement>): void => {
    if (event.target.value.length > 0) {
      addDraftTag(event.target.value);
      setTagInputValue('');
    }

    // Give time for any click events to process before closing dropdown
    setTimeout(() => {
      // Close any open dropdown
      const popperElement = document.querySelector('.MuiAutocomplete-popper');
      if (popperElement) {
        (popperElement as HTMLElement).style.display = 'none';
      }
    }, 150);
  };

  return (
    <>
      <Accordion
        expanded={expanded === 'ctAdd'}
        onChange={handleChange('ctAdd')}
        className="about-accordion"
      >
        <AccordionSummary aria-controls="ctAdd-content" id="ctAdd-header">
          <Typography className="accordion-title">
            <Trans i18nKey={updateTileId ? 'ctUpdate' : 'ctAdd'} />
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box component="form" method="post" className="settings-box">
            {/* Game Mode Selection */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>{t('customTiles.gameMode')}</InputLabel>
              <Select
                value={sharedFilters.gameMode}
                onChange={(e) => {
                  setSharedFilters({
                    gameMode: e.target.value,
                    groupName: '', // Reset group when game mode changes
                    intensity: '', // Reset intensity when game mode changes
                  });
                }}
                label={t('customTiles.gameMode')}
              >
                <MenuItem value="online">{t('solo')}</MenuItem>
                <MenuItem value="local">{t('local')}</MenuItem>
              </Select>
            </FormControl>

            {/* Custom Group Selection */}
            <CustomGroupSelector
              value={selectedGroup?.id || ''}
              onChange={(groupId) => {
                // Find the group by ID and get its name for shared filters
                const group = groups.find((g) => g.id === groupId);
                setSharedFilters({
                  ...sharedFilters,
                  groupName: group?.name || '',
                  intensity: '', // Reset intensity when group changes
                });
              }}
              locale={settings.locale || 'en'}
              gameMode={sharedFilters.gameMode}
              refreshTrigger={groupsRefreshTrigger}
            />

            {/* Intensity Selection */}
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>{t('customTiles.intensityLevel')}</InputLabel>
              <Select
                value={sharedFilters.intensity}
                onChange={(e) => {
                  setSharedFilters({
                    ...sharedFilters,
                    intensity: e.target.value,
                  });
                }}
                label={t('customTiles.intensityLevel')}
              >
                {selectedGroup?.intensities.map((intensity) => (
                  <MenuItem key={intensity.value} value={intensity.value.toString()}>
                    {intensity.label} (Level {intensity.value})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Validation Message */}
            {validationMessage && (
              <Box sx={{ mt: 1, mb: 2 }}>
                <Typography color="error" variant="body2">
                  {validationMessage}
                </Typography>
              </Box>
            )}

            <TextField
              id="action"
              name="action"
              required
              fullWidth
              label={t('action')}
              sx={{ mt: 2, pb: 2 }}
              slotProps={{ htmlInput: { maxLength: MAX_ACTION_LENGTH } }}
              inputRef={actionInputRef}
              value={draft.action}
              onChange={(event) => {
                if (insertBlocked) setInsertBlocked(false);
                setDraftAction(event.target.value);
              }}
              onBlur={(event) => {
                // Snapshot the caret before focus leaves — a chip tap on touch
                // devices blurs the field before its click handler runs.
                const input = event.currentTarget;
                lastSelectionRef.current = [input.selectionStart ?? 0, input.selectionEnd ?? 0];
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  // The field lives inside a <Box component="form" method="post">;
                  // block the browser's native submit (full reload) and run ours.
                  event.preventDefault();
                  submitTile();
                }
              }}
            />

            <CustomTilePreview action={draft.action} settings={settings} />

            {/* Placeholder Help Section */}
            <Box sx={{ mb: 2 }}>
              <Button
                fullWidth
                variant="text"
                onClick={() => setPlaceholderHelpOpen(!placeholderHelpOpen)}
                aria-expanded={placeholderHelpOpen}
                aria-controls="placeholder-help-content"
                sx={{
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  mb: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                  borderRadius: 1,
                  p: 0.5,
                }}
              >
                <HelpOutlined sx={{ mr: 1, color: 'primary.main' }} />
                <Typography
                  variant="body2"
                  sx={{ flexGrow: 1, color: 'primary.main', textAlign: 'left' }}
                >
                  {t('customTiles.placeholderHelp.title')}
                </Typography>
                <ExpandMore
                  sx={{
                    transform: placeholderHelpOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                    color: 'primary.main',
                  }}
                  aria-hidden="true"
                />
              </Button>

              <Collapse in={placeholderHelpOpen} id="placeholder-help-content">
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'action.selected',
                    borderRadius: 1,
                    borderLeft: 3,
                    borderLeftColor: 'primary.main',
                  }}
                >
                  <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                    {t('customTiles.placeholderHelp.description')}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ mb: 2, display: 'block', color: 'primary.main' }}
                  >
                    {t('customTiles.placeholderHelp.clickToInsert')}
                  </Typography>
                  {insertBlocked && (
                    <Typography
                      variant="caption"
                      role="alert"
                      sx={{ mb: 2, display: 'block' }}
                      color="error"
                    >
                      {t('customTiles.placeholderHelp.insertTooLong')}
                    </Typography>
                  )}

                  {/* Role Placeholders */}
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {t('customTiles.placeholderHelp.rolePlaceholders')}
                  </Typography>
                  <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {ROLE_TOKENS.map(renderTokenChip)}
                  </Box>

                  {/* Anatomy Placeholders */}
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {t('customTiles.placeholderHelp.anatomyPlaceholders')}
                  </Typography>
                  <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {ANATOMY_TOKENS.map(renderTokenChip)}
                  </Box>

                  {/* Example */}
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {t('customTiles.placeholderHelp.examples')}
                  </Typography>
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                    }}
                  >
                    <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                      {t('customTiles.placeholderHelp.exampleAction')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                      → {t('customTiles.placeholderHelp.exampleResult')}
                    </Typography>
                  </Box>
                </Box>
              </Collapse>
            </Box>

            <Autocomplete
              id="tags"
              disableCloseOnSelect
              multiple
              freeSolo
              options={tagList}
              value={draft.tags}
              onChange={(_event, newValues) => {
                setDraftTags(newValues as string[]);
              }}
              inputValue={tagInputValue}
              onInputChange={(_event, newInputValue) => {
                setTagInputValue(newInputValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('tags')}
                  onKeyDown={handleKeyDown}
                  onBlur={handleTagInputBlur}
                />
              )}
              sx={{ pb: 2 }}
              clearOnBlur
              blurOnSelect
              openOnFocus
              disablePortal={false}
              slotProps={{
                popper: {
                  modifiers: [
                    {
                      name: 'preventOverflow',
                      options: {
                        altAxis: true,
                        altBoundary: true,
                        padding: 8,
                      },
                    },
                  ],
                },
              }}
            />

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: { xs: 'stretch', sm: 'space-evenly' },
                gap: 1,
              }}
            >
              <Button variant="outlined" type="button" onClick={() => setGroupDialogOpen(true)}>
                {t('manageGroups.title')}
              </Button>
              <Button variant="contained" type="button" onClick={() => clearEdit()}>
                <Trans i18nKey="clear" />
              </Button>
              <Button variant="contained" type="button" onClick={submitTile}>
                <Trans i18nKey={updateTileId ? 'ctUpdate' : 'ctAdd'} />
              </Button>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
      {/* Custom Group Management Dialog */}
      <CustomGroupDialog
        open={groupDialogOpen}
        onClose={() => setGroupDialogOpen(false)}
        onGroupCreated={handleGroupCreated}
        onGroupUpdated={handleGroupUpdated}
        locale={settings.locale || 'en'}
        gameMode={sharedFilters.gameMode}
      />
    </>
  );
}
