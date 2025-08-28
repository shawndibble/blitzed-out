import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

import ButtonRow from '@/components/ButtonRow';
import { Settings } from '@/types/Settings';
import { arraysEqual } from '@/helpers/arrays';
import useSubmitGameSettings from '@/hooks/useSubmitGameSettings';
import { useParams } from 'react-router-dom';

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
  const { t } = useTranslation();
  const { id: currentRoom } = useParams<{ id: string }>();

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

  const handleSubmit = async (): Promise<void> => {
    setIsLoading(true);

    try {
      await submitSettings(formData, actionsList);

      // Check if navigation will occur (room change)
      const willNavigate =
        currentRoom !== undefined && currentRoom?.toUpperCase() !== formData.room?.toUpperCase();

      if (typeof close === 'function') {
        if (willNavigate) {
          // Use flushSync to ensure DOM is properly reconciled before navigation
          // https://reactjs.org/docs/flush-sync.html - Forces synchronous DOM updates
          flushSync(() => {
            close();
          });
          // Let the browser paint the close(), then the route change
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        } else {
          // No navigation, safe to close immediately
          close();
        }
      }
    } catch (error) {
      console.error('Error submitting settings:', error);
      // On error, close immediately since no navigation occurred
      if (typeof close === 'function') {
        // Ensure DOM is reconciled before closing on error
        // https://reactjs.org/docs/flush-sync.html - Forces synchronous DOM updates
        flushSync(() => {
          close();
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const orgasmOptions = [
    {
      id: 'noOrgasm',
      title: 'noOrgasm',
      description: t('noOrgasmDesc'),
      isSelected: !yesFinishRange,
    },
    {
      id: 'yesOrgasm',
      title: 'yesOrgasm',
      description: t('yesOrgasmDesc'),
      isSelected: yesFinishRange,
    },
  ];

  return (
    <Box sx={{ minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        <Trans i18nKey="WillYouOrgasm" />
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {orgasmOptions.map((option) => (
          <Grid size={{ xs: 12, sm: 6 }} key={option.id}>
            <Card
              sx={{
                cursor: 'pointer',
                border: option.isSelected ? '3px solid' : '1px solid',
                borderColor: option.isSelected ? 'primary.main' : 'divider',
                backgroundColor: option.isSelected ? 'primary.50' : 'background.paper',
                transition: 'all 0.2s ease-in-out',
                height: '100%',
                transform: option.isSelected ? 'scale(1.02)' : 'scale(1)',
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'scale(1.02)',
                  boxShadow: 2,
                },
              }}
              onClick={() => {
                const newValue = option.id === 'yesOrgasm';
                setFormData({
                  ...formData,
                  finishRange: newValue ? yes : no,
                });
                setYesFinishRange(newValue);
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={1} alignItems="center" textAlign="center">
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t(option.title)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {option.description}
                  </Typography>
                  {option.isSelected && (
                    <Chip label={t('selected')} color="primary" size="small" sx={{ mt: 1 }} />
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ flexGrow: 1 }} />
      <ButtonRow>
        <Button onClick={prevStep} disabled={isLoading}>
          <Trans i18nKey="previous" />
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
          size="large"
          sx={{ px: 4 }}
        >
          <Trans i18nKey="buildGame" />
        </Button>
      </ButtonRow>
    </Box>
  );
}
