import React, { useEffect } from 'react';
import { Box, Button, FormControlLabel, Switch, Typography } from '@mui/material';
import { Trans } from 'react-i18next';
import ButtonRow from 'components/ButtonRow';
import { arraysEqual } from 'helpers/arrays';
import useSubmitGameSettings from 'hooks/useSubmitGameSettings';

export default function FinishStep({
  formData,
  setFormData,
  prevStep,
  actionsList,
  closeSettings,
}) {
  const no = [100, 100];
  const yes = [0, 0];
  const submitSettings = useSubmitGameSettings();

  function handleChange(event) {
    setFormData({
      ...formData,
      finishRange: event.target.checked ? yes : no,
    });
  }

  // on load, if don't have a finishRange OR if it is something from advanced settings, replace it.
  useEffect(() => {
    if (!arraysEqual(formData.finishRange, yes) || !arraysEqual(formData.finishRange, no)) {
      setFormData({
        ...formData,
        finishRange: no,
      });
    }
  }, []);

  async function handleSubmit() {
    await submitSettings(formData, actionsList);
    closeSettings();
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
          control={
            <Switch
              checked={arraysEqual(formData.finishRange, yes) || false}
              onChange={handleChange}
            />
          }
          label={
            <Trans i18nKey={arraysEqual(formData.finishRange, yes) ? 'yesOrgasm' : 'noOrgasm'} />
          }
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
