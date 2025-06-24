import { useEffect, useState, ChangeEvent } from 'react';
import { Box, Button, FormControlLabel, Switch, Typography, CircularProgress } from '@mui/material';
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
  const [yesFinishRange, setYesFinishRange] = useState<boolean>(
    arraysEqual(formData?.finishRange || [], yes)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const submitSettings = useSubmitGameSettings();

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    setFormData({
      ...formData,
      finishRange: event.target.checked ? yes : no,
    });
    setYesFinishRange(event.target.checked);
  }

  // on load, if don't have a finishRange OR if it is something from advanced settings, replace it.
  useEffect(() => {
    let newData = {
      ...formData,
      boardUpdated: true,
    };
    if (!yesFinishRange || !arraysEqual(formData.finishRange || [], no)) {
      newData.finishRange = no;
    }
    setFormData(newData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(): Promise<void> {
    setIsLoading(true);
    try {
      await submitSettings(formData, actionsList);
    } catch (error) {
      console.error('Error submitting settings:', error);
    } finally {
      setIsLoading(false);
    }
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
          control={<Switch checked={yesFinishRange} onChange={handleChange} />}
          label={<Trans i18nKey={'yesOrgasm'} />}
        />
      </Box>

      <ButtonRow>
        <Button onClick={prevStep} disabled={isLoading}>
          <Trans i18nKey="previous" />
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          <Trans i18nKey="buildGame" />
        </Button>
      </ButtonRow>
    </Box>
  );
}
