import {
  Autocomplete, Box, Button, TextField,
} from '@mui/material';
import { camelToPascal } from 'helpers/strings';
import { submitCustomAction } from 'services/firebase';
import { useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';

export default function CustomTile({
  setSubmitMessage, addCustomTile, customTiles, dataFolder,
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

    // send action to firebase for review
    submitCustomAction(tileOption.value, action.value);
    // store locally for user's board
    addCustomTile(tileOption.value, action.value);

    return setSubmitMessage({ message: t('customAdded'), type: 'success' });
  }

  const options = Object.entries(dataFolder).map(([key, value]) => {
    const intensities = Object.keys(value).filter((entry) => entry !== 'None');
    return intensities.map((intensity) => ({
      group: camelToPascal(key),
      value: `${camelToPascal(key)} - ${intensity}`,
    }));
  }).flat();

  options.push({ group: t('misc'), value: `${t('misc')} - ${t('all')}` });

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
        options={options}
        getOptionLabel={(option) => option.value}
        groupBy={(option) => option.group}
        renderInput={(params) => <TextField {...params} label="Group" required />}
        isOptionEqualToValue={(option) => option.value}
        sx={{ py: 2 }}
      />

      <TextField
        id="action"
        name="action"
        required
        fullWidth
        label="Action Tile"
        sx={{ pb: 2 }}
      />

      <Button fullWidth variant="contained" type="button" onClick={(event) => submitNewTile(event)}>
        <Trans i18nKey="addCustom" />
      </Button>
    </Box>
  );
}
