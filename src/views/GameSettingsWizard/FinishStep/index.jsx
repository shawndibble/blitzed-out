import React, { useEffect } from 'react';
import { Box, Button, FormControlLabel, Switch, Typography } from '@mui/material';
import { Trans } from 'react-i18next';
import ButtonRow from 'components/ButtonRow';
import { arraysEqual } from 'helpers/arrays';
import useSubmitGameSettings from 'hooks/useSubmitGameSettings';

function shouldPurgeAction(formData, entry) {
  const { gameMode, isNaked } = formData;
  return (
    (gameMode === 'online' && ['foreplay', 'sex'].includes(entry.type)) ||
    (gameMode === 'local' && isNaked && ['solo', 'foreplay'].includes(entry.type)) ||
    (gameMode === 'local' && !isNaked && ['solo', 'sex'].includes(entry.type))
  );
}

export default function FinishStep({ formData, setFormData, prevStep, actionsList, close }) {
  const no = [100, 100];
  const yes = [0, 0];
  const yesFinishRange = arraysEqual(formData.finishRange, yes);
  const submitSettings = useSubmitGameSettings();

  function handleChange(event) {
    setFormData({
      ...formData,
      finishRange: event.target.checked ? yes : no,
    });
  }

  // on load, if don't have a finishRange OR if it is something from advanced settings, replace it.
  useEffect(() => {
    let newData = {
      ...formData,
      boardUpdated: true,
    };
    if (!yesFinishRange || !arraysEqual(formData.finishRange, no)) {
      newData['finishRange'] = no;
    }
    setFormData(newData);
  }, []); // only run on load once.

  async function handleSubmit() {
    // purge actions that we shouldn't be able to access.
    const newFormData = Object.entries(formData).reduce((acc, [key, data]) => {
      // only allow non-purged actions to be submitted.
      if (!shouldPurgeAction(formData, data)) {
        acc[key] = data;
      }
      return acc;
    }, {});

    await submitSettings(newFormData, actionsList);
    close();
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ my: 2 }}>
        <Trans i18nKey="WillYouOrgasm" />
      </Typography>
      <Typography variant="body2">
        <Trans i18nKey="orgasmDisclaimer" />
      </Typography>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          my: 1,
        }}
      >
        <FormControlLabel
          control={<Switch checked={yesFinishRange || false} onChange={handleChange} />}
          label={<Trans i18nKey={yesFinishRange ? 'yesOrgasm' : 'noOrgasm'} />}
        />
      </Box>

      <ButtonRow>
        <Button onClick={prevStep}>
          <Trans i18nKey="previous" />
        </Button>
        <Button variant="contained" onClick={handleSubmit}>
          <Trans i18nKey="buildGame" />
        </Button>
      </ButtonRow>
    </Box>
  );
}
