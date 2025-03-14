import {
  Autocomplete,
  Box,
  Button,
  TextField,
  Typography,
  FormControl,
} from '@mui/material';
import TileCategorySelection from '@/Components/TileCategorySelection';
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
    group: '',
    intensity: '',
    action: '',
    tags: [],
  });
  
  // For the TileCategorySelection component
  const [groups, setGroups] = useState({});

  // Process custom tiles to create groups structure for TileCategorySelection
  useEffect(() => {
    const tilesArray = Array.isArray(customTiles) ? customTiles : [];
    
    // Create groups structure similar to what getCustomTileGroups returns
    const processedGroups = tilesArray.reduce((acc, tile) => {
      const { group, intensity } = tile;
      
      if (!acc[group]) {
        acc[group] = { count: 0, intensities: {} };
      }
      
      acc[group].count += 1;
      
      if (!acc[group].intensities[intensity]) {
        acc[group].intensities[intensity] = 0;
      }
      
      acc[group].intensities[intensity] += 1;
      
      return acc;
    }, {});
    
    setGroups(processedGroups);
  }, [customTiles]);

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
        tags: editTile.tags || [],
      });
    } else {
      // For new tiles, just set the game mode to the current setting
      setFormData((prev) => ({
        ...prev,
        gameMode: settings.gameMode,
        group: '',
        intensity: '',
      }));
    }
  }, [updateTileId, settings.gameMode, customTiles]);

  function tileExists(group, intensity, newAction) {
    const tilesArray = Array.isArray(customTiles) ? customTiles : [];
    return tilesArray.find(
      (tile) => tile.group === group && tile.intensity === intensity && tile.action === newAction
    );
  }

  function clear() {
    setUpdateTileId(null);
    setFormData({
      gameMode: settings.gameMode,
      group: '',
      intensity: '',
      action: '',
      tags: [],
    });
  }

  async function submitNewTile() {
    // Check if there's text in the tag input field and add it to tags
    const tagInput = document.querySelector('input[name="tags"]');
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

    if (updateTileId == null && tileExists(group, intensity, action)) {
      return setSubmitMessage({ message: t('actionExists'), type: 'error' });
    }

    const data = {
      group,
      intensity,
      action,
      tags: currentTags,
      gameMode, // Store the game mode with the tile
    };

    // send action to firebase for review
    if (updateTileId === null) {
      // Get the label from mappedGroups using group and intensity
      const groupLabel = mappedGroups && mappedGroups[gameMode] ? 
        (groupActionsFolder(mappedGroups[gameMode])?.find(
          (g) => g.value === group && g.intensity === Number(intensity)
        )?.label || `${group} - Level ${intensity}`) : 
        `${group} - Level ${intensity}`;
      
      submitCustomAction(groupLabel, action);
      // store locally for user's board
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
          <TileCategorySelection
            gameMode={formData.gameMode}
            groupFilter={formData.group}
            intensityFilter={formData.intensity}
            groups={groups}
            mappedGroups={mappedGroups}
            onGameModeChange={(value) => {
              setFormData({
                ...formData,
                gameMode: value,
                group: '',
                intensity: '',
              });
            }}
            onGroupChange={(value) => {
              setFormData({
                ...formData,
                group: value,
              });
            }}
            onIntensityChange={(value) => {
              setFormData({
                ...formData,
                intensity: value,
              });
            }}
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
              <Trans i18nKey="clear" />
            </Button>
            <Button variant="contained" type="button" onClick={submitNewTile}>
              <Trans i18nKey={updateTileId ? 'ctUpdate' : 'ctAdd'} />
            </Button>
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
