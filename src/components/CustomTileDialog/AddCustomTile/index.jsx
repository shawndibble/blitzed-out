import {
  Autocomplete, Box, Button, TextField,
} from '@mui/material';
import { submitCustomAction } from 'services/firebase';
import { useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';

export default function CustomTile({
  setSubmitMessage, addCustomTile, customTiles, mappedGroups,
}) {
  const formData = useRef();
  const { t } = useTranslation();

  function tileExists(newGroup, newAction) {
    return customTiles.find(({ group, intensity, action }) => `${group} - ${intensity}` === newGroup && action === newAction);
  }

  async function submitNewTile() {
    const { tileOption, action } = formData.current;

    if (!tileOption.value || !action.value) {
      return setSubmitMessage({ message: t('bothRequired'), type: 'error' });
    }

    if (tileExists(tileOption.value, action.value)) {
      return setSubmitMessage({ message: t('actionExists'), type: 'error' });
    }

    const option = mappedGroups.find(({ label }) => label === tileOption.value);

    // send action to firebase for review
    submitCustomAction(option.label, action.value);
    // store locally for user's board
    addCustomTile(option.value, option.intensity, action.value);

    return setSubmitMessage({ message: t('customAdded'), type: 'success' });
  }

  return (
    <Box
      component="form"
      method="post"
      className="settings-box"
      ref={formData}
    >
      <Autocomplete
        id="tileOption"
        name="tileOption"
        options={mappedGroups}
        getOptionLabel={(option) => option.label}
        groupBy={(option) => option.group}
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
      />

      <Button fullWidth variant="contained" type="button" onClick={(event) => submitNewTile(event)}>
        <Trans i18nKey="addCustom" />
      </Button>
    </Box>
  );
}
