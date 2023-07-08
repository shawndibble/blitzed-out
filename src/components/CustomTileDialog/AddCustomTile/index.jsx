import {
  Autocomplete, Box, Button, TextField,
} from '@mui/material';
import { camelToPascal } from 'helpers/strings';
import { submitCustomAction } from 'services/firebase';
import { useRef } from 'react';

export default function CustomTile({
  setSubmitMessage, addCustomTile, customTiles, dataFolder,
}) {
  const formData = useRef();

  function tileExists(newGroup, newAction) {
    return customTiles.find(({ group, intensity, action }) => `${group} - ${intensity}` === newGroup && action === newAction);
  }

  async function submitNewTile() {
    const { tileOption, action } = formData.current;

    if (!tileOption.value || !action.value) {
      return setSubmitMessage({ message: 'Both fields are required', type: 'error' });
    }

    if (tileExists(tileOption.value, action.value)) {
      return setSubmitMessage({ message: 'That action already exist', type: 'error' });
    }

    // send action to firebase for review
    submitCustomAction(tileOption.value, action.value);
    // store locally for user's board
    addCustomTile(tileOption.value, action.value);

    return setSubmitMessage({ message: 'Custom tile added to your local game.', type: 'success' });
  }

  const options = Object.entries(dataFolder).map(([key, value]) => {
    const intensities = Object.keys(value).filter((entry) => entry !== 'None');
    return intensities.map((intensity) => ({
      group: camelToPascal(key),
      value: `${camelToPascal(key)} - ${intensity}`,
    }));
  }).flat();

  options.push({ group: 'Miscellaneous', value: 'Miscellaneous - All' });

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
        Add Custom Tile
      </Button>
    </Box>
  );
}
