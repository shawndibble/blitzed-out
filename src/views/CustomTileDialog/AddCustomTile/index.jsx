import { Autocomplete, Box, Button, TextField, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { submitCustomAction } from '@/services/firebase';
import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Accordion from '@/components/Accordion';
import AccordionSummary from '@/components/Accordion/Summary';
import AccordionDetails from '@/components/Accordion/Details';
import { addCustomTile, updateCustomTile } from '@/stores/customTiles';
import useGameSettings from '@/hooks/useGameSettings';
import groupActionsFolder from '@/helpers/actionsFolder';

export default function AddCustomTile({
  setSubmitMessage,
  boardUpdated,
  customTiles,
  mappedGroups,
  expanded,
  handleChange,
  tagList,
  updateTileId,
  setUpdateTileId,
}) {
  const { t } = useTranslation();
  const { settings } = useGameSettings();

  const [formData, setFormData] = useState({
    gameMode: settings.gameMode || 'online',
    tileOption: null,
    action: '',
    tags: [],
  });

  useEffect(() => {
    const tilesArray = Array.isArray(customTiles) ? customTiles : [];
    const editTile = tilesArray.find(({ id }) => id === updateTileId);
    
    if (editTile) {
      // Get the game mode from the tile being edited
      const tileGameMode = editTile.gameMode || settings.gameMode;
      
      // Get the appropriate groups for this game mode
      const gameModeGroups = groupActionsFolder(mappedGroups[tileGameMode] || {});
      
      // Find the matching option in the groups for this game mode
      const editTileOption = gameModeGroups.find(
        ({ value, intensity }) => value === editTile.group && intensity === editTile.intensity
      );
      
      setFormData({
        gameMode: tileGameMode,
        tileOption: editTileOption || null,
        action: editTile.action || '',
        tags: editTile.tags || [],
      });
    } else {
      // For new tiles, just set the game mode to the current setting
      setFormData(prev => ({
        ...prev,
        gameMode: settings.gameMode
      }));
    }
  }, [updateTileId, settings.gameMode, mappedGroups]);

  function tileExists(newGroup, newAction) {
    const tilesArray = Array.isArray(customTiles) ? customTiles : [];
    return tilesArray.find(
      ({ group, intensity, action }) =>
        `${group} - ${intensity}` === newGroup && action === newAction
    );
  }

  function clear() {
    setUpdateTileId(null);
    setFormData({
      gameMode: settings.gameMode,
      tileOption: null,
      action: '',
      tags: [],
    });
  }

  async function submitNewTile(event) {
    // Check if there's text in the tag input field and add it to tags
    const tagInput = document.querySelector('input[name="tags"]');
    let currentTags = [...formData.tags];
    
    if (tagInput && tagInput.value.trim()) {
      currentTags.push(tagInput.value.trim());
      // Clear the input field
      tagInput.value = '';
    }

    const { gameMode, tileOption, action } = formData;

    if (!gameMode || !tileOption || !action) {
      return setSubmitMessage({ message: t('allFieldsRequired', 'All fields are required'), type: 'error' });
    }

    if (updateTileId == null && tileExists(tileOption, action)) {
      return setSubmitMessage({ message: t('actionExists'), type: 'error' });
    }

    // Get the appropriate groups for this game mode
    const gameModeGroups = groupActionsFolder(mappedGroups[gameMode] || {});
    
    // Find the matching option in the groups for this game mode
    const option = gameModeGroups.find(({ label }) => label === tileOption.label);

    if (!option) {
      return setSubmitMessage({ message: t('invalidOption', 'Invalid option selected'), type: 'error' });
    }

    const data = {
      group: option.value,
      intensity: option.intensity,
      action,
      tags: currentTags,
      gameMode, // Store the game mode with the tile
    };

    // send action to firebase for review
    if (updateTileId === null) {
      submitCustomAction(option.label, action);
      // // store locally for user's board
      addCustomTile(data);
    } else {
      updateCustomTile(updateTileId, data);
    }

    boardUpdated();

    return setSubmitMessage({ message: t('customAdded'), type: 'success' });
  }

  const handleKeyDown = (event) => {
    switch (event.key) {
      case ',':
      case ' ':
      case 'Enter': {
        event.preventDefault();
        event.stopPropagation();
        if (event.target.value.length > 0) {
          setFormData({
            ...formData,
            tags: [...formData.tags, event.target.value],
          });
          // Clear the input after adding the tag
          event.target.value = '';
        }
        break;
      }
      default:
    }
  };

  const handleTagInputBlur = (event) => {
    if (event.target.value.length > 0) {
      setFormData({
        ...formData,
        tags: [...formData.tags, event.target.value],
      });
      // Clear the input after adding the tag
      event.target.value = '';
    }
    
    // Give time for any click events to process before closing dropdown
    setTimeout(() => {
      // Close any open dropdown
      const popperElement = document.querySelector('.MuiAutocomplete-popper');
      if (popperElement) {
        popperElement.style.display = 'none';
      }
    }, 150);
  };

  return (
    <Accordion expanded={expanded === 'ctAdd'} onChange={handleChange('ctAdd')}>
      <AccordionSummary aria-controls="ctAdd-content" id="ctAdd-header">
        <Typography>
          <Trans i18nKey={updateTileId ? 'ctUpdate' : 'ctAdd'} />
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box component="form" method="post" className="settings-box">
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="game-mode-label">{t('gameMode', 'Game Mode')}</InputLabel>
            <Select
              labelId="game-mode-label"
              id="gameMode"
              name="gameMode"
              value={formData.gameMode}
              label={t('gameMode', 'Game Mode')}
              onChange={(event) => {
                setFormData({ 
                  ...formData, 
                  gameMode: event.target.value,
                  tileOption: null // Reset tile option when game mode changes
                });
              }}
            >
              <MenuItem value="online">{t('gameMode.online', 'Online')}</MenuItem>
              <MenuItem value="local">{t('gameMode.local', 'Local')}</MenuItem>
            </Select>
          </FormControl>

          <Autocomplete
            id="tileOption"
            name="tileOption"
            options={groupActionsFolder(mappedGroups[formData.gameMode] || {})}
            getOptionLabel={(option) => option.label}
            groupBy={(option) => option.group}
            value={formData.tileOption}
            onChange={(_event, newValue) => setFormData({ ...formData, tileOption: newValue })}
            renderInput={(params) => <TextField {...params} label={t('group')} required />}
            isOptionEqualToValue={(option, value) => option.label === value.label}
            sx={{ mb: 2 }}
          />

          <TextField
            id="action"
            name="action"
            required
            fullWidth
            label={t('action')}
            sx={{ pb: 2 }}
            value={formData.action}
            onChange={(event) => {
              setFormData({ ...formData, action: event.target.value });
            }}
          />

          <Autocomplete
            id="tags"
            name="tags"
            disableCloseOnSelect
            multiple
            freeSolo
            options={tagList}
            value={formData.tags}
            onChange={(_event, newValues) => {
              setFormData({ ...formData, tags: newValues });
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

          <Box display="flex" justifyContent="space-evenly">
            <Button variant="contained" type="button" onClick={() => clear()}>
              Clear
            </Button>
            <Button variant="contained" type="button" onClick={(event) => submitNewTile(event)}>
              <Trans i18nKey={updateTileId ? 'ctUpdate' : 'ctAdd'} />
            </Button>
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
