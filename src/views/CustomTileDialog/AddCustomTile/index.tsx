import { Autocomplete, Box, Button, TextField, Typography } from '@mui/material';
import { submitCustomAction } from '@/services/firebase';
import { useEffect, useState, KeyboardEvent, FocusEvent, useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Accordion from '@/components/Accordion';
import AccordionSummary from '@/components/Accordion/Summary';
import AccordionDetails from '@/components/Accordion/Details';
import CustomGroupSelector from '@/components/CustomGroupSelector';
import IntensitySelector from '@/components/IntensitySelector';
import CustomGroupDialog from '@/views/CustomGroupDialog';
import { addCustomTile, updateCustomTile } from '@/stores/customTiles';
import { useGameSettings } from '@/stores/settingsStore';
import { validateCustomTileWithGroups } from '@/services/validationService';
import { AddCustomTileProps, CustomTile } from '@/types/customTiles';
import { FormDataState } from '@/types/addCustomTile';
import { CustomGroupPull } from '@/types/customGroups';

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
}: AddCustomTileProps) {
  const { t } = useTranslation();
  const { settings } = useGameSettings();

  const [formData, setFormData] = useState<FormDataState>({
    gameMode: settings.gameMode || 'online',
    group: '',
    intensity: '',
    action: '',
    tags: [t('custom')],
  });

  // UI state for custom group management
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [groupsRefreshTrigger, setGroupsRefreshTrigger] = useState(0);

  // Migration is handled at app level - removed redundant migration call

  // Validate form data with debouncing to prevent excessive re-renders
  useEffect(() => {
    const validateForm = async () => {
      if (!formData.group || !formData.intensity || !formData.action) {
        setValidationMessage('');
        return;
      }

      try {
        const validation = await validateCustomTileWithGroups(
          {
            group: formData.group,
            intensity: Number(formData.intensity),
            action: formData.action,
            tags: formData.tags,
            gameMode: formData.gameMode,
            isCustom: 1,
          },
          settings.locale || 'en',
          formData.gameMode
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
    formData.group,
    formData.intensity,
    formData.action,
    formData.gameMode,
    formData.tags,
    settings.locale,
  ]);

  // Handle editing a tile
  useEffect(() => {
    const tilesArray = Array.isArray(customTiles) ? customTiles : [];
    const editTile = tilesArray.find(({ id }) => id === updateTileId);

    if (editTile) {
      // Get the game mode from the tile being edited
      const tileGameMode = editTile.gameMode || settings.gameMode;

      setFormData({
        gameMode: tileGameMode,
        group: editTile.group || '',
        intensity: editTile.intensity || '',
        action: editTile.action || '',
        tags: editTile.tags || [t('custom')],
      });
    } else {
      // For new tiles, just set the game mode to the current setting
      setFormData((prev) => ({
        ...prev,
        gameMode: settings.gameMode,
      }));
    }
  }, [updateTileId, settings.gameMode, customTiles, t]);

  function tileExists(
    group: string,
    intensity: string | number,
    newAction: string
  ): CustomTile | undefined {
    const tilesArray = Array.isArray(customTiles) ? customTiles : [];
    return tilesArray.find(
      (tile) => tile.group === group && tile.intensity === intensity && tile.action === newAction
    );
  }

  function clear(): void {
    setUpdateTileId(null);
    setFormData({
      gameMode: settings.gameMode,
      group: '',
      intensity: '',
      action: '',
      tags: [t('custom')],
    });
    setValidationMessage('');
  }

  // Handle custom group creation
  const handleGroupCreated = (group: CustomGroupPull) => {
    setFormData((prev) => ({
      ...prev,
      group: group.name,
      intensity: '',
    }));
    setGroupDialogOpen(false);
    // Trigger refresh of groups in selector
    setGroupsRefreshTrigger((prev) => prev + 1);
  };

  // Handle custom group updates/deletions
  const handleGroupUpdated = () => {
    // Trigger refresh of groups in selector
    setGroupsRefreshTrigger((prev) => prev + 1);
  };

  // Memoized intensity change handler to prevent unnecessary re-renders
  const handleIntensityChange = useCallback((intensity: number) => {
    setFormData((prev) => ({
      ...prev,
      intensity: intensity.toString(),
    }));
  }, []);

  async function submitNewTile(): Promise<void> {
    // Check if there's text in the tag input field and add it to tags
    const tagInput = document.querySelector('input[name="tags"]') as HTMLInputElement | null;
    const currentTags = [...formData.tags];

    if (tagInput && tagInput.value.trim()) {
      currentTags.push(tagInput.value.trim());
      // Clear the input field
      tagInput.value = '';
    }

    const { gameMode, group, intensity, action } = formData;

    if (!gameMode || !group || !intensity || !action) {
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

    if (updateTileId == null && tileExists(group, intensity, action)) {
      return setSubmitMessage({ message: t('actionExists'), type: 'error' });
    }

    const data: CustomTile = {
      group,
      intensity: Number(intensity),
      action,
      tags: currentTags,
      gameMode,
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
        const groupLabel = `${group} - Level ${intensity}`;
        submitCustomAction(groupLabel, action);

        // store locally for user's board
        await addCustomTile(data);
      } else {
        await updateCustomTile(updateTileId, data);
      }

      boardUpdated();

      setFormData((prev) => ({
        ...prev,
        action: '',
        tags: [t('custom')],
      }));

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
          setFormData((prev) => ({
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
      setFormData((prev) => ({
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
            <TextField
              select
              label={t('customTiles.gameMode')}
              value={formData.gameMode}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  gameMode: e.target.value,
                  group: '',
                  intensity: '',
                }));
              }}
              fullWidth
              sx={{ mb: 2 }}
            >
              <option value="online">{t('online')}</option>
              <option value="local">{t('local')}</option>
              <option value="solo">{t('solo')}</option>
            </TextField>

            {/* Custom Group Selection */}
            <CustomGroupSelector
              value={formData.group}
              onChange={(groupName) => {
                setFormData((prev) => ({
                  ...prev,
                  group: groupName,
                  intensity: '',
                }));
              }}
              locale={settings.locale || 'en'}
              gameMode={formData.gameMode}
              refreshTrigger={groupsRefreshTrigger}
            />

            {/* Intensity Selection */}
            <Box sx={{ mt: 2 }}>
              <IntensitySelector
                groupName={formData.group}
                value={Number(formData.intensity) || 0}
                onChange={handleIntensityChange}
                locale={settings.locale || 'en'}
                gameMode={formData.gameMode}
              />
            </Box>

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
              value={formData.action}
              onChange={(event) => {
                setFormData({ ...formData, action: event.target.value });
              }}
            />

            <Autocomplete
              id="tags"
              disableCloseOnSelect
              multiple
              freeSolo
              options={tagList}
              value={formData.tags}
              onChange={(_event, newValues) => {
                setFormData({ ...formData, tags: newValues as string[] });
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
                {t('manageGroups')}
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
        gameMode={formData.gameMode}
      />
    </>
  );
}
