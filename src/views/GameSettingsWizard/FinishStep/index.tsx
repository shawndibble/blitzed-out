import { useEffect, ChangeEvent } from 'react';
import { Box, Button, FormControlLabel, Switch, Typography } from '@mui/material';
import { Trans } from 'react-i18next';
import ButtonRow from '@/components/ButtonRow';
import { arraysEqual } from '@/helpers/arrays';
import useSubmitGameSettings from '@/hooks/useSubmitGameSettings';
import { Settings } from '@/types/Settings';

interface FinishStepProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
  prevStep: () => void;
  actionsList: Record<string, any>;
  close?: () => void;
}

export default function FinishStep({
  formData,
  setFormData,
  prevStep,
  actionsList,
  close,
}: FinishStepProps): JSX.Element {
  const no: [number, number] = [100, 100];
  const yes: [number, number] = [0, 0];
  const yesFinishRange = arraysEqual(formData.finishRange, yes);
  const submitSettings = useSubmitGameSettings();

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
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
      newData.finishRange = no;
    }
    setFormData(newData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, no, yesFinishRange]); // Removed setFormData to avoid unnecessary rerenders

  async function handleSubmit(): Promise<void> {
    await submitSettings(formData, actionsList);
    if (typeof close === 'function') close();
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
