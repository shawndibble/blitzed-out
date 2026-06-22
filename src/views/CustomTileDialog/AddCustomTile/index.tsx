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
import { FocusEvent, KeyboardEvent, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import Accordion from '@/components/Accordion';
import AccordionDetails from '@/components/Accordion/Details';
import AccordionSummary from '@/components/Accordion/Summary';
import CustomGroupDialog from '@/views/CustomGroupDialog';
import CustomTilePreview from './CustomTilePreview';
import { CustomGroupPull } from '@/types/customGroups';
import CustomGroupSelector from '@/components/CustomGroupSelector';
import { useGameSettings } from '@/stores/settingsStore';

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

  // Localized placeholder token shown on the reference chips, e.g. "{genitales}".
  // Falls back to the canonical name if the placeholders namespace is unavailable.
  const tokenLabel = (key: string): string => `{${t(`placeholders:tokens.${key}`, key)}}`;

  // UI state local to this view.
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [placeholderHelpOpen, setPlaceholderHelpOpen] = useState(false);

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
              slotProps={{ htmlInput: { maxLength: 2000 } }}
              value={draft.action}
              onChange={(event) => setDraftAction(event.target.value)}
              onKeyUp={(event) => {
                if (event.key === 'Enter') {
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
                  <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    {t('customTiles.placeholderHelp.description')}
                  </Typography>

                  {/* Role Placeholders */}
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {t('customTiles.placeholderHelp.rolePlaceholders')}
                  </Typography>
                  <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                      label={tokenLabel('player')}
                      size="small"
                      sx={{ fontFamily: 'monospace' }}
                      aria-label={t('customTiles.placeholderHelp.player')}
                    />
                    <Chip
                      label={tokenLabel('dom')}
                      size="small"
                      sx={{ fontFamily: 'monospace' }}
                      aria-label={t('customTiles.placeholderHelp.dom')}
                    />
                    <Chip
                      label={tokenLabel('sub')}
                      size="small"
                      sx={{ fontFamily: 'monospace' }}
                      aria-label={t('customTiles.placeholderHelp.sub')}
                    />
                  </Box>

                  {/* Anatomy Placeholders */}
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {t('customTiles.placeholderHelp.anatomyPlaceholders')}
                  </Typography>
                  <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                      label={tokenLabel('genital')}
                      size="small"
                      sx={{ fontFamily: 'monospace' }}
                      aria-label={t('customTiles.placeholderHelp.genital')}
                    />
                    <Chip
                      label={tokenLabel('hole')}
                      size="small"
                      sx={{ fontFamily: 'monospace' }}
                      aria-label={t('customTiles.placeholderHelp.hole')}
                    />
                    <Chip
                      label={tokenLabel('chest')}
                      size="small"
                      sx={{ fontFamily: 'monospace' }}
                      aria-label={t('customTiles.placeholderHelp.chest')}
                    />
                    <Chip
                      label={tokenLabel('pronoun_subject')}
                      size="small"
                      sx={{ fontFamily: 'monospace' }}
                      aria-label={t('customTiles.placeholderHelp.pronounSubject')}
                    />
                    <Chip
                      label={tokenLabel('pronoun_object')}
                      size="small"
                      sx={{ fontFamily: 'monospace' }}
                      aria-label={t('customTiles.placeholderHelp.pronounObject')}
                    />
                    <Chip
                      label={tokenLabel('pronoun_possessive')}
                      size="small"
                      sx={{ fontFamily: 'monospace' }}
                      aria-label={t('customTiles.placeholderHelp.pronounPossessive')}
                    />
                    <Chip
                      label={tokenLabel('pronoun_reflexive')}
                      size="small"
                      sx={{ fontFamily: 'monospace' }}
                      aria-label={t('customTiles.placeholderHelp.pronounReflexive')}
                    />
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
