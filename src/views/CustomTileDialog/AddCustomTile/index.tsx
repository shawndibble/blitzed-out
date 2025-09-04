import { AddCustomTileProps, CustomTile } from '@/types/customTiles';
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { FocusEvent, KeyboardEvent, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { addCustomTile, updateCustomTile } from '@/stores/customTiles';

import Accordion from '@/components/Accordion';
import AccordionDetails from '@/components/Accordion/Details';
import AccordionSummary from '@/components/Accordion/Summary';
import CustomGroupDialog from '@/views/CustomGroupDialog';
import { CustomGroupPull } from '@/types/customGroups';
import CustomGroupSelector from '@/components/CustomGroupSelector';
import { submitCustomAction } from '@/services/firebase';
import { useEditorGroupsReactive } from '@/hooks/useGroupFiltering';
import { useGameSettings } from '@/stores/settingsStore';
import { validateCustomTileWithGroups } from '@/services/validationService';

export default function AddCustomTile({
  setSubmitMessage,
  boardUpdated,
  customTiles,
  mappedGroups: _mappedGroups,
  expanded,
  handleChange,
  tagList,
  updateTileId,
  setUpdateTileId,
  editTileData,
  setEditTileData,
  sharedFilters,
  setSharedFilters,
}: AddCustomTileProps) {
  const { t } = useTranslation();
  const { settings } = useGameSettings();

  // Use shared filters for two-way binding with ViewCustomTiles
  const [localTileData, setLocalTileData] = useState<{
    action: string;
    tags: string[];
  }>({
    action: '',
    tags: [t('custom')],
  });

  // UI state for custom group management
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [groupsRefreshTrigger, setGroupsRefreshTrigger] = useState(0);

  // Get groups for current locale/gameMode using shared filters
  const { groups } = useEditorGroupsReactive(sharedFilters.gameMode, settings.locale || 'en');

  // Auto-select first group if none selected and groups are available (only for new tiles)
  useEffect(() => {
    if (!updateTileId && groups.length > 0 && !sharedFilters.groupName) {
      const firstGroup = groups[0];
      setSharedFilters({
        ...sharedFilters,
        groupName: firstGroup.name,
        intensity: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateTileId, groups.length, sharedFilters.groupName]); // Only depend on specific values that matter for this logic

  // Find the selected group by name from shared filters
  const selectedGroup = groups.find((group) => group.name === sharedFilters.groupName);

  // Migration is handled at app level - removed redundant migration call

  // Validate form data with debouncing to prevent excessive re-renders
  useEffect(() => {
    const validateForm = async () => {
      if (!selectedGroup || !sharedFilters.intensity || !localTileData.action) {
        setValidationMessage('');
        return;
      }

      try {
        const validation = await validateCustomTileWithGroups(
          {
            group_id: selectedGroup.id, // Use the selected group's ID
            intensity: Number(sharedFilters.intensity),
            action: localTileData.action,
            tags: localTileData.tags,
            isCustom: 1,
          },
          settings.locale || 'en',
          sharedFilters.gameMode
        );

        if (!validation.isValid) {
          setValidationMessage(validation.errors.join(', '));
        } else {
          setValidationMessage('');
        }
      } catch (error) {
        console.error('Error validating tile:', error);
        setValidationMessage('');
      }
    };

    // Debounce validation to prevent excessive calls while typing
    // 300ms provides responsive feedback while avoiding excessive validation calls.
    // This timing is optimal for the lightweight validation operations performed here.
    const timeoutId = setTimeout(validateForm, 300);
    return () => clearTimeout(timeoutId);
  }, [
    selectedGroup,
    sharedFilters.intensity,
    sharedFilters.gameMode,
    localTileData.action,
    localTileData.tags,
    settings.locale,
  ]);

  // Handle editing a tile
  useEffect(() => {
    if (!updateTileId) return;

    // Use editTileData if available (passed from ViewCustomTiles), otherwise fallback to searching customTiles
    const editTile =
      editTileData ||
      (Array.isArray(customTiles) ? customTiles.find(({ id }) => id === updateTileId) : null);

    if (editTile) {
      // Find the group by ID to get its name for shared filters
      const tileGroup = groups.find((group) => group.id === editTile.group_id);

      // Only update if values are different to prevent loops
      const newGroupName = tileGroup?.name || '';
      const newIntensity = editTile.intensity ? editTile.intensity.toString() : '';

      if (sharedFilters.groupName !== newGroupName || sharedFilters.intensity !== newIntensity) {
        setSharedFilters({
          ...sharedFilters,
          groupName: newGroupName,
          intensity: newIntensity,
        });
      }

      setLocalTileData({
        action: editTile.action || '',
        tags: editTile.tags || [t('custom')],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateTileId, editTileData, customTiles, groups, t]); // Remove sharedFilters and setSharedFilters to prevent interference with user input

  function tileExists(
    group_id: string,
    intensity: string | number,
    newAction: string
  ): CustomTile | undefined {
    const tilesArray = Array.isArray(customTiles) ? customTiles : [];
    return tilesArray.find(
      (tile) =>
        tile.group_id === group_id && tile.intensity === intensity && tile.action === newAction
    );
  }

  function clear(): void {
    // Exit edit mode
    setUpdateTileId(null);
    setEditTileData?.(null);

    // Only clear form fields (action and tags), preserve filters
    setLocalTileData({
      action: '',
      tags: [t('custom')],
    });
    setValidationMessage('');

    // Don't reset sharedFilters - user's selected gameMode, group, and intensity should remain
  }

  // Handle custom group creation
  const handleGroupCreated = (group: CustomGroupPull) => {
    setSharedFilters({
      ...sharedFilters,
      groupName: group.name, // Use group name for shared filters
      intensity: '', // Reset intensity when group changes
    });
    setGroupDialogOpen(false);
    // Trigger refresh of groups in selector
    setGroupsRefreshTrigger((prev) => prev + 1);
  };

  // Handle custom group updates/deletions
  const handleGroupUpdated = () => {
    // Trigger refresh of groups in selector
    setGroupsRefreshTrigger((prev) => prev + 1);
  };

  async function submitNewTile(): Promise<void> {
    // Check if there's text in the tag input field and add it to tags
    const tagInput = document.querySelector('input[name="tags"]') as HTMLInputElement | null;
    const currentTags = [...localTileData.tags];

    if (tagInput && tagInput.value.trim()) {
      currentTags.push(tagInput.value.trim());
      // Clear the input field
      tagInput.value = '';
    }

    const { gameMode, intensity } = sharedFilters;
    const { action } = localTileData;

    if (!gameMode || !selectedGroup || !intensity || !action) {
      return setSubmitMessage({
        message: t('allFieldsRequired', 'All fields are required'),
        type: 'error',
      });
    }

    // Check if validation message exists
    if (validationMessage) {
      return setSubmitMessage({
        message: validationMessage,
        type: 'error',
      });
    }

    if (updateTileId == null && tileExists(selectedGroup.id, intensity, action)) {
      return setSubmitMessage({ message: t('actionExists'), type: 'error' });
    }

    const data: CustomTile = {
      group_id: selectedGroup.id, // Use the selected group's ID
      intensity: Number(intensity),
      action,
      tags: currentTags,
      isCustom: 1,
    };

    try {
      // Validate with custom groups system
      const validation = await validateCustomTileWithGroups(
        data,
        settings.locale || 'en',
        gameMode
      );

      if (!validation.isValid) {
        return setSubmitMessage({
          message: validation.errors.join(', '),
          type: 'error',
        });
      }

      // send action to firebase for review
      if (updateTileId === null) {
        // Create a simple label for Firebase submission
        const groupLabel = `${selectedGroup.name} - Level ${intensity}`;
        submitCustomAction(groupLabel, action);

        // store locally for user's board
        await addCustomTile(data);
      } else {
        await updateCustomTile(updateTileId, data);
      }

      boardUpdated();

      // Clear form after successful submission
      setLocalTileData({
        action: '',
        tags: [t('custom')],
      });
      setUpdateTileId(null);
      setEditTileData?.(null);

      return setSubmitMessage({
        message: updateTileId ? t('customUpdated') : t('customAdded'),
        type: 'success',
      });
    } catch (error) {
      console.error('Error saving custom tile:', error);
      return setSubmitMessage({
        message: t('errorSavingTile'),
        type: 'error',
      });
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    switch (event.key) {
      case ',':
      case 'Enter': {
        event.preventDefault();
        event.stopPropagation();
        if (event.currentTarget.value.length > 0) {
          setLocalTileData((prev) => ({
            ...prev,
            tags: [...prev.tags, event.currentTarget.value],
          }));
          // Clear the input after adding the tag
          event.currentTarget.value = '';
        }
        break;
      }
      default:
    }
  };

  const handleTagInputBlur = (event: FocusEvent<HTMLInputElement>): void => {
    if (event.target.value.length > 0) {
      setLocalTileData((prev) => ({
        ...prev,
        tags: [...prev.tags, event.target.value],
      }));
      // Clear the input after adding the tag
      event.target.value = '';
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
              value={localTileData.action}
              onChange={(event) => {
                setLocalTileData({ ...localTileData, action: event.target.value });
              }}
              onKeyUp={(event) => {
                if (event.key === 'Enter') {
                  submitNewTile();
                }
              }}
            />

            <Autocomplete
              id="tags"
              disableCloseOnSelect
              multiple
              freeSolo
              options={tagList}
              value={localTileData.tags}
              onChange={(_event, newValues) => {
                setLocalTileData({ ...localTileData, tags: newValues as string[] });
              }}
              renderInput={(params) => {
                params.inputProps.onKeyDown = handleKeyDown;
                params.inputProps.onBlur = handleTagInputBlur;
                return <TextField {...params} label={t('tags')} />;
              }}
              sx={{ pb: 2 }}
              clearOnBlur
              blurOnSelect
              openOnFocus
              disablePortal={false}
              componentsProps={{
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
              display="flex"
              flexDirection={{ xs: 'column', sm: 'row' }}
              justifyContent={{ xs: 'stretch', sm: 'space-evenly' }}
              gap={1}
            >
              <Button variant="outlined" type="button" onClick={() => setGroupDialogOpen(true)}>
                {t('manageGroups.title')}
              </Button>
              <Button variant="contained" type="button" onClick={() => clear()}>
                <Trans i18nKey="clear" />
              </Button>
              <Button variant="contained" type="button" onClick={submitNewTile}>
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
