import { Autocomplete, Box, Button, TextField, Typography } from '@mui/material';
import { submitCustomAction } from '@/services/firebase';
import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Accordion from '@/components/Accordion';
import AccordionSummary from '@/components/Accordion/Summary';
import AccordionDetails from '@/components/Accordion/Details';
import { addCustomTile, updateCustomTile } from '@/stores/customTiles';

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

  const [formData, setFormData] = useState({
    tileOption: null,
    action: '',
    tags: [],
  });

  useEffect(() => {
    const tilesArray = Array.isArray(customTiles) ? customTiles : [];
    const editTile = tilesArray.find(({ id }) => id === updateTileId);
    const editTileOption = mappedGroups.find(
      ({ value, intensity }) => value === editTile?.group && intensity === editTile?.intensity
    );
    setFormData({
      tileOption: editTileOption || null,
      action: editTile?.action || '',
      tags: editTile?.tags || [],
    });
  }, [updateTileId]);

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

    const { tileOption, action } = formData;

    if (!tileOption || !action) {
      return setSubmitMessage({ message: t('bothRequired'), type: 'error' });
    }

    if (updateTileId == null && tileExists(tileOption, action)) {
      return setSubmitMessage({ message: t('actionExists'), type: 'error' });
    }

    const option = mappedGroups.find(({ label }) => label === tileOption.label);

    const data = {
      group: option.value,
      intensity: option.intensity,
      action,
      tags: currentTags,
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
          <Autocomplete
            id="tileOption"
            name="tileOption"
            options={mappedGroups}
            getOptionLabel={(option) => option.label}
            groupBy={(option) => option.group}
            value={formData.tileOption}
            onChange={(_event, newValue) => setFormData({ ...formData, tileOption: newValue })}
            renderInput={(params) => <TextField {...params} label={t('group')} required />}
            isOptionEqualToValue={(option) => option.label}
            sx={{ py: 2 }}
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
              params.inputProps.onBlur = (event) => {
                handleTagInputBlur(event);
                // Force close the dropdown
                const autocompleteElement = document.getElementById('tags');
                if (autocompleteElement) {
                  const closeButton = autocompleteElement.querySelector('.MuiAutocomplete-clearIndicator');
                  if (closeButton) {
                    closeButton.click();
                  }
                }
              };
              return <TextField {...params} label={t('tags')} />;
            }}
            sx={{ pb: 2 }}
            clearOnBlur
            blurOnSelect
            openOnFocus={false}
            forcePopupIcon={false}
            disablePortal
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
