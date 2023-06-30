import {
  Autocomplete, Box, Button, TextField, Typography,
} from '@mui/material';
import { dataFolder } from '../../services/buildGame';
import { camelToPascal } from '../../helpers/strings';
import { submitSuggestion } from '../../services/firebase';

export default function CustomTile({ closeDialog, setSubmitMessage }) {
  async function handleSubmit(event) {
    event.preventDefault();

    const grouping = event.target.elements.namedItem('tileOption').value;
    const suggestion = event.target.elements.namedItem('suggestion').value;

    submitSuggestion(grouping, suggestion);

    setSubmitMessage('Tile suggestion sent.');
    closeDialog();
  }

  const options = Object.entries(dataFolder).map(([key, value]) => {
    const intensities = Object.keys(value).filter((entry) => entry !== 'None');
    return intensities.map((intensity) => ({ title: intensity, group: camelToPascal(key) }));
  }).flat();

  return (
    <>
      <Typography variant="h5" sx={{ textAlign: 'center' }}>Suggest a Tile</Typography>
      <Typography variant="body">Submit new tile ideas to be reviewed and possibly added to future game versions.</Typography>

      <Box
        component="form"
        method="post"
        // eslint-disable-next-line react/jsx-no-bind
        onSubmit={handleSubmit}
        className="settings-box"
      >
        <Autocomplete
          id="tileOption"
          name="tileOption"
          options={options}
          getOptionLabel={(option) => `${option.group} - ${option.title}`}
          groupBy={(option) => option.group}
          renderInput={(params) => <TextField {...params} label="Action Entry" required />}
          isOptionEqualToValue={(option) => `${option.group} - ${option.title}`}
          sx={{ py: 2 }}
        />

        <TextField
          id="suggestion"
          name="suggestion"
          required
          fullWidth
          label="Suggested Action"
          sx={{ pb: 2 }}
        />

        <Button fullWidth variant="contained" type="submit">
          Submit
        </Button>
      </Box>
    </>
  );
}
